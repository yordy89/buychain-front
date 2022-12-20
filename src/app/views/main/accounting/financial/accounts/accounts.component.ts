import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { TableAction } from '@app/models';
import { MatDialog } from '@angular/material/dialog';
import { AccountsService } from '@services/app-layer/accounts/accounts.service';
import { AccountingTypeEnum } from '@services/app-layer/app-layer.enums';
import { GridHelperService } from '@services/helpers/grid-helper/grid-helper.service';
import { ViewportHelperService } from '@services/helpers/viewport-helper.service';
import { AddEditAccountModalComponent } from '@views/main/accounting/financial/accounts/add-edit-account-modal/add-edit-account-modal.component';
import { BookmarkComponent } from '@views/main/common/bookmark/bookmark.component';
import { Observable, Subject } from 'rxjs';
import { first, takeUntil } from 'rxjs/operators';
import { AccountEntity } from '@services/app-layer/entities/account';
import { DxDataGridComponent } from 'devextreme-angular';
import { ObjectUtil } from '@services/helpers/utils/object-util';
import { BookmarkService } from '@services/app-layer/bookmark/bookmark.service';
import { NavigationHelperService } from '@services/helpers/navigation-helper/navigation-helper.service';
import { Environment } from '@services/app-layer/app-layer.environment';
import { AccessControlScope } from '@services/app-layer/permission/permission.interface';

class ViewState {
  public grid = null;
  public filters = {
    naturalBalance: '',
    type: ''
  };
  public filtersState = {
    naturalBalanceExpanded: false,
    typeExpanded: false
  };
  public showInactive = false;
}

enum Actions {
  EDIT,
  DELETE
}

const targetTypeSortOrderArr = [
  AccountingTypeEnum.Asset,
  AccountingTypeEnum.Liability,
  AccountingTypeEnum.Equity,
  AccountingTypeEnum.Revenue,
  AccountingTypeEnum.Expense
];

@Component({
  selector: 'app-accounting-accounts',
  templateUrl: './accounts.component.html'
})
export class AccountsComponent implements OnInit, OnDestroy {
  @ViewChild('accountsGrid') accountsGrid: DxDataGridComponent;
  @ViewChild(BookmarkComponent) bookmarkComp: BookmarkComponent;
  public gridFilterValue = [['inactiveString', '=', 'no'], 'and', ['inactiveString', '<>', ' ']];

  public accountsList: AccountEntity[] = [];
  public permissions = { canRead: false, canCreate: false, canUpdate: false, canDelete: false };

  private offset = 0;
  private limit = 1000;
  public allLoaded = false;

  public viewKey = 'accountingAccounts';
  public viewState: ViewState;
  public defaultState = new ViewState();

  actions: TableAction[] = [];
  isTablet$: Observable<boolean>;

  private latestFilters = { naturalBalance: '', type: '' };
  private destroy$ = new Subject<void>();

  constructor(
    private navigationHelperService: NavigationHelperService,
    private accountsService: AccountsService,
    private bookmarkService: BookmarkService,
    private dialog: MatDialog,
    private gridHelperService: GridHelperService,
    private viewportHelperService: ViewportHelperService
  ) {}

