import { ChangeDetectorRef, Component, Input, OnDestroy, ViewChild } from '@angular/core';
import { CrmAccountEntity } from '@services/app-layer/entities/crm';
import { CrmComponentService } from '@views/main/crm/crm/crm.component.service';
import { NotificationHelperService } from '@services/helpers/notification-helper/notification-helper.service';
import { Subject } from 'rxjs';
import { concatMap, map, takeUntil } from 'rxjs/operators';
import { ARCreditMemo } from '@services/app-layer/entities/accounts-receivable';
import { CreditMemosApiService } from '@services/app-layer/credit-memos/credit-memos-api.services';
import { InvoicesApiService } from '@services/app-layer/invoices/invoices-api.services';
import { CrmService } from '@services/app-layer/crm/crm.service';
import { TableAction } from '@app/models';
import { ARCreditMemoReviewStateEnum, ARCreditMemoStateEnum } from '@services/app-layer/app-layer.enums';
import { Badge } from '@app/constants';
import { ActivatedRoute, Router } from '@angular/router';
import { GridHelperService } from '@services/helpers/grid-helper/grid-helper.service';
import { DxDataGridComponent } from 'devextreme-angular';
import { BookmarkComponent } from '@views/main/common/bookmark/bookmark.component';

enum Actions {
  VIEW,
  VIEW_IN_NEW_TAB,
  VIEW_IN_NEW_WINDOW,
  EDIT,
  DELETE
}

@Component({
  selector: 'app-crm-account-credit-memos',
  templateUrl: './crm-account-credit-memos.component.html',
  styleUrls: ['./crm-account-credit-memos.component.scss']
})
export class CrmAccountCreditMemosComponent implements OnDestroy {
  @ViewChild('grid') grid: DxDataGridComponent;
  @ViewChild(BookmarkComponent) bookmarkComp: BookmarkComponent;

  private _crmAccountData: CrmAccountEntity;
  @Input() get crmAccountData(): CrmAccountEntity {
    return this._crmAccountData;
  }
  set crmAccountData(value: CrmAccountEntity) {
    if (!value) return;
    this._crmAccountData = value;
    this.setUserPermissions();
    if (this.crmPermissions.canRead) {
      this.loadData();
    }
  }

  creditMemosList: ARCreditMemo[] = [];
  crmAccountsList: CrmAccountEntity[] = [];
  private offset = 0;
  private limit = 1000;
  actions: TableAction[] = [];
  allLoaded = false;
  isLoaded = false;
  visibleRows = 0;

  public crmPermissions: any;

  private destroy$ = new Subject<void>();

  constructor(
    private crmComponentService: CrmComponentService,
    private notificationHelperService: NotificationHelperService,
    private creditMemosApiService: CreditMemosApiService,
    private invoicesApiService: InvoicesApiService,
    private crmService: CrmService,
    private router: Router,
    private route: ActivatedRoute,
    private cd: ChangeDetectorRef,
    private gridHelperService: GridHelperService
  ) {}

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setUserPermissions(): void {
    this.crmPermissions = {
      canRead: true,
      canUpdate: true,
      canCreate: true,
      canDelete: true
    };
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
        isHidden: (action, item: ARCreditMemo) => !(this.crmPermissions.canUpdate && item.isEditDeleteAllowed)
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
        isHidden: (action, item: ARCreditMemo) => !(this.crmPermissions.canDelete && item.isEditDeleteAllowed)
      }
    ];
  }

  loadCreditMemos() {
    const filter = { customers: [this.crmAccountData.id] };
    return this.creditMemosApiService.getCRMCreditMemos(this.limit, this.offset, filter).pipe(
      map(items => {
        this.allLoaded = items.length < this.limit;
        this.offset += this.limit;
        this.isLoaded = true;
        this.creditMemosList = this.creditMemosList.concat(items);
        this.initTableActions();
      }),
      takeUntil(this.destroy$)
    );
  }

  private loadData() {
    this.crmService
      .getAccounts(true)
      .pipe(
        concatMap(crmAccounts => {
          this.crmAccountsList = crmAccounts;
          return this.loadCreditMemos();
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.cd.markForCheck();
      });
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
    this.router.navigate(['/accounting/credit-memos', entry.id], {
      relativeTo: this.route,
      queryParams: { isFromCRM: true }
    });
  }
  viewCreditMemoInNewTab(entry: ARCreditMemo) {
    window.open(`${location.origin}/accounting/credit-memos/${entry.id}`);
  }
  viewCreditMemoInNewWindow(entry: ARCreditMemo) {
    const strWindowFeatures = 'location=yes';
    window.open(`${location.origin}/accounting/credit-memos/${entry.id}`, '_blank', strWindowFeatures);
  }

  private editCreditMemo(entry: ARCreditMemo) {
    this.router.navigate(['/accounting/credit-memos', entry.id], {
      relativeTo: this.route,
      queryParams: {
        editCreditMemo: true,
        isFromCRM: true
      }
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

  onToolbarPreparing(e) {
    this.gridHelperService.prepareToolbarPrefixTemplate(e);
    this.cd.markForCheck();
  }

  onExporting(e) {
    this.gridHelperService.exportToExcel(e, `${this._crmAccountData.name} Credit Memos`);
  }

  onAddCreditMemo() {
    this.router.navigate(['/accounting/credit-memos/add'], {
      relativeTo: this.route,
      queryParams: { customerId: this._crmAccountData.id }
    });
  }
}
