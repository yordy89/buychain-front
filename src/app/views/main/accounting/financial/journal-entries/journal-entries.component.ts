import { formatCurrency } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Inject,
  LOCALE_ID,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TextBadge } from '@app/constants';
import { TableAction } from '@app/models';
import { FABAction } from '@app/models/fab-action';
import {
  AccountingJournalReviewStatusEnum,
  AccountingJournalStatusEnum,
  AccountingJournalTypeEnum
} from '@services/app-layer/app-layer.enums';
import { Environment } from '@services/app-layer/app-layer.environment';
import { BookmarkService } from '@services/app-layer/bookmark/bookmark.service';
import { AccountEntity } from '@services/app-layer/entities/account';
import { CrmAccountEntity } from '@services/app-layer/entities/crm';
import { DimensionEntity } from '@services/app-layer/entities/dimension';
import { GroupEntity } from '@services/app-layer/entities/group';
import { JournalEntryEntity, JournalLine } from '@services/app-layer/entities/journal-entries';
import { MemberEntity } from '@services/app-layer/entities/member';
import { JournalEntriesApiService } from '@services/app-layer/journal-entries/journal-entries-api.service';
import { SearchService } from '@services/app-layer/search/search.service';
import { GridHelperService } from '@services/helpers/grid-helper/grid-helper.service';
import { NavigationHelperService } from '@services/helpers/navigation-helper/navigation-helper.service';
import { ListUtilHelper } from '@services/helpers/utils/list-util.helper';
import { ObjectUtil } from '@services/helpers/utils/object-util';
import { JournalEntriesFiltersService } from '@views/main/accounting/financial/journal-entries/journal-entries-filters.service';
import { JournalEntriesService } from '@views/main/accounting/financial/journal-entries/journal-entries.service';
import { BookmarkComponent } from '@views/main/common/bookmark/bookmark.component';
import { DxDataGridComponent } from 'devextreme-angular';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { JournalEntriesFiltersComponent } from '@views/main/accounting/financial/journal-entries/components/journal-entries-filters/journal-entries-filters.component';

class ViewState {
  grid = null;
  filters = {
    group: '',
    includeChildGroups: false,
    source: [],
    type: [],
    postDateFrom: null,
    postDateTo: null,
    reverseDateFrom: null,
    reverseDateTo: null,
    approvalDateFrom: null,
    approvalDateTo: null,
    account: '',
    status: [],
    dimension: '',
    approver: '',
    createdBy: '',
    lastModifiedBy: ''
  };
  filtersState = {
    groupExpanded: false,
    sourceExpanded: false,
    typeExpanded: false,
    postDateExpanded: false,
    reverseDateExpanded: false,
    approvalDateExpanded: false,
    accountExpanded: false,
    statusExpanded: false,
    dimensionExpanded: false,
    approverExpanded: false,
    createdByExpanded: false,
    lastModifiedByExpanded: false
  };
}

enum Actions {
  EDIT,
  DELETE,
  VIEW,
  VIEW_IN_NEW_TAB,
  VIEW_IN_NEW_WINDOW,
  APPROVE,
  REJECT,
  REQUEST_REVIEW
}

enum FABActions {
  MARK_FOR_REVIEW,
  REJECT,
  APPROVE,
  CLEAR_ALL,
  DELETE
}

const targetTypeSortOrderArr = [
  AccountingJournalStatusEnum.DRAFT,
  AccountingJournalStatusEnum.UNDER_REVIEW,
  AccountingJournalStatusEnum.REJECTED,
  AccountingJournalStatusEnum.APPROVED
];