  ngOnInit() {
    if (!Environment.getCurrentCompany().features.accounting) {
      this.navigationHelperService.navigateUserHome();
    }
    this.isTablet$ = this.viewportHelperService.isTablet$;
    this.saveGridState = this.saveGridState.bind(this);
    this.loadGridState = this.loadGridState.bind(this);
    this.initViewState();
    this.setPermissions();
    this.handleViewStateFilters();

    if (this.permissions.canRead) {
      this.initTableActions();
      this.loadAccounts();
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  public searchAccounts(): void {
    if (this.isFiltersChanged()) {
      this.offset = 0;
      this.accountsList = [];
      this.bookmarkService.saveSessionLastState(this.viewKey, this.viewState);
    }
    this.loadAccounts();
  }

  public openCreateAccountModal(): void {
    this.dialog
      .open(AddEditAccountModalComponent, {
        width: '648px',
        disableClose: true
      })
      .afterClosed()
      .pipe(first())
      .subscribe(addedAccount => {
        if (addedAccount) {
          this.accountsList.push(addedAccount);
          this.offset++;
        }
      });
  }

  public deleteAccount(account: AccountEntity): void {
    this.accountsService.deleteAccount(account.id).subscribe(() => {
      const index = this.accountsList.findIndex(item => item.id === account.id);

      if (index === -1) return;

      this.accountsList = this.accountsList.filter(item => item.id !== account.id);
      this.offset--;
    });
  }

  public editAccount(account: AccountEntity): void {
    this.dialog
      .open(AddEditAccountModalComponent, {
        width: '648px',
        disableClose: true,
        data: account
      })
      .afterClosed()
      .pipe(first())
      .subscribe(data => {
        if (data) {
          this.accountsList = this.accountsList.map(item => (item.id === data.id ? data : item));
        }
      });
  }

  calculateTypeGroupValue(rowData) {
    const index = targetTypeSortOrderArr.findIndex(item => item === rowData.type);
    return `${index}:${rowData.type}`;
  }

  public onToolbarPreparing(e) {
    this.gridHelperService.prepareToolbarCollapseExpand(e, () => this.accountsGrid);
    this.gridHelperService.prepareToolbarPrefixTemplate(e);
  }

  public handleViewStateFilters(): void {
    this.showInactiveSwitch({ checked: this.viewState?.showInactive });
  }

  public showInactiveSwitch(e): void {
    const newFilter = ObjectUtil.getDeepCopy(this.gridFilterValue);
    newFilter[0] = e.checked ? ['inactiveString', '<>', ''] : ['inactiveString', '=', 'no'];
    this.gridFilterValue = newFilter;
    this.viewState.showInactive = e.checked;
  }

  public onViewStateChanged(viewState: ViewState) {
    this.viewState = viewState;
    this.searchAccounts();
    this.setGridState();
  }
  public setGridState() {
    if (this.accountsGrid) this.accountsGrid.instance.state(this.viewState.grid);
    this.handleViewStateFilters();
  }
  public loadGridState() {
    return this.viewState.grid;
  }
  public saveGridState(gridState) {
    const gridStoringState = ObjectUtil.getDeepCopy(gridState);
    gridStoringState.selectedRowKeys = [];
    this.viewState = { ...this.viewState, grid: gridStoringState };
  }

  onTableAction(value: Actions, account: AccountEntity) {
    switch (value) {
      case Actions.EDIT:
        this.editAccount(account);
        break;

      case Actions.DELETE:
        this.deleteAccount(account);
        break;
    }
  }

  get selectedFiltersCount() {
    let filtersCount = 0;

    Object.keys(this.viewState.filters).forEach(key => {
      if (!ObjectUtil.isDeepEquals(this.viewState.filters[key], this.defaultState.filters[key])) {
        filtersCount++;
      }
    });

    if (this.viewState.showInactive !== this.defaultState.showInactive) {
      filtersCount++;
    }

    if (this.accountsGrid?.searchPanel?.text) {
      filtersCount++;
    }

    return filtersCount;
  }

  onFilterReset() {
    this.accountsGrid.instance.clearFilter();
    this.bookmarkComp.resetToDefault();
  }

  /*
   * private helpers
   * */

  private setPermissions(): void {
    const accountPermissions =
      Environment.getCurrentUser().normalizedAccessControlRoles?.ACCOUNT?.accountSection?.sectionGroup;
    this.permissions.canRead = accountPermissions?.read.value === AccessControlScope.Company;
    this.permissions.canCreate = accountPermissions?.create.value === AccessControlScope.Company;
    this.permissions.canUpdate = accountPermissions?.update.value === AccessControlScope.Company;
    this.permissions.canDelete = accountPermissions?.delete.value === AccessControlScope.Company;
  }

  private loadAccounts(): void {
    this.accountsService
      .getAccounts(this.limit, this.offset, this.viewState.filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe(accounts => {
        this.allLoaded = accounts.length < this.limit;
        this.offset += this.limit;
        this.accountsList.push(...accounts);
        this.setLatestFilters();
      });
  }

  private initViewState() {
    this.viewState = this.bookmarkService.getSessionState(this.viewKey, new ViewState(), this.defaultState);
  }

  private setLatestFilters(): void {
    this.latestFilters.naturalBalance = this.viewState.filters.naturalBalance;
    this.latestFilters.type = this.viewState.filters.type;
  }
  public isFiltersChanged(): boolean {
    return !(
      this.viewState.filters.naturalBalance === this.latestFilters.naturalBalance &&
      this.viewState.filters.type === this.latestFilters.type
    );
  }

  private initTableActions() {
    this.actions = [
      {
        label: 'Edit',
        icon: 'edit',
        value: Actions.EDIT,
        isHidden: !this.permissions.canUpdate
      },
      {
        label: 'Delete',
        icon: 'delete',
        color: 'warn',
        value: Actions.DELETE,
        prompt: {
          title: 'Confirm please!',
          text: 'Are you sure you want to delete the Account?'
        },
        isHidden: !this.permissions.canDelete
      }
    ];
  }
}
