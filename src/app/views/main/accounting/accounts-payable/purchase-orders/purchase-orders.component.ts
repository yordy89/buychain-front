import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TextBadge } from '@app/constants';
import { TableAction } from '@app/models';
import { EMPTY, forkJoin, of, Subject } from 'rxjs';
import { catchError, mergeMap, takeUntil } from 'rxjs/operators';
import { DxDataGridComponent } from 'devextreme-angular';
import { Environment } from '@services/app-layer/app-layer.environment';
import { BookmarkService } from '@services/app-layer/bookmark/bookmark.service';
import { CrmAccountEntity } from '@services/app-layer/entities/crm';
import { DimensionEntity } from '@services/app-layer/entities/dimension';
import { GroupEntity } from '@services/app-layer/entities/group';
import { MemberEntity } from '@services/app-layer/entities/member';
import { TransactionEntity } from '@services/app-layer/entities/transaction';
import { GridHelperService } from '@services/helpers/grid-helper/grid-helper.service';
import { NavigationHelperService } from '@services/helpers/navigation-helper/navigation-helper.service';
import { ListUtilHelper } from '@services/helpers/utils/list-util.helper';
import { ObjectUtil } from '@services/helpers/utils/object-util';
import { BookmarkComponent } from '@views/main/common/bookmark/bookmark.component';
import {
  APPurchaseOrdersFilters,
  APPurchaseOrdersFiltersState,
  PurchaseOrdersFiltersComponent
} from '@views/main/accounting/accounts-payable/purchase-orders/component/purchase-orders-filters/purchase-orders-filters.component';
import { APBill, APLineItem, APPurchaseOrder } from '@services/app-layer/entities/accounts-payable';
import { PurchaseOrdersService } from '@views/main/accounting/accounts-payable/purchase-orders/purchase-orders.service';
import { APPurchaseOrderStateEnum } from '@app/services/app-layer/app-layer.enums';
import { PurchaseOrdersApiService } from '@services/app-layer/purchase-orders/purchase-orders-api.service';
import { NotificationHelperService } from '@services/helpers/notification-helper/notification-helper.service';
import { BillsApiService } from '@services/app-layer/bills/bills-api.services';

