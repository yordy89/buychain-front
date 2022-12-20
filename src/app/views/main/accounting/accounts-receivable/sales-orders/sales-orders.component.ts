import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TextBadge } from '@app/constants';
import { TableAction } from '@app/models';
import { EMPTY, forkJoin, of, Subject } from 'rxjs';
import { catchError, mergeMap, takeUntil } from 'rxjs/operators';
import { DxDataGridComponent } from 'devextreme-angular';
import { ARLineItemTypeEnum, ARSalesOrderStateEnum } from '@services/app-layer/app-layer.enums';
import { Environment } from '@services/app-layer/app-layer.environment';
import { BookmarkService } from '@services/app-layer/bookmark/bookmark.service';
import { ARInvoice, ARLineItem, ARSalesOrder } from '@services/app-layer/entities/accounts-receivable';
import { CrmAccountEntity } from '@services/app-layer/entities/crm';
import { DimensionEntity } from '@services/app-layer/entities/dimension';
import { GroupEntity } from '@services/app-layer/entities/group';
import { MemberEntity } from '@services/app-layer/entities/member';
import { TransactionEntity } from '@services/app-layer/entities/transaction';
import { GridHelperService } from '@services/helpers/grid-helper/grid-helper.service';
import { NavigationHelperService } from '@services/helpers/navigation-helper/navigation-helper.service';
import { ListUtilHelper } from '@services/helpers/utils/list-util.helper';
import { ObjectUtil } from '@services/helpers/utils/object-util';
import { SalesOrdersService } from '@views/main/accounting/accounts-receivable/sales-orders/sales-orders.service';
import { BookmarkComponent } from '@views/main/common/bookmark/bookmark.component';
import {
  ARSalesOrdersFilters,
  ARSalesOrdersFiltersState,
  SalesOrdersFiltersComponent
} from '@views/main/accounting/accounts-receivable/sales-orders/components/sales-orders-filters/sales-orders-filters.component';
import { NotificationHelperService } from '@services/helpers/notification-helper/notification-helper.service';

class ViewState {
  grid = null;
  filters: ARSalesOrdersFilters = {
    state: [],
    group: '',
    childGroups: false,
    openLineItems: [],
    dateFrom: null,
    dateTo: null,
    customer: '',
    owner: ''
  };
  filtersState: ARSalesOrdersFiltersState = {
    groupExpanded: false,
    openLineItemsExpanded: false,
    createdOnExpanded: false,
    customerExpanded: false,
    stateExpanded: false,
    ownerExpanded: false
  };
}

enum MainActions {
  VIEW,
  VIEW_IN_NEW_TAB,
  VIEW_IN_NEW_WINDOW,
  EDIT,
  DELETE
}

enum InvoiceActions {
  VIEW,
  VIEW_IN_NEW_TAB,
  VIEW_IN_NEW_WINDOW
}

enum UnassignedItemActions {
  ASSIGN_TO_NEW
}

const targetTypeSortOrderArr = [
  ARSalesOrderStateEnum.OPEN,
  ARSalesOrderStateEnum.PENDING_CLOSE,
  ARSalesOrderStateEnum.CLOSED
];

