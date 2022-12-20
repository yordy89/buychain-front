import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TableAction } from '@app/models';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { DxDataGridComponent } from 'devextreme-angular';
import { Environment } from '@services/app-layer/app-layer.environment';
import { BookmarkService } from '@services/app-layer/bookmark/bookmark.service';
import { ARInvoice } from '@services/app-layer/entities/accounts-receivable';
import { TransactionEntity } from '@services/app-layer/entities/transaction';
import { GridHelperService } from '@services/helpers/grid-helper/grid-helper.service';
import { NavigationHelperService } from '@services/helpers/navigation-helper/navigation-helper.service';
import { ObjectUtil } from '@services/helpers/utils/object-util';
import { BookmarkComponent } from '@views/main/common/bookmark/bookmark.component';
import { InvoicesService } from '@views/main/accounting/accounts-receivable/invoices/invoices.service';
import {
  ARInvoicesFilters,
  ARInvoicesFiltersState,
  InvoicesFiltersComponent
} from '@views/main/accounting/accounts-receivable/invoices/components/invoices-filters/invoices-filters.component';

class ViewState {
  grid = null;
  filters: ARInvoicesFilters = {
    state: [],
    invoiceDate: null,
    dueDate: null
  };
  filtersState: ARInvoicesFiltersState = {
    invoiceDateExpanded: false,
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
  selector: 'app-invoices',
  templateUrl: 'invoices.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InvoicesComponent implements OnInit, OnDestroy {
  @ViewChild('grid') grid: DxDataGridComponent;
  @ViewChild(BookmarkComponent) bookmarkComp: BookmarkComponent;
  @ViewChild(InvoicesFiltersComponent) invoicesFiltersComponent: InvoicesFiltersComponent;

  private offset = 0;
  private limit = 1000;
  allLoaded = false;

  invoicesList: ARInvoice[] = [];
  transactions: TransactionEntity[];

  visibleRows = 0;

  permissions = { canRead: false, canCreate: false, canUpdate: false, canDelete: false };

  viewState: ViewState;
  defaultState = new ViewState();
  actions: TableAction[] = [];
  isExpandedAllDetailRows = false;
  isChartVisible = false;
  isLoaded = false;

  readonly viewKey = 'accountingARInvoices';

  private latestFilters = new ViewState().filters;
  private destroy$ = new Subject<void>();

  constructor(
    private invoicesService: InvoicesService,
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
    this.searchInvoices();
    this.setGridState();
    this.invoicesFiltersComponent.setFilterValues(viewState.filters);
  }

  searchInvoices(): void {
    if (this.isFiltersChanged()) {
      this.invoicesList = [];
      this.offset = 0;
      this.bookmarkService.saveSessionLastState(this.viewKey, this.viewState);
    }
    this.loadInvoices();
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
      () => !this.invoicesList.length
    );
    this.cd.markForCheck();
  }

  onCloseChart() {
    this.isChartVisible = false;
  }

  getInvoiceUrl(id: string) {
    return `${location.href}/${id}`;
  }

  loadInvoices() {
    this.invoicesService
      .getInvoices(this.limit, this.offset, this.viewState.filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe(items => {
        this.allLoaded = items.length < this.limit;
        this.offset += this.limit;
        this.invoicesList = this.invoicesList.concat(...items);
        this.setLatestFilters();
        this.isLoaded = true;
        this.cd.markForCheck();
      });
  }

  onAction(value: Actions, item: ARInvoice) {
    switch (value) {
      case Actions.VIEW:
        this.viewInvoice(item);
        break;
      case Actions.VIEW_IN_NEW_TAB:
        this.viewInvoiceInNewTab(item);
        break;
      case Actions.VIEW_IN_NEW_WINDOW:
        this.viewInvoiceInNewWindow(item);
        break;
      case Actions.EDIT:
        this.editInvoice(item);
        break;
      case Actions.DELETE:
        this.deleteInvoice(item);
        break;
    }
  }

  private viewInvoice(entry: ARInvoice) {
    this.router.navigate([entry.id], { relativeTo: this.route });
  }

  private viewInvoiceInNewTab(entry: ARInvoice) {
    window.open(`${location.href}/${entry.id}`);
  }

  private viewInvoiceInNewWindow(entry: ARInvoice) {
    const strWindowFeatures = 'location=yes';
    window.open(`${location.href}/${entry.id}`, '_blank', strWindowFeatures);
  }

  private editInvoice(entry: ARInvoice) {
    this.router.navigate([entry.id], {
      relativeTo: this.route,
      queryParams: { editInvoice: true }
    });
  }

  private deleteInvoice(entry: ARInvoice) {
    this.invoicesService
      .deleteInvoice(entry.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const index = this.invoicesList.findIndex(item => item.id === entry.id);
        if (index === -1) {
          return;
        }
        this.invoicesList = this.invoicesList.filter(item => item.id !== entry.id);
        this.offset--;
        this.cd.markForCheck();
      });
  }

  private setPermissions(): void {
    this.permissions = this.invoicesService.getInvoicePermissions();
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
          text: 'Are you sure you want to delete this Invoice?'
        },
        isHidden: (action, item: ARInvoice) => !(this.permissions.canDelete && item.isDeleteAllowed)
      }
    ];
  }

  private loadData() {
    this.loadInvoices();
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