@Component({
  selector: 'app-journal-entries',
  templateUrl: 'journal-entries.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class JournalEntriesComponent implements OnInit, OnDestroy {
  @ViewChild('grid') grid: DxDataGridComponent;
  @ViewChild(BookmarkComponent) bookmarkComp: BookmarkComponent;
  @ViewChild(JournalEntriesFiltersComponent) journalEntriesFiltersComponent: JournalEntriesFiltersComponent;

  crmAccountsList: CrmAccountEntity[] = [];
  groupsList: GroupEntity[] = [];
  accountsList: AccountEntity[] = [];
  journalsList: JournalEntryEntity[] = [];
  dimensionsList: DimensionEntity[] = [];
  members: MemberEntity[] = [];

  visibleRows = 0;

  permissions = { canRead: false, canCreate: false, canUpdate: false, canDelete: false };

  selectedRows = [];

  readonly typesEnum = AccountingJournalTypeEnum;
  readonly viewKey = 'accountingJournalEntries';

  isExpandedAllDetailRows = false;

  gridFilterValue = [];
  viewState: ViewState;
  defaultState = new ViewState();
  private latestFilters = new ViewState().filters;

  private offset = 0;
  private limit = 1000;
  allLoaded = false;

  actions: TableAction[] = [];
  fabActions: FABAction[] = [];

  isLoaded = false;

  private destroy$ = new Subject<void>();

  constructor(
    @Inject(LOCALE_ID) private localeId: string,
    private navigationHelperService: NavigationHelperService,
    private journalEntriesApiService: JournalEntriesApiService,
    private cd: ChangeDetectorRef,
    private bookmarkService: BookmarkService,
    private gridHelperService: GridHelperService,
    private route: ActivatedRoute,
    private router: Router,
    private journalEntriesService: JournalEntriesService,
    private searchService: SearchService,
    private filtersService: JournalEntriesFiltersService
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
      this.initFABTableActions();
      this.loadData();
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private clearSelectedItems() {
    this.selectedRows = [];
  }

  onToolbarPreparing(e) {
    this.gridHelperService.prepareToolbarCollapseExpand(
      e,
      () => this.grid,
      () => (this.isExpandedAllDetailRows = false),
      () => (this.isExpandedAllDetailRows = true)
    );
    this.gridHelperService.prepareToolbarPrefixTemplate(e);
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

  onExporting(e) {
    this.gridHelperService.exportToExcel(e, 'Journal Entries');
  }

  saveGridState(gridState) {
    const gridStoringState = ObjectUtil.getDeepCopy(gridState);
    gridStoringState.selectedRowKeys = [];
    this.viewState = { ...this.viewState, grid: gridStoringState };
    this.cd.markForCheck();
  }

  searchJournalEntries(): void {
    if (this.isFiltersChanged()) {
      this.offset = 0;
      this.journalsList = [];
      this.bookmarkService.saveSessionLastState(this.viewKey, this.viewState);
    }
    this.loadJournalEntries();
  }

  onViewStateChanged(viewState: ViewState) {
    this.viewState = viewState;
    this.searchJournalEntries();
    this.setGridState();
    this.journalEntriesFiltersComponent.setFilterValues(viewState.filters);
  }

  getJournalEntryUrl(id: string) {
    return `${location.href}/${id}`;
  }

  loadJournalEntries() {
    const payload = this.filtersService.getJournalEntriesSearchPayload(
      this.limit,
      this.offset,
      this.viewState.filters,
      this.groupsList
    );
    this.searchService
      .fetchJournalEntriesData(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe(items => {
        this.allLoaded = items.length < this.limit;
        this.offset += this.limit;
        this.journalsList.push(...items);
        this.setLatestFilters();
        this.isLoaded = true;
        this.cd.markForCheck();
      });
  }

  onToggleDetailRowsExpandState() {
    if (this.isExpandedAllDetailRows) {
      this.gridHelperService.collapseAllMasterRows(this.grid);
    } else {
      this.gridHelperService.expandAllMasterRows(this.grid);
    }

    this.isExpandedAllDetailRows = !this.isExpandedAllDetailRows;
  }

  onCellPrepared(e: any) {
    const cb = (data: JournalEntryEntity) =>
      !(data.isDraftManual && (this.permissions.canDelete || this.permissions.canUpdate));
    this.gridHelperService.disableCheckboxes(e, cb);
  }

  get isDisabledFiltering() {
    return this.allLoaded && !this.isFiltersChanged();
  }

  onViewJournalEntry(entry: JournalEntryEntity) {
    this.router.navigate([entry.id], { relativeTo: this.route });
  }

  openJournalEntryInNewTab(entry: JournalEntryEntity) {
    window.open(`${location.href}/${entry.id}`);
  }

  openJournalEntryInNewWindow(entry: JournalEntryEntity) {
    const strWindowFeatures = 'location=yes';
    window.open(`${location.href}/${entry.id}`, '_blank', strWindowFeatures);
  }

  onAddJournalEntry() {
    this.router.navigate(['add'], { relativeTo: this.route });
  }

  onEditJournalEntry(entry: JournalEntryEntity) {
    this.router.navigate([entry.id], {
      relativeTo: this.route,
      queryParams: { edit: true }
    });
  }

  private approveSelectedItems() {
    this.journalEntriesService
      .approveSelectedItems(this.selectedRows, this.journalsList)
      .pipe(takeUntil(this.destroy$))
      .subscribe(resp => {
        this.updateRowsData(resp);
      });
  }

  onRequestReview(entry: JournalEntryEntity) {
    const payload = {
      reviewStatus: AccountingJournalReviewStatusEnum.REQUEST
    };
    this.journalEntriesApiService
      .editJournalEntry(entry.id, payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe(item => {
        this.updateList(item);
        this.cd.markForCheck();
      });
  }

  onReject(entry: JournalEntryEntity) {
    const payload = { reviewStatus: AccountingJournalReviewStatusEnum.REJECT };
    this.journalEntriesApiService
      .editJournalEntry(entry.id, payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe(item => {
        this.updateList(item);
        this.cd.markForCheck();
      });
  }

  onApproveJournalEntry(entry: JournalEntryEntity) {
    this.journalEntriesApiService
      .approveJournalEntry(entry.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe((approvedItem: JournalEntryEntity) => {
        this.updateList(approvedItem);
        this.cd.markForCheck();
      });
  }

  private deleteSelectedItems() {
    this.journalEntriesService
      .deleteSelectedItems(this.selectedRows, this.journalsList)
      .pipe(takeUntil(this.destroy$))
      .subscribe(({ selectedRows, journalsList }) => {
        const diff = this.journalsList.length - journalsList.length;
        this.offset -= diff;
        this.updateRowsData({ selectedRows, journalsList });
      });
  }

  private rejectSelectedItems() {
    this.journalEntriesService
      .changeReviewStatusForSelectedItems(
        this.selectedRows,
        this.journalsList,
        AccountingJournalReviewStatusEnum.REJECT
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe(resp => {
        this.updateRowsData(resp);
      });
  }

  private requestReviewSelectedItems() {
    this.journalEntriesService
      .changeReviewStatusForSelectedItems(
        this.selectedRows,
        this.journalsList,
        AccountingJournalReviewStatusEnum.REQUEST
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe(resp => {
        this.updateRowsData(resp);
      });
  }

  private updateRowsData({ selectedRows, journalsList }) {
    this.journalsList = journalsList;
    this.selectedRows = selectedRows;
    this.cd.markForCheck();
  }

  private onDeleteJournalEntry(entry: JournalEntryEntity) {
    this.journalEntriesApiService
      .deleteJournalEntry(entry.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const index = this.journalsList.findIndex(item => item.id === entry.id);
        if (index === -1) {
          return;
        }
        this.journalsList = this.journalsList.filter(item => item.id !== entry.id);
        this.offset--;
        this.cd.markForCheck();
      });
  }

  onAction(value: Actions, entry: JournalEntryEntity) {
    switch (value) {
      case Actions.EDIT:
        this.onEditJournalEntry(entry);
        break;

      case Actions.DELETE:
        this.onDeleteJournalEntry(entry);
        break;

      case Actions.VIEW:
        this.onViewJournalEntry(entry);
        break;

      case Actions.VIEW_IN_NEW_TAB:
        this.openJournalEntryInNewTab(entry);
        break;

      case Actions.VIEW_IN_NEW_WINDOW:
        this.openJournalEntryInNewWindow(entry);
        break;

      case Actions.APPROVE:
        this.onApproveJournalEntry(entry);
        break;

      case Actions.REQUEST_REVIEW:
        this.onRequestReview(entry);
        break;

      case Actions.REJECT:
        this.onReject(entry);
        break;
    }
  }

  onFABAction(value: FABActions) {
    switch (value) {
      case FABActions.MARK_FOR_REVIEW:
        this.requestReviewSelectedItems();
        break;

      case FABActions.REJECT:
        this.rejectSelectedItems();
        break;

      case FABActions.APPROVE:
        this.approveSelectedItems();
        break;

      case FABActions.CLEAR_ALL:
        this.clearSelectedItems();
        break;

      case FABActions.DELETE:
        this.deleteSelectedItems();
        break;
    }
  }

  calculateDisplayGroupValue = (rowData: JournalEntryEntity) => {
    return ListUtilHelper.getDisplayValueFromList(rowData.group, this.groupsList);
  };

  calculateDisplayDimensionsValue = (rowData: JournalEntryEntity) => {
    return rowData.dimensions
      .map(item => ListUtilHelper.getDisplayValueFromList(item, this.dimensionsList))
      .join(' | ');
  };

  calculateDisplayCreatedByValue = (rowData: JournalEntryEntity) => {
    return ListUtilHelper.getDisplayValueFromList(rowData.createdBy, this.members);
  };

  calculateDisplayLastModifiedByValue = (rowData: JournalEntryEntity) => {
    return ListUtilHelper.getDisplayValueFromList(rowData.lastModifiedBy, this.members);
  };

  calculateDisplayCustomerValue = (rowData: JournalEntryEntity) => {
    return ListUtilHelper.getDisplayValueFromList(rowData.customer, this.crmAccountsList);
  };

  calculateDisplayVendorValue = (rowData: JournalEntryEntity) => {
    return ListUtilHelper.getDisplayValueFromList(rowData.vendor, this.crmAccountsList);
  };

  calculateDisplayApproverValue = (rowData: JournalEntryEntity) => {
    return ListUtilHelper.getDisplayValueFromList(rowData.approver, this.members);
  };

  calculateDisplayAccountNumberValue = (rowData: JournalLine) => {
    return ListUtilHelper.getDisplayValueFromList(rowData.account, this.accountsList, 'id', 'numberAndName');
  };

  formatTotalCurrency = e => formatCurrency(e.value, this.localeId, '$');

  calculateStatusGroupValue(rowData) {
    const index = targetTypeSortOrderArr.findIndex(item => item === rowData.status);
    return `${index}:${rowData.status}`;
  }

  statusTextClass(status) {
    switch (status) {
      case AccountingJournalStatusEnum.APPROVED:
        return TextBadge.success;
      case AccountingJournalStatusEnum.DRAFT:
        return TextBadge.primary;
      case AccountingJournalStatusEnum.REJECTED:
        return TextBadge.danger;
      case AccountingJournalStatusEnum.UNDER_REVIEW:
        return TextBadge.warning;
      default:
        return '';
    }
  }

  private initViewState() {
    this.viewState = this.bookmarkService.getSessionState(this.viewKey, new ViewState(), this.defaultState);
  }

  private setPermissions(): void {
    this.permissions = this.journalEntriesService.getPermissions();
  }

  private loadData() {
    this.journalEntriesService
      .getData()
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        ([accounts, dimensions, groups, crmAccounts, members]: [
          AccountEntity[],
          DimensionEntity[],
          GroupEntity[],
          CrmAccountEntity[],
          MemberEntity[]
        ]) => {
          this.accountsList = accounts;
          this.dimensionsList = dimensions;
          this.groupsList = groups;
          this.crmAccountsList = crmAccounts;
          this.members = members;
          this.loadJournalEntries();
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

  isFiltersChanged(): boolean {
    return !ObjectUtil.isDeepEquals(this.latestFilters, this.viewState.filters);
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
        isHidden: (action, item: JournalEntryEntity) => !(this.permissions.canUpdate && item.isDraftManual)
      },
      {
        label: 'Mark For Review',
        icon: 'rate_review',
        value: Actions.REQUEST_REVIEW,
        isHidden: (action, item: JournalEntryEntity) => {
          return !(
            this.permissions.canUpdate &&
            item.isDraftManual &&
            item.reviewStatus !== AccountingJournalReviewStatusEnum.REQUEST
          );
        }
      },
      {
        label: 'Reject',
        icon: 'not_interested',
        value: Actions.REJECT,
        isHidden: (action, item: JournalEntryEntity) => {
          return !(
            this.permissions.canUpdate &&
            item.isDraftManual &&
            item.reviewStatus !== AccountingJournalReviewStatusEnum.REJECT
          );
        }
      },
      {
        label: 'Approve',
        icon: 'check',
        value: Actions.APPROVE,
        isHidden: (action, item: JournalEntryEntity) => !(this.permissions.canUpdate && item.isDraftManual)
      },
      {
        label: 'Delete',
        icon: 'delete',
        color: 'warn',
        value: Actions.DELETE,
        prompt: {
          title: 'Confirm please!',
          text: 'Are you sure you want to delete Journal Entry?'
        },
        isHidden: (action, item: JournalEntryEntity) => !(this.permissions.canDelete && item.isDraftManual)
      }
    ];
  }

  private initFABTableActions() {
    this.fabActions = [
      {
        label: 'Mark For Review',
        icon: 'rate_review',
        value: FABActions.MARK_FOR_REVIEW,
        isHidden: () => !this.permissions.canUpdate
      },
      {
        label: 'Reject',
        icon: 'not_interested',
        value: FABActions.REJECT,
        isHidden: () => !this.permissions.canUpdate
      },
      {
        label: 'Approve',
        icon: 'check',
        value: FABActions.APPROVE,
        isHidden: () => !this.permissions.canUpdate
      },
      {
        label: 'Clear All',
        icon: 'clear_all',
        value: FABActions.CLEAR_ALL
      },
      {
        label: 'Delete',
        icon: 'delete',
        color: 'warn',
        value: FABActions.DELETE,
        prompt: {
          title: 'Confirm please!',
          text: 'Are you sure you want to delete Journal Entries?'
        },
        isHidden: () => !this.permissions.canDelete
      }
    ];
  }

  private updateList(item) {
    this.journalsList = this.journalsList.map(elem => (elem.id === item.id ? item : elem));
  }
}
