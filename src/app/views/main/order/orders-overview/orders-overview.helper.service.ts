import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { TransactionEntity } from '@services/app-layer/entities/transaction';
import { SearchService } from '@services/app-layer/search/search.service';
import { debounceTime, first, map, tap } from 'rxjs/operators';
import { Environment } from '@services/app-layer/app-layer.environment';
import { TransactionFilter } from '@services/app-layer/app-layer.filters';
import { RoleInTransaction } from '@services/app-layer/app-layer.enums';
import { FilterBuilderHelper } from '@services/helpers/utils/filter-builder-helper';
import { AccessControlScope } from '@services/app-layer/permission/permission.interface';
import { ObjectUtil } from '@services/helpers/utils/object-util';
import { Utils } from '@services/helpers/utils/utils';

export class OrdersViewState {
  public filters = new TransactionFilter();
  public filtersState = {
    isStatesFilterVisible: false,
    isTypesFilterVisible: false,
    isDateFilterVisible: true,
    isOwnerFilterVisible: true
  };
  public grid = null;
}

@Injectable({
  providedIn: 'root'
})
export class OrdersOverviewHelperService {
  private _lastRefreshedTime: Date;
  private resetTimer$ = new Subject<void>();
  private latestLoadedTransactions$: BehaviorSubject<TransactionEntity[]> = new BehaviorSubject([]);
  private latestLoadedTransactionIds$: BehaviorSubject<any[]> = new BehaviorSubject([]);

  setLastRefreshedTime(time: Date) {
    this._lastRefreshedTime = time;
  }

  constructor(private searchService: SearchService) {
    this.resetTimer$.pipe(debounceTime(Environment.cachedDataResetTime)).subscribe(() => this.resetCachedData());
  }

  public resetCachedData(): void {
    this.latestLoadedTransactionIds$.next([]);
    this.latestLoadedTransactions$.next([]);
  }

  public setLoadedTxByFilters(value: TransactionEntity[]): void {
    this.latestLoadedTransactions$.next(value);
    this.resetTimer$.next();
  }
  public getLoadedTxsByFilters(): TransactionEntity[] {
    if (this.latestLoadedTransactions$.getValue()?.length) this.resetTimer$.next();
    return this.latestLoadedTransactions$.getValue();
  }

  public setLoadedTxIdsByFilters(value: string[]): void {
    this.latestLoadedTransactionIds$.next(value);
    this.resetTimer$.next();
  }
  public getLoadedTxIdsByFilters(): string[] {
    if (this.latestLoadedTransactionIds$.getValue()?.length) this.resetTimer$.next();
    return this.latestLoadedTransactionIds$.getValue();
  }

  lastUpdatedTimeDiffString(): string {
    return Utils.lastUpdatedTimeDiffString(this._lastRefreshedTime);
  }

  public loadTransactionsIds(viewState: OrdersViewState): Observable<string[]> {
    const payload = this.getSearchTxPayload(viewState);
    payload.fields = ['state'];
    return this.searchService.fetchTransactionData(payload).pipe(
      first(),
      map(txs => txs.map(tx => tx.id)),
      tap(txIds => this.latestLoadedTransactionIds$.next(txIds))
    );
  }

  public transactionRemoved(transactionId: string): void {
    const txs = this.getLoadedTxsByFilters();
    const txIds = this.getLoadedTxIdsByFilters();
    this.setLoadedTxByFilters(txs.filter(t => t.id !== transactionId));
    this.setLoadedTxIdsByFilters(txIds.filter(t => t !== transactionId));
  }

  public getSelectedFiltersCount(viewState: OrdersViewState, gridSearchText: string) {
    let filtersCount = 0;
    const defaultState = new OrdersViewState();

    Object.keys(viewState.filters).forEach(key => {
      const viewFilter = viewState.filters[key];
      const defaultFilter = defaultState.filters[key];

      if (!ObjectUtil.isDeepEquals(viewFilter, defaultFilter)) {
        if (viewFilter instanceof Date || defaultFilter instanceof Date) {
          if (new Date(viewFilter).getTime() !== new Date(defaultFilter).getTime()) {
            filtersCount++;
          }
        } else {
          filtersCount++;
        }
      }
    });

    if (gridSearchText) {
      filtersCount++;
    }

    return filtersCount;
  }

  public getSearchTxPayload(viewState: OrdersViewState): any {
    const filters: any = {
      children: {
        logicalOperator: 'and',
        items: [Utils.getSearchTxExcludeArchivedPayload(), Utils.getSearchTxCancelStateExcludePayload()]
      }
    };
    if (viewState.filters.states?.length) {
      const statesPayload = {
        children: {
          logicalOperator: 'or',
          items: viewState.filters.states.map(state => ({
            value: { comparisonOperator: 'eq', field: 'state', fieldValue: state }
          }))
        }
      };
      filters.children.items.push(statesPayload);
    }
    if (viewState.filters.owner) {
      const sellerPayload = {
        value: { field: 'sellerOnline', comparisonOperator: 'eq', fieldValue: Environment.getCurrentUser().id }
      };
      const buyerPayload = {
        value: { field: 'buyerOnline', comparisonOperator: 'eq', fieldValue: Environment.getCurrentUser().id }
      };
      const ownerPayload = {
        children: {
          logicalOperator: 'or',
          items: [sellerPayload, buyerPayload]
        }
      };
      filters.children.items.push(ownerPayload);
    }
    if (viewState.filters.role) {
      const field = viewState.filters.role === RoleInTransaction.Buyer ? 'customerOnline' : 'vendorOnline';
      filters.children.items.push({
        value: { field: field, comparisonOperator: 'eq', fieldValue: Environment.getCurrentUser().companyId }
      });
    }

    const dateFrom = FilterBuilderHelper.getDateForRange(viewState.filters.startDate);
    const dateTo = FilterBuilderHelper.getDateForRange(viewState.filters.endDate, true);

    if (dateFrom) {
      const startDatePayload = { value: { field: 'draftDate', comparisonOperator: 'gte', fieldValue: dateFrom } };
      filters.children.items.push(startDatePayload);
    }

    if (dateTo) {
      const endDatePayload = { value: { field: 'draftDate', comparisonOperator: 'lte', fieldValue: dateTo } };
      filters.children.items.push(endDatePayload);
    }
    return { filters: filters };
  }

  public getUserPermissions(): any {
    const userPermissions = { canReadTransactions: false, canCreateOrder: false, canReadOnlyOwnTx: false };
    const currentUser = Environment.getCurrentUser();
    const transactionPermissions = currentUser.normalizedAccessControlRoles.TRANSACTION.transactionSection.sectionGroup;

    userPermissions.canReadTransactions =
      transactionPermissions.readList.value === AccessControlScope.Company ||
      transactionPermissions.readList.value === AccessControlScope.Owner;

    userPermissions.canCreateOrder =
      (transactionPermissions.create.value === AccessControlScope.Company ||
        transactionPermissions.create.value === AccessControlScope.Owner) &&
      userPermissions.canReadTransactions;

    userPermissions.canReadOnlyOwnTx = transactionPermissions.readList.value === AccessControlScope.Owner;
    return userPermissions;
  }
}
