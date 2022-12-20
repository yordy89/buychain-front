import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TableAction } from '@app/models';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { DxDataGridComponent } from 'devextreme-angular';
import { Environment } from '@services/app-layer/app-layer.environment';
import { BookmarkService } from '@services/app-layer/bookmark/bookmark.service';
import { APBill } from '@services/app-layer/entities/accounts-payable';
import { TransactionEntity } from '@services/app-layer/entities/transaction';
import { GridHelperService } from '@services/helpers/grid-helper/grid-helper.service';
import { NavigationHelperService } from '@services/helpers/navigation-helper/navigation-helper.service';
import { ObjectUtil } from '@services/helpers/utils/object-util';
import { BookmarkComponent } from '@views/main/common/bookmark/bookmark.component';
import { BillsService } from '@views/main/accounting/accounts-payable/bills/bills.service';
import {
  APBillsFilters,
  APBillsFiltersState,
  BillsFiltersComponent
} from '@views/main/accounting/accounts-payable/bills/components/bills-filters/bills-filters.component';
import { BillsApiService } from '@services/app-layer/bills/bills-api.services';

class ViewState {
  grid = null;
  filters: APBillsFilters = {
    state: [],
    dueDate: null
  };
  filtersState: APBillsFiltersState = {
    stateExpanded: false,
    dueDateExpanded: false
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
  selector: 'app-bills',
  templateUrl: 'bills.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BillsComponent implements OnInit, OnDestroy {
  @ViewChild('grid') grid: DxDataGridComponent;
  @ViewChild(BookmarkComponent) bookmarkComp: BookmarkComponent;
  @ViewChild(BillsFiltersComponent) billsFiltersComponent: BillsFiltersComponent;

  private offset = 0;
  private limit = 1000;
  allLoaded = false;

  billsList: APBill[] = [];
  transactions: TransactionEntity[];

  visibleRows = 0;

  permissions = { canRead: false, canCreate: false, canUpdate: false, canDelete: false };

  viewState: ViewState;
  defaultState = new ViewState();
  actions: TableAction[] = [];
  isExpandedAllDetailRows = false;
  isChartVisible = false;
  isLoaded = false;

  readonly viewKey = 'accountingAPBills';

  private latestFilters = new ViewState().filters;
  private destroy$ = new Subject<void>();

  constructor(
    private billsService: BillsService,
    private billsApiService: BillsApiService,
    private navigationHelperService: NavigationHelperService,
    private bookmarkService: BookmarkService,
    private cd: ChangeDetectorRef,
    private gridHelperService: GridHelperService,
    private router: Router,
    private route: ActivatedRoute
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
      this.initTableActions();
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
    this.searchBills();
    this.setGridState();
    this.billsFiltersComponent.setFilterValues(viewState.filters);
  }

  searchBills(): void {
    if (this.isFiltersChanged()) {
      this.billsList = [];
      this.offset = 0;
      this.bookmarkService.saveSessionLastState(this.viewKey, this.viewState);
    }
    this.loadBills();
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
      () => !this.billsList.length
    );
    this.cd.markForCheck();
  }

  loadBills() {
    this.billsService
      .getBills(this.limit, this.offset, this.viewState.filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe(items => {
        this.allLoaded = items.length < this.limit;
        this.offset += this.limit;
        this.billsList = this.billsList.concat(...items);
        this.setLatestFilters();
        this.isLoaded = true;
        this.cd.markForCheck();
      });
  }

  onAction(value: Actions, item: APBill) {
    switch (value) {
      case Actions.VIEW:
        this.viewBill(item);
        break;
      case Actions.VIEW_IN_NEW_TAB:
        this.viewBillInNewTab(item);
        break;
      case Actions.VIEW_IN_NEW_WINDOW:
        this.viewBillInNewWindow(item);
        break;
      case Actions.EDIT:
        this.editBill(item);
        break;
      case Actions.DELETE:
        this.deleteBill(item);
        break;
    }
  }

  private viewBill(entry: APBill) {
    this.router.navigate([entry.id], { relativeTo: this.route });
  }

  viewBillInNewTab(entry: APBill) {
    window.open(`${location.href}/${entry.id}`);
  }

  viewBillInNewWindow(entry: APBill) {
    const strWindowFeatures = 'location=yes';
    window.open(`${location.href}/${entry.id}`, '_blank', strWindowFeatures);
  }

  private editBill(entry: APBill) {
    this.router.navigate([entry.id], {
      relativeTo: this.route,
      queryParams: { editBill: true }
    });
  }

  private deleteBill(entry: APBill) {
    this.billsApiService
      .deleteBill(entry.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const index = this.billsList.findIndex(item => item.id === entry.id);
        if (index === -1) {
          return;
        }
        this.billsList = this.billsList.filter(item => item.id !== entry.id);
        this.offset--;
        this.cd.markForCheck();
      });
  }

  private setPermissions(): void {
    this.permissions = this.billsService.getBillPermissions();
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
        isHidden: () => !this.permissions.canUpdate
      },
      {
        label: 'Delete',
        icon: 'delete',
        color: 'warn',
        value: Actions.DELETE,
        prompt: {
          title: 'Confirm please!',
          text: 'Are you sure you want to delete this Vendor Invoice?'
        },
        isHidden: (action, item: APBill) => !(this.permissions.canDelete && item.isDeleteAllowed)
      }
    ];
  }

  private loadData() {
    this.loadBills();
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
}
