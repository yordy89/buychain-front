import { ChangeDetectorRef, Component, Inject, LOCALE_ID, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Tooltips } from '@services/app-layer/app-layer.tooltips';
import { GridHelperService } from '@services/helpers/grid-helper/grid-helper.service';
import { NavigationHelperService } from '@services/helpers/navigation-helper/navigation-helper.service';
import { FormControl, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import {
  RoleInTransaction,
  TransactionStateEnum,
  TransactionStateIndexEnum,
  TransactionTypeEnum
} from '@app/services/app-layer/app-layer.enums';
import { TransactionEntity } from '@services/app-layer/entities/transaction';
import { TransactionFilter } from '@app/services/app-layer/app-layer.filters';
import { BookmarkComponent } from '@views/main/common/bookmark/bookmark.component';
import { DxDataGridComponent } from 'devextreme-angular';
import { delay, first, map, takeUntil } from 'rxjs/operators';
import { BookmarkService } from '@app/services/app-layer/bookmark/bookmark.service';
import { ObjectUtil } from '@app/services/helpers/utils/object-util';
import { formatCurrency } from '@angular/common';
import { FilterGridLayoutComponent } from '@app/views/main/common/filter-grid-layout/filter-grid-layout.component';
import { TransactionMessagingModalComponent } from '@views/main/common/modals/transaction-messaging-modal/transaction-messaging-modal.component';
import { SearchService } from '@services/app-layer/search/search.service';
import {
  OrdersOverviewHelperService,
  OrdersViewState
} from '@views/main/order/orders-overview/orders-overview.helper.service';
import { Observable, Subject } from 'rxjs';
import { PageType } from '@views/main/common/load-all-units/load-all-units.component';
import { MatMenuTrigger } from '@angular/material/menu';

@Component({
  selector: 'app-orders-overview',
  templateUrl: './orders-overview.component.html',
  styleUrls: ['./orders-overview.component.scss']
})
export class OrdersOverviewComponent implements OnInit, OnDestroy {
  @ViewChild('grid') grid: DxDataGridComponent;
  @ViewChild('layoutComponent') layoutComponent: FilterGridLayoutComponent;
  @ViewChild(BookmarkComponent) bookmarkComp: BookmarkComponent;
  @ViewChild(MatMenuTrigger) ordersMenuTrigger: MatMenuTrigger;

  public viewKey = 'companyTransactions';
  public viewState: OrdersViewState;
  public defaultState = new OrdersViewState();

  public statesFilter = [];
  public rolesFilter = [];

  public filterForm: FormGroup;
  public ownerControl: FormControl;
  public roleControl: FormControl;
  public startDate: FormControl;
  public endDate: FormControl;
  public currentDate = new Date();

  public transactionIds: any[] = [];
  public transactions: TransactionEntity[] = [];
  public collapsed = false;

  tooltips: { [key: string]: string };

  public userPermissions = {
    canCreateOrder: false,
    canReadTransactions: false,
    canReadOnlyOwnTx: false
  };

  public offset = 0;
  public limit = 100;
  public allLoaded = false;
  private latestFilters = new TransactionFilter();

  PageType = PageType;

  public isBackgroundLoading = false;

  public txGridMenuData = {
    position: {
      x: '',
      y: ''
    },
    selectedTx: TransactionEntity
  };

  private destroy$ = new Subject<void>();

  constructor(
    @Inject(LOCALE_ID) private localeId: string,
    private dialog: MatDialog,
    private bookmarkService: BookmarkService,
    private navigationHelperService: NavigationHelperService,
    private searchService: SearchService,
    private gridHelperService: GridHelperService,
    private ordersOverviewHelperService: OrdersOverviewHelperService,
    private cd: ChangeDetectorRef
  ) {
    this.saveGridState = this.saveGridState.bind(this);
    this.loadGridState = this.loadGridState.bind(this);
    this.formatGroupTotalAvgHeader = this.formatGroupTotalAvgHeader.bind(this);

    this.initViewState();
    this.adjustStateAndRoleFilters();
    this.createFormControls();
    this.setFilterFormValues(this.viewState.filters);
  }

  ngOnInit() {
    this.tooltips = Tooltips.getTransactionsTooltips();
    this.userPermissions = this.ordersOverviewHelperService.getUserPermissions();

    if (this.userPermissions.canReadTransactions) this.tryLoadCachedData();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  public tryLoadCachedData(): void {
    this.transactionIds = this.ordersOverviewHelperService.getLoadedTxIdsByFilters();
    if (!this.transactionIds?.length) return this.loadFreshData();
    this.transactions = this.ordersOverviewHelperService.getLoadedTxsByFilters();
    if (!this.transactions?.length) return this.loadFreshData();
    this.offset = this.transactions.length;
    this.allLoaded = this.transactions.length === this.transactionIds.length;
    this.setLatestFilters();
  }

  public goToNewOrder(): void {
    this.navigationHelperService.navigateNewOrder();
  }

  public filterTransactions(): void {
    if (this.isFiltersChanged()) {
      this.loadFreshData();
      this.bookmarkService.saveSessionLastState(this.viewKey, this.viewState);
    } else this.loadTransactionsChunk();
  }

  loadFreshData(): void {
    this.offset = 0;
    this.transactions = [];
    this.cd.detectChanges();
    this.loadTransactionIdsByFilters()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (!this.transactionIds.length) {
          this.setLatestFilters();
          return (this.allLoaded = true);
        }
        this.loadTransactionsChunk();
      });
  }

  onExporting(e) {
    this.gridHelperService.exportToExcel(e, 'Transactions');
  }

  get lastUpdatedTimeString(): string {
    return this.ordersOverviewHelperService.lastUpdatedTimeDiffString();
  }

  setIsLoadingAll(value: boolean): void {
    this.isBackgroundLoading = value;
  }

  isLoadAllVisible(): boolean {
    return (
      !this.isFiltersChanged() &&
      this.transactions.length &&
      (!this.allLoaded || this.transactions.length < this.transactionIds.length)
    );
  }

  completeLoadedData(loadedData): void {
    this.allLoaded = true;
    this.transactions = [...this.transactions, ...loadedData];
    this.ordersOverviewHelperService.setLoadedTxByFilters(this.transactions);
  }

  private loadTransactionsChunk(): void {
    const end =
      this.offset + this.limit > this.transactionIds.length ? this.transactionIds.length : this.offset + this.limit;
    const txIds = this.transactionIds.slice(this.offset, end);

    this.searchService
      .fetchTransactionsByIds(txIds)
      .pipe(takeUntil(this.destroy$))
      .subscribe(txs => {
        this.allLoaded = end === this.transactionIds.length;
        this.offset += this.limit;
        this.transactions.push(...txs.map(t => new TransactionEntity().init(t)));
        this.ordersOverviewHelperService.setLoadedTxByFilters(this.transactions);
        this.setLatestFilters();
      });
  }

  private setLatestFilters(): void {
    this.latestFilters = new TransactionFilter().init(this.viewState.filters);
  }
  public isFiltersChanged(): boolean {
    const viewStateFilters = new TransactionFilter().init(this.viewState.filters);
    const start = viewStateFilters.startDate ? new Date(viewStateFilters.startDate).getTime() : null;
    const lastStart = this.latestFilters.startDate ? new Date(this.latestFilters.startDate).getTime() : null;
    const end = viewStateFilters.endDate ? new Date(viewStateFilters.endDate).getTime() : null;
    const lastEnd = this.latestFilters.endDate ? new Date(this.latestFilters.endDate).getTime() : null;

    return !(
      viewStateFilters.owner === this.latestFilters.owner &&
      viewStateFilters.role === this.latestFilters.role &&
      viewStateFilters.states.sort().join(',') === this.latestFilters.states.sort().join(',') &&
      start === lastStart &&
      end === lastEnd
    );
  }

  public getTypeForRole(role: RoleInTransaction): TransactionTypeEnum {
    if (role === RoleInTransaction.Seller) return TransactionTypeEnum.Sales;
    if (role === RoleInTransaction.Buyer) return TransactionTypeEnum.Purchase;
  }

  public openMessagingDialog(transaction: TransactionEntity, event: Event): void {
    event.stopPropagation();
    this.dialog
      .open(TransactionMessagingModalComponent, {
        width: '700px',
        disableClose: true,
        data: transaction
      })
      .afterClosed()
      .subscribe();
  }

  public resetStartDate(): void {
    this.startDate.reset();
  }
  public resetEndDate(): void {
    this.endDate.reset();
  }

  public onStateCheckboxToggle(event, state): void {
    this.statesFilter.find(item => state.key === item.key).isSelected = event.checked;
    this.updateFilterValues();
  }

  /*
   * grid functions
   * */
  public onTransactionSelectionChanged(event): void {
    if (!event.key || event.rowType === 'group') return;
    this.txGridMenuData.position.x = `${event.event.clientX}px`;
    this.txGridMenuData.position.y = `${event.event.clientY}px`;
    this.txGridMenuData.selectedTx = event.data;
    this.ordersMenuTrigger.openMenu();
  }

  openTxDetails(): void {
    if (!this.txGridMenuData.selectedTx) return;
    this.navigationHelperService.navigateToTransaction(this.txGridMenuData.selectedTx as any);
  }
  openTxInNewTab(): void {
    if (!this.txGridMenuData.selectedTx) return;
    window.open(`${location.origin}/order/transaction/${this.txGridMenuData.selectedTx['id']}`);
  }
  openTxInNewWindow(): void {
    if (!this.txGridMenuData.selectedTx) return;
    const strWindowFeatures = 'location=yes';
    window.open(
      `${location.origin}/order/transaction/${this.txGridMenuData.selectedTx['id']}`,
      '_blank',
      strWindowFeatures
    );
  }

  public gridContentReady(): void {
    // TODO pass class method instead of Arrow function if this works as expected.
    if (!this.collapsed) {
      this.collapsed = true;
    }
  }

  public calcCustomGroupSummary(e) {
    if (e.name === 'profitSummary' || e.name === 'totalPriceSummary') {
      if (e.summaryProcess === 'start') {
        e.totalValue = {
          total: 0,
          avg: 0,
          count: 0
        };
      } else if (e.summaryProcess === 'calculate') {
        e.totalValue.total += e.value;
        e.totalValue.count += 1;
        e.totalValue.avg = e.totalValue.total / e.totalValue.count;
      }
    }
  }

  get selectedFiltersCount() {
    return this.ordersOverviewHelperService.getSelectedFiltersCount(this.viewState, this.grid?.searchPanel?.text);
  }

  onFilterReset() {
    this.grid.instance.clearFilter();
    this.bookmarkComp.resetToDefault();
  }

  public formatGroupTotalAvgHeader(e) {
    const total = formatCurrency(e.value.total, this.localeId, '$', 'USD', '1.0-2');
    const avg = formatCurrency(e.value.avg, this.localeId, '$', 'USD', '1.0-2');

    return `Total: ${total} Avg: ${avg}`;
  }

  public onStateChanged(viewState) {
    this.viewState = this.migrationOnTxSearchViewState(viewState);
    this.setFilterFormValues(viewState.filters);
    this.setGridState(viewState.grid);
    this.offset = 0;
    this.transactions = [];
    this.filterTransactions();
  }

  public setGridState(state) {
    this.grid.instance.state(state);
  }

  public loadGridState() {
    return this.viewState.grid;
  }

  public saveGridState(gridState) {
    const gridStoringState = ObjectUtil.getDeepCopy(gridState);
    gridStoringState.selectedRowKeys = [];
    this.viewState = { ...this.viewState, grid: gridStoringState };
  }

  public onToolbarPreparing(e) {
    this.gridHelperService.prepareToolbarCollapseExpand(e, () => this.grid);
    this.gridHelperService.prepareToolbarPrefixTemplate(e);
  }

  public sortByStateIndex(value1, value2) {
    return parseInt(TransactionStateIndexEnum[value1], 10) - parseInt(TransactionStateIndexEnum[value2], 10);
  }

  /*
   * private helpers
   * */

  private createFormControls(): void {
    this.ownerControl = new FormControl();
    this.roleControl = new FormControl();
    this.startDate = new FormControl();
    this.endDate = new FormControl();

    this.filterForm = new FormGroup({
      ownerControl: this.ownerControl,
      roleControl: this.roleControl,
      startDate: this.startDate,
      endDate: this.endDate
    });
    this.filterForm.valueChanges.pipe(delay(500)).subscribe(() => this.updateFilterValues());
  }

  private initViewState() {
    this.viewState = this.bookmarkService.getSessionState(this.viewKey, new OrdersViewState(), this.defaultState);
    this.viewState = this.migrationOnTxSearchViewState(this.viewState);
  }

  private setFilterFormValues(filter): void {
    if (filter) {
      this.ownerControl.setValue(filter.owner);
      this.roleControl.setValue(filter.role);
      this.startDate.setValue(filter.startDate);
      this.endDate.setValue(filter.endDate);
      this.statesFilter.forEach(item => (item.isSelected = filter.states.some(state => item.key === state)));
    }
  }

  private loadTransactionIdsByFilters(): Observable<any> {
    return this.ordersOverviewHelperService.loadTransactionsIds(this.viewState).pipe(
      first(),
      map(txIds => {
        this.transactionIds = txIds;
        this.ordersOverviewHelperService.setLoadedTxIdsByFilters(txIds);
        this.ordersOverviewHelperService.setLastRefreshedTime(new Date());
      })
    );
  }

  private updateFilterValues(): void {
    if (!this.viewState.filters) this.viewState.filters = new TransactionFilter();
    this.viewState.filters.owner = this.ownerControl.value;
    this.viewState.filters.role = this.roleControl.value;
    this.viewState.filters.startDate = this.startDate.value;
    this.viewState.filters.endDate = this.endDate.value;
    this.viewState.filters.states = this.statesFilter.filter(item => item.isSelected).map(item => item.key);
  }

  private adjustStateAndRoleFilters(): void {
    this.statesFilter = ObjectUtil.enumToArray(TransactionStateEnum)
      .map(key => ({ key: key, isSelected: false }))
      .filter(s => s.key !== TransactionStateEnum.Canceled);
    this.rolesFilter = ObjectUtil.enumToArray(RoleInTransaction);
  }

  private migrationOnTxSearchViewState(viewState: OrdersViewState): OrdersViewState {
    const object = ObjectUtil.getDeepCopy(viewState);
    object.filters.states = object.filters.states.filter(s => s !== TransactionStateEnum.Canceled);
    return object;
  }
}
