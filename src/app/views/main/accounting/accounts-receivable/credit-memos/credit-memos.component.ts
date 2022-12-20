import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { forkJoin, Subject } from 'rxjs';
import { Environment } from '@services/app-layer/app-layer.environment';
import { NavigationHelperService } from '@services/helpers/navigation-helper/navigation-helper.service';
import { ActivatedRoute, Router } from '@angular/router';
import { CreditMemosService } from '@views/main/accounting/accounts-receivable/credit-memos/credit-memos.service';
import { DxDataGridComponent } from 'devextreme-angular';
import { BookmarkComponent } from '@views/main/common/bookmark/bookmark.component';
import { CrmAccountEntity } from '@services/app-layer/entities/crm';
import { ARCreditMemo, ARInvoice } from '@services/app-layer/entities/accounts-receivable';
import { TableAction } from '@app/models';
import {
  ARCreditMemosFilters,
  ARCreditMemosFiltersState,
  CreditMemosFiltersComponent
} from '@views/main/accounting/accounts-receivable/credit-memos/components/credit-memos-filters/credit-memos-filters.component';
import { ObjectUtil } from '@services/helpers/utils/object-util';
import { ARCreditMemoReviewStateEnum, ARCreditMemoStateEnum } from '@services/app-layer/app-layer.enums';
import { GridHelperService } from '@services/helpers/grid-helper/grid-helper.service';
import { ListUtilHelper } from '@services/helpers/utils/list-util.helper';
import { BookmarkService } from '@services/app-layer/bookmark/bookmark.service';
import { map, takeUntil } from 'rxjs/operators';
import { CreditMemosApiService } from '@services/app-layer/credit-memos/credit-memos-api.services';
import { Badge } from '@app/constants';

class ViewState {
  grid = null;
  filters: ARCreditMemosFilters = {
    state: [],
    reviewState: [],
    customers: []
  };
  filtersState: ARCreditMemosFiltersState = {
    customersExpanded: false,
    stateExpanded: false,
    reviewStateExpanded: false
  };
}

enum Actions {
  VIEW,
  VIEW_IN_NEW_TAB,
  VIEW_IN_NEW_WINDOW,
  EDIT,
  DELETE
}

