import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatMenuTrigger } from '@angular/material/menu';
import { NavigationHelperService } from '@services/helpers/navigation-helper/navigation-helper.service';
import { ObjectUtil } from '@services/helpers/utils/object-util';
import { TransactionsService } from '@app/services/app-layer/transactions/transactions.service';
import {
  OrderTypeEnum,
  RoleInTransaction,
  StockSubTypeEnum,
  TransactionStateEnum
} from '@app/services/app-layer/app-layer.enums';
import { TransactionEntity } from '@services/app-layer/entities/transaction';
import { Environment } from '@services/app-layer/app-layer.environment';
import { AccessControlScope } from '@services/app-layer/permission/permission.interface';
import { NotificationHelperService } from '@services/helpers/notification-helper/notification-helper.service';
import { User } from '@app/services/app-layer/entities/user';
import { SearchService } from '@services/app-layer/search/search.service';
import { MarketSearchComponent } from '@views/main/common/market-search/market-search.component';
import { Observable, Subject } from 'rxjs';
import { first, takeUntil, tap } from 'rxjs/operators';
import { AddTallyUnitModalComponent } from '@views/main/common/modals/add-tally-unit-modal/add-tally-unit-modal.component';
import { MarketSearchEntity } from '@services/app-layer/entities/market-search';
import { Utils } from '@services/helpers/utils/utils';

@Component({
  selector: 'app-market-search',
  templateUrl: './market-overview.component.html',
  styleUrls: ['./market-overview.component.scss']
})
export class MarketOverviewComponent implements OnInit, OnDestroy {
  public availableTransactions: TransactionEntity[];
  public currentUser: User;

  @ViewChild(MatMenuTrigger) marketMenu: MatMenuTrigger;
  @ViewChild(MarketSearchComponent) marketSearch: MarketSearchComponent;
  public contextMenuPosition = { x: '0px', y: '0px' };

  public selectedProductLot: MarketSearchEntity;
  public productActions: { onProductLotSelect: (productLot: MarketSearchEntity, event?) => void };

  public userPermissions = {
    canReadTransactions: false,
    canCreateTransactions: false,
    canUpdateTally: false,
    canUpdateOwnTally: false
  };

  private destroy$ = new Subject<void>();

  constructor(
    private dialog: MatDialog,
    private transactionsService: TransactionsService,
    private searchService: SearchService,
    private navigationHelperService: NavigationHelperService,
    private notificationHelperService: NotificationHelperService
  ) {}