class ViewState {
  grid = null;
  filters: APPurchaseOrdersFilters = {
    state: [],
    group: '',
    childGroups: false,
    dateFrom: null,
    dateTo: null,
    vendor: '',
    owner: ''
  };
  filtersState: APPurchaseOrdersFiltersState = {
    groupExpanded: false,
    createdOnExpanded: false,
    vendorExpanded: false,
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

enum BillActions {
  VIEW,
  VIEW_IN_NEW_TAB,
  VIEW_IN_NEW_WINDOW
}

enum UnassignedItemActions {
  ASSIGN_TO_NEW
}

@Component({
  selector: 'app-purchase-orders',
  templateUrl: 'purchase-orders.component.html',
  styleUrls: ['./purchase-orders.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PurchaseOrdersComponent implements OnInit, OnDestroy {
  @ViewChild('grid') grid: DxDataGridComponent;
  @ViewChild(BookmarkComponent) bookmarkComp: BookmarkComponent;
  @ViewChild(PurchaseOrdersFiltersComponent) purchaseOrdersFiltersComponent: PurchaseOrdersFiltersComponent;

  private offset = 0;
  private limit = 1000;
  allLoaded = false;

  crmAccountsList: CrmAccountEntity[] = [];
  groupsList: GroupEntity[] = [];
  purchaseOrdersList: APPurchaseOrder[] = [];
  dimensionsList: DimensionEntity[] = [];
  members: MemberEntity[] = [];
  transactions: TransactionEntity[];

  visibleRows = 0;

  permissions = { canRead: false, canCreate: false, canUpdate: false, canDelete: false };

  gridFilterValue = [];
  viewState: ViewState;
  defaultState = new ViewState();
  mainActions: TableAction[] = [];
  billActions: TableAction[] = [];
  unassignedItemActions: { [key: string]: TableAction[] } = {};
  isExpandedAllDetailRows = false;

  isLoaded = false;

  readonly viewKey = 'accountingAPPurchaseOrders';

  private latestFilters = new ViewState().filters;
  private destroy$ = new Subject<void>();

  constructor(
    private purchaseOrdersService: PurchaseOrdersService,
    private purchaseOrdersApiService: PurchaseOrdersApiService,
    private navigationHelperService: NavigationHelperService,
    private bookmarkService: BookmarkService,
    private cd: ChangeDetectorRef,
    private gridHelperService: GridHelperService,
    private router: Router,
    private route: ActivatedRoute,
    private notificationHelperService: NotificationHelperService,
    private billsApiService: BillsApiService
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
    this.searchPurchaseOrders();
    this.setGridState();
    this.purchaseOrdersFiltersComponent.setFilterValues(viewState.filters);
  }

  onExporting(e) {
    this.gridHelperService.exportToExcel(e, 'Purchase Orders');
  }

  stateTextClass(state) {
    switch (state) {
      case APPurchaseOrderStateEnum.CLOSED:
        return TextBadge.success;
      case APPurchaseOrderStateEnum.OPEN:
        return TextBadge.primary;
      case APPurchaseOrderStateEnum.PENDING_CLOSE:
        return TextBadge.warning;
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

  calculateDisplayVendorValue = (rowData: APPurchaseOrder) =>
    ListUtilHelper.getDisplayValueFromList(rowData.vendor.company, this.crmAccountsList);

  calculateDisplaySalesRepValue = (rowData: APPurchaseOrder) =>
    ListUtilHelper.getDisplayValueFromList(rowData.owner, this.members);

  calculateDisplayGroupValue = (rowData: APPurchaseOrder) =>
    ListUtilHelper.getDisplayValueFromList(rowData.group, this.groupsList);

  calculateDisplayDimensionValue = (rowData: APPurchaseOrder) =>
    ListUtilHelper.getDisplayValueFromList(rowData.dimension, this.dimensionsList);

  calculateDisplayCreatedByValue = (rowData: APPurchaseOrder) =>
    ListUtilHelper.getDisplayValueFromList(rowData.createdBy, this.members);

  calculateDisplayModifiedByValue = (rowData: APPurchaseOrder) =>
    ListUtilHelper.getDisplayValueFromList(rowData.modifiedBy, this.members);

  onAddPurchaseOrder() {
    this.router.navigate(['add'], { relativeTo: this.route });
  }

  searchPurchaseOrders(): void {
    if (this.isFiltersChanged()) {
      this.offset = 0;
      this.purchaseOrdersList = [];
      this.bookmarkService.saveSessionLastState(this.viewKey, this.viewState);
    }
    this.loadPurchaseOrders();
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
    this.cd.markForCheck();
  }

  getPurchaseOrderUrl(id: string) {
    return `${location.href}/${id}`;
  }

  getBillUrl(id: string) {
    return `${location.origin}/accounting/bills/${id}`;
  }

  loadPurchaseOrders() {
    this.purchaseOrdersService
      .getPurchaseOrders(this.limit, this.offset, this.viewState.filters)
      .pipe(
        mergeMap(items => {
          this.allLoaded = items.length < this.limit;
          this.offset += this.limit;
          this.setLatestFilters();
          this.isLoaded = true;
          this.purchaseOrdersList = this.purchaseOrdersList.concat(items);
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

  onAction(value: MainActions, item: APPurchaseOrder) {
    switch (value) {
      case MainActions.VIEW:
        this.viewPurchaseOrder(item);
        break;
      case MainActions.VIEW_IN_NEW_TAB:
        this.viewPurchaseOrderInNewTab(item);
        break;
      case MainActions.VIEW_IN_NEW_WINDOW:
        this.viewPurchaseOrderInNewWindow(item);
        break;
      case MainActions.EDIT:
        this.editPurchaseOrder(item);
        break;
      case MainActions.DELETE:
        this.deletePurchaseOrder(item);
        break;
    }
  }

  onBillAction(value: BillActions, item: { bill: APBill; purchaseOrderId: string }) {
    switch (value) {
      case BillActions.VIEW:
        this.viewBill(item);
        break;
      case BillActions.VIEW_IN_NEW_TAB:
        this.viewBillInNewTab(item);
        break;
      case BillActions.VIEW_IN_NEW_WINDOW:
        this.viewBillInNewWindow(item);
        break;
    }
  }

  onUnassignedItemAction(value, item: { lineItem: APLineItem; purchaseOrderId: string }) {
    if (value === UnassignedItemActions.ASSIGN_TO_NEW) {
      this.assignItemToNewBill(item);
    } else {
      this.assignItemToBill(value, item);
    }
  }

  viewPurchaseOrder(entry: APPurchaseOrder) {
    this.router.navigate([entry.id], { relativeTo: this.route });
  }

  viewPurchaseOrderInNewTab(entry: APPurchaseOrder) {
    window.open(`${location.href}/${entry.id}`);
  }

  viewPurchaseOrderInNewWindow(entry: APPurchaseOrder) {
    const strWindowFeatures = 'location=yes';
    window.open(`${location.href}/${entry.id}`, '_blank', strWindowFeatures);
  }

  private editPurchaseOrder(entry: APPurchaseOrder) {
    this.router.navigate([entry.id], {
      relativeTo: this.route,
      queryParams: { editPurchaseOrder: true }
    });
  }

  private deletePurchaseOrder(entry: APPurchaseOrder) {
    this.purchaseOrdersApiService
      .deletePurchaseOrder(entry.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const index = this.purchaseOrdersList.findIndex(item => item.id === entry.id);
        if (index === -1) {
          return;
        }
        this.purchaseOrdersList = this.purchaseOrdersList.filter(item => item.id !== entry.id);
        this.offset--;
        this.cd.markForCheck();
      });
  }

  viewBill(item: { bill: APBill; purchaseOrderId: string }) {
    this.router.navigate(['/accounting/bills/', item.bill.id], { relativeTo: this.route });
  }
  viewBillInNewTab(item: { bill: APBill; purchaseOrderId: string }) {
    window.open(`${location.origin}/accounting/bills/${item.bill.id}`);
  }
  viewBillInNewWindow(item: { bill: APBill; purchaseOrderId: string }) {
    const strWindowFeatures = 'location=yes';
    window.open(`${location.origin}/accounting/bills/${item.bill.id}`, '_blank', strWindowFeatures);
  }

  assignItemToBill(invoiceId, item: { lineItem: APLineItem; purchaseOrderId: string }) {
    const {
      lineItem: { id: lineItemId },
      purchaseOrderId
    } = item;
    const payload = {
      purchaseOrderId,
      lineItemIds: [lineItemId]
    };

    this.billsApiService
      .addBillLineItemFromPurchaseOrder(invoiceId, payload)
      .pipe(
        catchError(({ error }) => {
          this.notificationHelperService.showValidation(error.message);
          return EMPTY;
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.purchaseOrdersList = this.purchaseOrdersList.reduce((acc, currentPurchaseOrder) => {
          if (currentPurchaseOrder.id === purchaseOrderId) {
            const purchaseOrder = currentPurchaseOrder;
            purchaseOrder.openLineItems = purchaseOrder.openLineItems.filter(lineItem => lineItem.id !== lineItemId);
            acc.push(purchaseOrder);
          }
          return acc;
        }, []);

        this.cd.markForCheck();
      });
  }

  assignItemToNewBill(item: { lineItem: APLineItem; purchaseOrderId: string }) {
    const {
      lineItem: { id: lineItemId },
      purchaseOrderId
    } = item;

    this.router.navigate([purchaseOrderId, 'bill', 'add'], {
      relativeTo: this.route,
      queryParams: {
        lineItemId
      }
    });
  }

  getTransactionUrl = (id: string) => `${location.origin}/order/transaction/${id}`;

  private setPermissions(): void {
    this.permissions = this.purchaseOrdersService.getPurchaseOrderPermissions();
  }

  private initViewState() {
    this.viewState = this.bookmarkService.getSessionState(this.viewKey, new ViewState(), this.defaultState);
  }

  private initTableActions(purchaseOrders: APPurchaseOrder[]) {
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
        isHidden: (action, item: APPurchaseOrder) => !(this.permissions.canUpdate && item.isEditAllowed)
      },
      {
        label: 'Delete',
        icon: 'delete',
        color: 'warn',
        value: MainActions.DELETE,
        prompt: {
          title: 'Confirm please!',
          text: 'Are you sure you want to delete this Purchase Order?'
        },
        isHidden: (action, item: APPurchaseOrder) => !(this.permissions.canDelete && item.isDeleteAllowed)
      }
    ];

    this.billActions = [
      {
        label: 'View Vendor Invoice',
        icon: 'visibility',
        value: BillActions.VIEW
      },
      {
        label: 'Open in new tab',
        icon: 'reply',
        value: BillActions.VIEW_IN_NEW_TAB
      },
      {
        label: 'Open in new window',
        icon: 'reply_all',
        value: BillActions.VIEW_IN_NEW_WINDOW
      }
    ];

    this.unassignedItemActions = this.generateUnassignedItemsActions(purchaseOrders);
  }

  generateUnassignedItemsActions(purchaseOrders: APPurchaseOrder[]) {
    const assignToNewInvoiceAction = {
      label: 'Assign to New Vendor Invoice',
      icon: 'assignment',
      value: UnassignedItemActions.ASSIGN_TO_NEW
    };

    return purchaseOrders.reduce((acc, purchaseOrder) => {
      const assignToInvoiceActions = this.generateAssignItemToInvoiceActions(purchaseOrder.bills);
      return {
        ...acc,
        [purchaseOrder.id]: [...assignToInvoiceActions, assignToNewInvoiceAction]
      };
    }, {});
  }

  generateAssignItemToInvoiceActions(bills: APBill[]): TableAction[] {
    let newActions: TableAction[] = [];
    if (bills?.length) {
      newActions = bills.reduce((acc, bill) => {
        if (bill.isDraft) {
          return acc.concat({
            label: `Assign to Vendor Invoice ${bill.id}`,
            icon: 'assignment',
            labelClasses: ['text-primary'],
            value: bill.id
          });
        }

        return acc;
      }, []);
    }
    return newActions;
  }

  private loadData() {
    forkJoin(this.purchaseOrdersService.getDataRequestsArray())
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
          this.loadPurchaseOrders();
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
    const ids = this.purchaseOrdersList.reduce((acc, item) => {
      if (item.transaction) {
        return [...acc, item.transaction];
      }

      return acc;
    }, []);

    if (ids?.length) {
      return this.purchaseOrdersService.getTransactions(ids);
    }

    return of([]);
  }
}