@Component({
  selector: 'app-credit-memos',
  templateUrl: 'credit-memos.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreditMemosComponent implements OnInit, OnDestroy {
  @ViewChild('grid') grid: DxDataGridComponent;
  @ViewChild(BookmarkComponent) bookmarkComp: BookmarkComponent;
  @ViewChild(CreditMemosFiltersComponent) creditMemosFiltersComponent: CreditMemosFiltersComponent;

  private offset = 0;
  private limit = 1000;
  allLoaded = false;

  creditMemosList: ARCreditMemo[] = [];
  crmAccountsList: CrmAccountEntity[] = [];
  invoicesList: ARInvoice[] = [];

  visibleRows = 0;

  permissions = { canRead: false, canCreate: false, canUpdate: false, canDelete: false };

  viewState: ViewState;
  defaultState = new ViewState();
  actions: TableAction[] = [];

  isLoaded = false;

  readonly viewKey = 'accountingARCreditMemos';

  private latestFilters = new ViewState().filters;
  private destroy$ = new Subject<void>();

  constructor(
    private creditMemosService: CreditMemosService,
    private creditMemosApiService: CreditMemosApiService,
    private navigationHelperService: NavigationHelperService,
    private router: Router,
    private route: ActivatedRoute,
    private gridHelperService: GridHelperService,
    private bookmarkService: BookmarkService,
    private cd: ChangeDetectorRef
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
    this.searchCreditMemos();
    this.setGridState();
    this.creditMemosFiltersComponent.setFilterValues(viewState.filters);
  }

  onExporting(e) {
    this.gridHelperService.exportToExcel(e, 'Credit Memos');
  }

  stateTextClass(state: ARCreditMemoStateEnum) {
    switch (state) {
      case ARCreditMemoStateEnum.CREDITED:
      case ARCreditMemoStateEnum.APPLIED:
      case ARCreditMemoStateEnum.PARTIAL_APPLIED:
        return 'text-badge-success';
      case ARCreditMemoStateEnum.DRAFT:
        return 'text-badge-primary';
      case ARCreditMemoStateEnum.SUBMITTED:
        return 'text-badge-warning';
      default:
        return '';
    }
  }

  reviewStateTextClass(reviewState: ARCreditMemoReviewStateEnum) {
    switch (reviewState) {
      case ARCreditMemoReviewStateEnum.DRAFT:
        return Badge.primary;
      case ARCreditMemoReviewStateEnum.APPROVED:
        return Badge.success;
      case ARCreditMemoReviewStateEnum.REVIEW:
        return Badge.warning;
      case ARCreditMemoReviewStateEnum.REJECT:
        return Badge.danger;
      default:
        return '';
    }
  }

  calculateDisplayCustomerValue = (rowData: ARCreditMemo) =>
    ListUtilHelper.getDisplayValueFromList(rowData.customer.toString(), this.crmAccountsList);

  calculateDisplayAppliedToValue = (rowData: ARCreditMemo) => {
    if (rowData?.appliedTo?.length === 1) {
      const appliedToId = rowData.appliedTo[0];
      const invoice = this.invoicesList.find(invoice => invoice.id === appliedToId);
      return invoice ? `Invoice ${invoice.number}` : null;
    }

    if (rowData?.appliedTo?.length > 1) {
      return 'General Credit';
    }

    return null;
  };

  searchCreditMemos(): void {
    if (this.isFiltersChanged()) {
      this.offset = 0;
      this.creditMemosList = [];
      this.bookmarkService.saveSessionLastState(this.viewKey, this.viewState);
    }
    this.loadCreditMemos();
  }

  isFiltersChanged(): boolean {
    return !ObjectUtil.isDeepEquals(this.latestFilters, this.viewState.filters);
  }

  onToolbarPreparing(e) {
    this.gridHelperService.prepareToolbarPrefixTemplate(e);
    this.cd.markForCheck();
  }

  getCreditMemoUrl(id: string) {
    return `${location.href}/${id}`;
  }

  loadCreditMemos() {
    this.creditMemosApiService
      .getCreditMemos(this.limit, this.offset, this.viewState.filters)
      .pipe(
        map(items => {
          this.allLoaded = items.length < this.limit;
          this.offset += this.limit;
          this.setLatestFilters();
          this.isLoaded = true;
          this.creditMemosList = this.creditMemosList.concat(items);
          this.initTableActions();
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.cd.markForCheck();
      });
  }

  onAction(value: Actions, item: ARCreditMemo) {
    switch (value) {
      case Actions.VIEW:
        this.viewCreditMemo(item);
        break;
      case Actions.VIEW_IN_NEW_TAB:
        this.viewCreditMemoInNewTab(item);
        break;
      case Actions.VIEW_IN_NEW_WINDOW:
        this.viewCreditMemoInNewWindow(item);
        break;
      case Actions.EDIT:
        this.editCreditMemo(item);
        break;
      case Actions.DELETE:
        this.deleteCreditMemo(item);
        break;
    }
  }

  viewCreditMemo(entry: ARCreditMemo) {
    this.router.navigate([entry.id], { relativeTo: this.route });
  }

  viewCreditMemoInNewTab(entry: ARCreditMemo) {
    window.open(`${location.href}/${entry.id}`);
  }

  viewCreditMemoInNewWindow(entry: ARCreditMemo) {
    const strWindowFeatures = 'location=yes';
    window.open(`${location.href}/${entry.id}`, '_blank', strWindowFeatures);
  }

  private editCreditMemo(entry: ARCreditMemo) {
    this.router.navigate([entry.id], {
      relativeTo: this.route,
      queryParams: { editCreditMemo: true }
    });
  }

  private deleteCreditMemo(entry: ARCreditMemo) {
    this.creditMemosApiService
      .deleteCreditMemo(entry.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const index = this.creditMemosList.findIndex(item => item.id === entry.id);
        if (index === -1) {
          return;
        }
        this.creditMemosList = this.creditMemosList.filter(item => item.id !== entry.id);
        this.offset--;
        this.cd.markForCheck();
      });
  }

  private setPermissions(): void {
    this.permissions = this.creditMemosService.getPermissions();
  }

  private initViewState() {
    this.viewState = this.bookmarkService.getSessionState(this.viewKey, new ViewState(), this.defaultState);
  }

  private initTableActions() {
    this.actions = [
      {
        label: 'View',
        icon: 'visibility',
        value: Actions.VIEW
      },
      {
        label: 'Open in new tab',
        icon: 'reply',
        value: Actions.VIEW_IN_NEW_TAB
      },
      {
        label: 'Open in new window',
        icon: 'reply_all',
        value: Actions.VIEW_IN_NEW_WINDOW
      },
      {
        label: 'Edit',
        icon: 'edit',
        value: Actions.EDIT,
        isHidden: (action, item: ARCreditMemo) => !(this.permissions.canUpdate && item.isEditDeleteAllowed)
      },
      {
        label: 'Delete',
        icon: 'delete',
        color: 'warn',
        value: Actions.DELETE,
        prompt: {
          title: 'Confirm please!',
          text: 'Are you sure you want to delete this Credit Memo?'
        },
        isHidden: (action, item: ARCreditMemo) => !(this.permissions.canDelete && item.isEditDeleteAllowed)
      }
    ];
  }

  private loadData() {
    forkJoin(this.creditMemosService.getDataRequestsArray())
      .pipe(takeUntil(this.destroy$))
      .subscribe(([crmAccounts, invoices]: [CrmAccountEntity[], ARInvoice[]]) => {
        this.crmAccountsList = crmAccounts;
        this.invoicesList = invoices;
        this.loadCreditMemos();
      });
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

  onAddCreditMemo() {
    this.router.navigate(['add'], { relativeTo: this.route });
  }
}