@Component({
  selector: 'app-sales-orders',
  templateUrl: 'sales-orders.component.html',
  styleUrls: ['./sales-orders.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SalesOrdersComponent implements OnInit, OnDestroy {
  @ViewChild('grid') grid: DxDataGridComponent;
  @ViewChild(BookmarkComponent) bookmarkComp: BookmarkComponent;
  @ViewChild(SalesOrdersFiltersComponent) salesOrdersFiltersComponent: SalesOrdersFiltersComponent;

  private offset = 0;
  private limit = 1000;
  allLoaded = false;

  crmAccountsList: CrmAccountEntity[] = [];
  groupsList: GroupEntity[] = [];
  salesOrdersList: ARSalesOrder[] = [];
  dimensionsList: DimensionEntity[] = [];
  members: MemberEntity[] = [];
  transactions: TransactionEntity[];

  visibleRows = 0;

  permissions = { canRead: false, canCreate: false, canUpdate: false, canDelete: false };

  viewState: ViewState;
  defaultState = new ViewState();
  mainActions: TableAction[] = [];
  invoiceActions: TableAction[] = [];
  unassignedItemActions: { [key: string]: TableAction[] } = {};
  isExpandedAllDetailRows = false;
  isChartVisible = false;

  isLoaded = false;

  readonly viewKey = 'accountingARSalesOrders';

  private latestFilters = new ViewState().filters;
  private destroy$ = new Subject<void>();

  constructor(
    private salesOrdersService: SalesOrdersService,
    private navigationHelperService: NavigationHelperService,
    private bookmarkService: BookmarkService,
    private cd: ChangeDetectorRef,
    private gridHelperService: GridHelperService,
    private router: Router,
    private route: ActivatedRoute,
    private notificationHelperService: NotificationHelperService
  ) {}

  ngOnInit() {
    if (!Environment.getCurrentCompany().features.accounting) {
      this.navigationHelperService.navigateUserHome();
    }

    this.saveGridState = this.saveGridState.bind(this);
    this.loadGridState = this.loadGridState.bind(this);
    this.initViewState();
    this.setPermissions();

    if (this.permissions.canRead) {
      this.loadData();
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onContentReady() {
    const visibleRows = this.grid?.instance.totalCount();
    this.visibleRows = visibleRows > 0 ? visibleRows : 0;
  }

  setGridState() {
    if (this.grid) {
      this.grid.instance.state(this.viewState.grid);
    }
  }

  loadGridState() {
    return this.viewState.grid;
  }

  saveGridState(gridState) {
    const gridStoringState = ObjectUtil.getDeepCopy(gridState);
    gridStoringState.selectedRowKeys = [];
    this.viewState.grid = gridStoringState;
  }

  onViewStateChanged(viewState: ViewState) {
    this.viewState = viewState;
    this.searchSalesOrders();
    this.setGridState();
    this.salesOrdersFiltersComponent.setFilterValues(viewState.filters);
  }

  onExporting(e) {
    this.gridHelperService.exportToExcel(e, 'Sales Orders');
  }

  calculateStatusGroupValue(rowData) {
    const index = targetTypeSortOrderArr.findIndex(item => item === rowData.state);
    return `${index}:${rowData.state}`;
  }

  stateTextClass(state) {
    switch (state) {
      case ARSalesOrderStateEnum.OPEN:
        return TextBadge.primary;
      case ARSalesOrderStateEnum.PENDING_CLOSE:
        return TextBadge.warning;
      case ARSalesOrderStateEnum.CLOSED:
        return TextBadge.success;
      default:
        return '';
    }
  }

  onToggleDetailRowsExpandState() {
    if (this.isExpandedAllDetailRows) {
      this.gridHelperService.collapseAllMasterRows(this.grid);
    } else {
      this.gridHelperService.expandAllMasterRows(this.grid);
    }
    this.isExpandedAllDetailRows = !this.isExpandedAllDetailRows;
  }

  calculateDisplayCustomerValue = (rowData: ARSalesOrder) =>
    ListUtilHelper.getDisplayValueFromList(rowData.customer.company, this.crmAccountsList);

  calculateDisplaySalesRepValue = (rowData: ARSalesOrder) =>
    ListUtilHelper.getDisplayValueFromList(rowData.owner, this.members);

  calculateDisplayGroupValue = (rowData: ARSalesOrder) =>
    ListUtilHelper.getDisplayValueFromList(rowData.group, this.groupsList);

  calculateDisplayDimensionValue = (rowData: ARSalesOrder) =>
    ListUtilHelper.getDisplayValueFromList(rowData.dimension, this.dimensionsList);

  calculateDisplayCreatedByValue = (rowData: ARSalesOrder) =>
    ListUtilHelper.getDisplayValueFromList(rowData.createdBy, this.members);

  calculateDisplayModifiedByValue = (rowData: ARSalesOrder) =>
    ListUtilHelper.getDisplayValueFromList(rowData.modifiedBy, this.members);

  onAddSalesOrder() {
    this.router.navigate(['add'], { relativeTo: this.route });
  }

  searchSalesOrders(): void {
    if (this.isFiltersChanged()) {
      this.offset = 0;
      this.salesOrdersList = [];
      this.bookmarkService.saveSessionLastState(this.viewKey, this.viewState);
    }
    this.loadSalesOrders();
  }

  isFiltersChanged(): boolean {
    return !ObjectUtil.isDeepEquals(this.latestFilters, this.viewState.filters);
  }

  onToolbarPreparing(e) {
    this.gridHelperService.prepareToolbarCollapseExpand(
      e,
      () => this.grid,
      () => (this.isExpandedAllDetailRows = false),
      () => (this.isExpandedAllDetailRows = true)
    );
    this.gridHelperService.prepareToolbarPrefixTemplate(e);
    this.gridHelperService.prepareToolbarChartIcon(
      e,
      () => {
        this.isChartVisible = true;
        this.cd.markForCheck();
      },
      () => !this.salesOrdersList.length
    );
    this.cd.markForCheck();
  }

  onCloseChart() {
    this.isChartVisible = false;
  }

  getSalesOrderUrl(id: string) {
    return `${location.href}/${id}`;
  }

  getInvoiceUrl(id: string) {
    return `${location.origin}/accounting/invoices/${id}`;
  }

  loadSalesOrders() {
    this.salesOrdersService
      .getSalesOrders(this.limit, this.offset, this.viewState.filters)
      .pipe(
        mergeMap(items => {
          this.allLoaded = items.length < this.limit;
          this.offset += this.limit;
          this.setLatestFilters();
          this.isLoaded = true;
          this.salesOrdersList = this.salesOrdersList.concat(items);
          this.initTableActions(items);
          return this.loadTransactions();
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(transactions => {
        this.transactions = transactions;
        this.setLatestFilters();
        this.cd.markForCheck();
      });
  }

  onAction(value: MainActions, item: ARSalesOrder) {
    switch (value) {
      case MainActions.VIEW:
        this.viewSalesOrder(item);
        break;
      case MainActions.VIEW_IN_NEW_TAB:
        this.viewSalesOrderInNewTab(item);
        break;
      case MainActions.VIEW_IN_NEW_WINDOW:
        this.viewSalesOrderInNewWindow(item);
        break;
      case MainActions.EDIT:
        this.editSalesOrder(item);
        break;
      case MainActions.DELETE:
        this.deleteSalesOrder(item);
        break;
    }
  }

  onInvoiceAction(value: InvoiceActions, item: { invoice: ARInvoice; salesOrderId: string }) {
    switch (value) {
      case InvoiceActions.VIEW:
        this.viewInvoice(item);
        break;
      case InvoiceActions.VIEW_IN_NEW_TAB:
        this.viewInvoiceInNewTab(item);
        break;
      case InvoiceActions.VIEW_IN_NEW_WINDOW:
        this.viewInvoiceInNewWindow(item);
        break;
    }
  }

  onUnassignedItemAction(value, item: { lineItem: ARLineItem; salesOrderId: string }) {
    if (value === UnassignedItemActions.ASSIGN_TO_NEW) {
      this.assignItemToNewInvoice(item);
    } else {
      this.assignItemToInvoice(value, item);
    }
  }

  viewSalesOrder(entry: ARSalesOrder) {
    this.router.navigate([entry.id], { relativeTo: this.route });
  }
  viewSalesOrderInNewTab(entry: ARSalesOrder) {
    window.open(`${location.href}/${entry.id}`);
  }
  viewSalesOrderInNewWindow(entry: ARSalesOrder) {
    const strWindowFeatures = 'location=yes';
    window.open(`${location.href}/${entry.id}`, '_blank', strWindowFeatures);
  }

  private editSalesOrder(entry: ARSalesOrder) {
    this.router.navigate([entry.id], {
      relativeTo: this.route,
      queryParams: { editSalesOrder: true }
    });
  }

  private deleteSalesOrder(entry: ARSalesOrder) {
    this.salesOrdersService
      .deleteSalesOrder(entry.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const index = this.salesOrdersList.findIndex(item => item.id === entry.id);
        if (index === -1) {
          return;
        }
        this.salesOrdersList = this.salesOrdersList.filter(item => item.id !== entry.id);
        this.offset--;
        this.cd.markForCheck();
      });
  }

  viewInvoice(item: { invoice: ARInvoice; salesOrderId: string }) {
    this.router.navigate(['/accounting/invoices/', item.invoice.id], { relativeTo: this.route });
  }
  viewInvoiceInNewTab(item: { invoice: ARInvoice; salesOrderId: string }) {
    window.open(`${location.origin}/accounting/invoices/${item.invoice.id}`);
  }
  viewInvoiceInNewWindow(item: { invoice: ARInvoice; salesOrderId: string }) {
    const strWindowFeatures = 'location=yes';
    window.open(`${location.origin}/accounting/invoices/${item.invoice.id}`, '_blank', strWindowFeatures);
  }

  assignItemToInvoice(invoiceId, item: { lineItem: ARLineItem; salesOrderId: string }) {
    const {
      lineItem: { id: lineItemId },
      salesOrderId
    } = item;
    const payload = {
      salesOrderId,
      lineItemIds: [lineItemId]
    };

    this.salesOrdersService
      .addInvoiceLineItemFromSalesOrder(invoiceId, payload)
      .pipe(
        catchError(({ error }) => {
          this.notificationHelperService.showValidation(error.message);
          return EMPTY;
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.salesOrdersList = this.salesOrdersList.reduce((acc, currentSalesOrder) => {
          if (currentSalesOrder.id === salesOrderId) {
            const salesOrder = currentSalesOrder;
            salesOrder.openLineItems = salesOrder.openLineItems.filter(lineItem => lineItem.id !== lineItemId);
            acc.push(salesOrder);
          }
          return acc;
        }, []);

        this.cd.markForCheck();
      });
  }

  assignItemToNewInvoice(item: { lineItem: ARLineItem; salesOrderId: string }) {
    const {
      lineItem: { id: lineItemId },
      salesOrderId
    } = item;

    this.router.navigate([salesOrderId, 'invoice', 'add'], {
      relativeTo: this.route,
      queryParams: {
        lineItemId
      }
    });
  }

  getTransactionUrl = (id: string) => `${location.origin}/order/transaction/${id}`;

  private setPermissions(): void {
    this.permissions = this.salesOrdersService.getSalesOrderPermissions();
  }

  private initViewState() {
    this.viewState = this.bookmarkService.getSessionState(this.viewKey, new ViewState(), this.defaultState);
  }

  private initTableActions(salesOrders: ARSalesOrder[]) {
    this.mainActions = [
      {
        label: 'View',
        icon: 'visibility',
        value: MainActions.VIEW
      },
      {
        label: 'Open in new tab',
        icon: 'reply',
        value: MainActions.VIEW_IN_NEW_TAB
      },
      {
        label: 'Open in new window',
        icon: 'reply_all',
        value: MainActions.VIEW_IN_NEW_WINDOW
      },
      {
        label: 'Edit',
        icon: 'edit',
        value: MainActions.EDIT,
        isHidden: (action, item: ARSalesOrder) => !(this.permissions.canUpdate && item.isEditAllowed)
      },
      {
        label: 'Delete',
        icon: 'delete',
        color: 'warn',
        value: MainActions.DELETE,
        prompt: {
          title: 'Confirm please!',
          text: 'Are you sure you want to delete this Sales Order?'
        },
        isHidden: (action, item: ARSalesOrder) => !(this.permissions.canDelete && item.isDeleteAllowed)
      }
    ];

    this.invoiceActions = [
      {
        label: 'View Invoice',
        icon: 'visibility',
        value: InvoiceActions.VIEW
      },
      {
        label: 'Open in new tab',
        icon: 'reply',
        value: InvoiceActions.VIEW_IN_NEW_TAB
      },
      {
        label: 'Open in new window',
        icon: 'reply_all',
        value: InvoiceActions.VIEW_IN_NEW_WINDOW
      }
    ];

    this.unassignedItemActions = this.generateUnassignedItemsActions(salesOrders);
  }

  generateUnassignedItemsActions(salesOrders: ARSalesOrder[]) {
    const assignToNewInvoiceAction = {
      label: 'Assign to New Invoice',
      icon: 'assignment',
      value: UnassignedItemActions.ASSIGN_TO_NEW
    };

    return salesOrders.reduce((acc, salesOrder) => {
      const assignToInvoiceActions = this.generateAssignItemToInvoiceActions(salesOrder.invoices);
      return {
        ...acc,
        [salesOrder.id]: [...assignToInvoiceActions, assignToNewInvoiceAction]
      };
    }, {});
  }

  generateAssignItemToInvoiceActions(invoices: ARInvoice[]): TableAction[] {
    let newActions: TableAction[] = [];
    if (invoices?.length) {
      newActions = invoices.reduce((acc, invoice) => {
        if (invoice.isDraft || invoice.isIssued) {
          return acc.concat({
            label: `Assign to Invoice ${invoice.number}`,
            icon: 'assignment',
            labelClasses: ['text-primary'],
            value: invoice.id,
            isHidden: (action, item: ARLineItem) =>
              invoice.isIssued && item.type !== ARLineItemTypeEnum.INTERNAL_EXPENSE
          });
        }

        return acc;
      }, []);
    }
    return newActions;
  }

  private loadData() {
    forkJoin(this.salesOrdersService.getDataRequestsArray())
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        ([dimensions, groups, crmAccounts, members]: [
          DimensionEntity[],
          GroupEntity[],
          CrmAccountEntity[],
          MemberEntity[]
        ]) => {
          this.dimensionsList = dimensions;
          this.groupsList = groups;
          this.crmAccountsList = crmAccounts;
          this.members = members;
          this.loadSalesOrders();
        }
      );
  }

  onFilterReset() {
    this.grid.instance.clearFilter();
    this.bookmarkComp.resetToDefault();
  }

  get selectedFiltersCount() {
    let filtersCount = 0;

    Object.keys(this.viewState.filters).forEach(key => {
      if (!ObjectUtil.isDeepEquals(this.viewState.filters[key], this.defaultState.filters[key])) {
        filtersCount++;
      }
    });

    if (this.grid?.searchPanel?.text) {
      filtersCount++;
    }

    return filtersCount;
  }

  private setLatestFilters(): void {
    Object.assign(this.latestFilters, this.viewState.filters);
  }

  private loadTransactions() {
    const ids = this.salesOrdersList.reduce((acc, item) => {
      if (item.transaction) {
        return [...acc, item.transaction];
      }

      return acc;
    }, []);

    if (ids?.length) {
      return this.salesOrdersService.getTransactions(ids);
    }

    return of([]);
  }
}