  ngOnInit() {
    if (!Environment.getCurrentCompany().features.onlineTransactions) {
      this.navigationHelperService.navigateUserHome();
    }
    this.currentUser = Environment.getCurrentUser();
    this.setUserPermissions();
    this.productActions = {
      onProductLotSelect: (productLot: MarketSearchEntity, event?) => {
        if (!productLot || !productLot.lotId) return;
        this.selectedProductLot = productLot;
        this.setMenuCoordinates(event);
        this.userPermissions.canReadTransactions
          ? this.loadAvailableTransactions()
              .pipe(takeUntil(this.destroy$))
              .subscribe(() => this.openMenu())
          : this.openMenu();
      }
    };
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setMenuCoordinates(event): void {
    if (event) {
      this.contextMenuPosition.x = `${event.event.clientX}px`;
      this.contextMenuPosition.y = `${event.event.clientY}px`;
    }
  }
  private openMenu(): void {
    this.marketMenu.openMenu();
  }

  public addLotToTransactionTally(transaction: TransactionEntity): void {
    if (this.isProductLotInvalidForTx(transaction)) return;
    this.dialog.open(AddTallyUnitModalComponent, {
      width: '450px',
      disableClose: false,
      data: { transaction: transaction, availableProductsList: this.selectedProductLot.products }
    });
  }

  public async createNewTransaction() {
    const transaction = await this.transactionsService
      .createTransaction({
        type: OrderTypeEnum.Stock,
        subtype: StockSubTypeEnum.PurchaseOrder
      })
      .toPromise();
    this.dialog
      .open(AddTallyUnitModalComponent, {
        width: '450px',
        disableClose: false,
        data: { transaction: transaction, availableProductsList: this.selectedProductLot.products }
      })
      .afterClosed()
      .subscribe((added: boolean) => {
        added
          ? this.navigationHelperService.navigateToTransaction(transaction)
          : this.transactionsService.deleteTransaction(transaction.id).pipe(takeUntil(this.destroy$)).subscribe();
      });
  }

  onClosedMenu() {
    this.marketSearch.focusGrid();
  }

  /*
   * private helpers
   * */

  private setUserPermissions(): void {
    const permissions = this.currentUser.normalizedAccessControlRoles.TRANSACTION.transactionSection.sectionGroup;
    this.userPermissions.canReadTransactions =
      permissions.readList.value === AccessControlScope.Company ||
      permissions.readList.value === AccessControlScope.Owner;
    if (this.userPermissions.canReadTransactions) {
      this.userPermissions.canUpdateTally =
        permissions.updateTally.value === AccessControlScope.Company ||
        permissions.updateTally.value === AccessControlScope.Owner;
      this.userPermissions.canUpdateOwnTally = permissions.updateTally.value === AccessControlScope.Owner;
      this.userPermissions.canCreateTransactions =
        (this.userPermissions.canUpdateTally && permissions.create.value === AccessControlScope.Company) ||
        permissions.create.value === AccessControlScope.Owner;
    }
  }

  private loadAvailableTransactions(): Observable<any> {
    return this.searchService.fetchTransactionData(this.getSearchTxPayload()).pipe(
      first(),
      tap(transactions => {
        this.availableTransactions = transactions
          .map(t => new TransactionEntity().init(t))
          .filter(transaction => this.isTransactionValid(transaction));
      })
    );
  }

  private isProductLotInvalidForTx(transaction?: TransactionEntity): boolean {
    if (
      transaction &&
      transaction.role === RoleInTransaction.Buyer &&
      this.selectedProductLot.organizationId === this.currentUser.companyId
    ) {
      this.notificationHelperService.showValidation('You cannot buy products that your company already owns');
      return true;
    }

    if (transaction?.tally?.hasUnitWithLotId(this.selectedProductLot.lotId)) {
      this.notificationHelperService.showValidation(
        'The product lot is already added to the tally of this transaction'
      );
      return true;
    }
    const priceSystem = transaction?.tally?.priceSystem;
    if (priceSystem && this.selectedProductLot.spec.priceSystem !== priceSystem) {
      this.notificationHelperService.showValidation('Price system should be unique across the Transaction tally');
      return true;
    }
    return false;
  }

  private getSearchTxPayload(): any {
    const customerPayload = {
      value: { field: 'customerOnline', comparisonOperator: 'eq', fieldValue: Environment.getCurrentCompany().id }
    };
    const creatorPayload = {
      value: { comparisonOperator: 'eq', field: 'creator', fieldValue: Environment.getCurrentUser().id }
    };
    const statesPayload = {
      children: {
        logicalOperator: 'or',
        items: [
          {
            children: {
              logicalOperator: 'and',
              items: [
                { value: { comparisonOperator: 'eq', field: 'state', fieldValue: TransactionStateEnum.Draft } },
                creatorPayload
              ]
            }
          },
          { value: { comparisonOperator: 'eq', field: 'state', fieldValue: TransactionStateEnum.Quote } }
        ]
      }
    };
    const buyerPayload = {
      value: { field: 'buyerOnline', comparisonOperator: 'eq', fieldValue: Environment.getCurrentUser().id }
    };
    const filters: any = {
      children: {
        logicalOperator: 'and',
        items: [statesPayload]
      }
    };
    if (this.userPermissions.canUpdateOwnTally) filters.children.items.push(buyerPayload);
    return {
      filters: {
        children: {
          logicalOperator: 'and',
          items: [Utils.getSearchTxExcludeArchivedPayload(), customerPayload, filters]
        }
      }
      // fields: ['tally', 'trackingData', 'state'],
    };
  }

  private isTransactionValid(transaction: TransactionEntity): boolean {
    return (
      (ObjectUtil.isEmptyObject(transaction.shipFrom) ||
        transaction.shipFrom.id === this.selectedProductLot.shipFromId) &&
      !(this.userPermissions.canUpdateOwnTally && !transaction.isResourceOwner)
    );
  }
}
