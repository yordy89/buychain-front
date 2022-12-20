import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { APBill, APPurchaseOrder } from '@services/app-layer/entities/accounts-payable';
import { NotificationHelperService } from '@services/helpers/notification-helper/notification-helper.service';
import { LogEntriesModalComponent } from '@views/main/common/modals/log-entries-modal/log-entries-modal.component';
import { EMPTY, forkJoin, of, Subject } from 'rxjs';
import { catchError, finalize, first, takeUntil, tap } from 'rxjs/operators';
import { BillsService } from '@views/main/accounting/accounts-payable/bills/bills.service';
import { AccountEntity } from '@services/app-layer/entities/account';
import { CompanyDetails } from '@services/data-layer/http-api/base-api/swagger-gen';
import { Environment } from '@services/app-layer/app-layer.environment';
import { CrmAccountEntity, CrmLocationEntity } from '@services/app-layer/entities/crm';
import { MemberEntity } from '@services/app-layer/entities/member';
import { PurchaseOrdersApiService } from '@services/app-layer/purchase-orders/purchase-orders-api.service';
import { GroupEntity } from '@services/app-layer/entities/group';
import { CrmService } from '@services/app-layer/crm/crm.service';
import { ViewBillComponent } from '@views/main/accounting/accounts-payable/bills/components/view-bill/view-bill.component';
import { MilestoneEntity } from '@services/app-layer/entities/transaction';
import { BillsApiService } from '@services/app-layer/bills/bills-api.services';

enum PageStatesEnum {
  VIEW,
  ADD,
  EDIT
}

@Component({
  selector: 'app-bill',
  styleUrls: ['./bill.component.scss'],
  templateUrl: 'bill.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BillComponent implements OnInit, OnDestroy {
  @ViewChild(ViewBillComponent) viewBillComponent: ViewBillComponent;

  bill: APBill = null;
  state: PageStatesEnum = null;
  isLoaded = false;
  groups: GroupEntity[] = [];

  accounts: AccountEntity[] = [];
  purchaseOrder: APPurchaseOrder;
  company: CompanyDetails = Environment.getCurrentCompany();
  billToLocation: CrmLocationEntity;
  shipToLocation: CrmLocationEntity;
  crmAccountsList: CrmAccountEntity[] = [];
  members: MemberEntity[] = [];
  milestones: MilestoneEntity[] = [];

  permissions = { canRead: false, canCreate: false, canUpdate: false, canDelete: false };

  private destroy$ = new Subject<void>();

  constructor(
    private billsService: BillsService,
    private billsApiService: BillsApiService,
    private purchaseOrdersApiService: PurchaseOrdersApiService,
    private router: Router,
    private route: ActivatedRoute,
    private notificationHelperService: NotificationHelperService,
    private cd: ChangeDetectorRef,
    private dialog: MatDialog,
    private crmService: CrmService
  ) {}

  ngOnInit() {
    this.setPermissions();

    if (this.permissions.canRead) {
      this.initState();
      this.loadData();
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initState() {
    const isAdd = this.route.snapshot.url[0]?.path === 'add';
    const isEdit = this.route.snapshot.queryParamMap.get('editBill') === 'true';

    if (isAdd && this.permissions.canCreate) {
      this.state = PageStatesEnum.ADD;
    } else if (isEdit && this.permissions.canUpdate) {
      this.state = PageStatesEnum.EDIT;
    } else {
      this.state = PageStatesEnum.VIEW;
    }
  }

  get isAddState() {
    return this.state === PageStatesEnum.ADD;
  }

  get isEditState() {
    return this.state === PageStatesEnum.EDIT;
  }

  get isViewState() {
    return this.state === PageStatesEnum.VIEW;
  }

  get title() {
    if (this.isViewState) {
      return 'View Vendor Invoice';
    }

    if (this.isAddState) {
      return 'Add Vendor Invoice';
    }

    if (this.isEditState) {
      return 'Edit Vendor Invoice';
    }
  }

  get isFromPurchaseOrder() {
    return this.router.url.includes('purchase-orders');
  }

  get isAssigningLineItem() {
    return !!this.route.snapshot.queryParamMap.get('lineItemId');
  }

  private navigateToPO() {
    if (this.isAssigningLineItem) {
      this.router.navigate(['/accounting/purchase-orders'], { relativeTo: this.route });
    } else {
      const isEditPurchaseOrder = this.route.snapshot.queryParamMap.get('editPurchaseOrder') === 'true';
      const purchaseOrderId = this.route.snapshot.paramMap.get('id');
      this.router.navigate(['/accounting/purchase-orders', purchaseOrderId], {
        relativeTo: this.route,
        queryParams: {
          editPurchaseOrder: isEditPurchaseOrder
        }
      });
    }
  }

  onClose() {
    if (this.isFromPurchaseOrder) {
      this.navigateToPO();
    } else {
      this.router.navigate(['/accounting/bills'], { relativeTo: this.route });
    }
  }

  onOpenLog() {
    this.dialog
      .open(LogEntriesModalComponent, {
        disableClose: true,
        width: '800px',
        data: {
          logs: this.bill.log,
          members: this.members,
          name: 'Vendor Invoice'
        }
      })
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }

  private setPermissions(): void {
    this.permissions = this.billsService.getBillPermissions();
  }

  private loadData() {
    if (this.isAddState) {
      return this.loadAddStateData();
    }

    return this.loadViewEditStateData();
  }

  private loadViewEditStateData() {
    return forkJoin([
      this.getItemData(),
      this.loadAccounts(),
      this.loadMembers(),
      this.loadCRMAccounts(),
      this.loadGroups(),
      this.loadMilestones()
    ])
      .pipe(
        catchError(this.handleLoadDataError),
        finalize(() => this.cd.markForCheck()),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.isLoaded = true;
      });
  }

  private loadAddStateData() {
    return forkJoin([this.loadAccounts(), this.loadPurchaseOrder(), this.loadGroups()])
      .pipe(
        catchError(this.handleLoadDataError),
        finalize(() => this.cd.markForCheck()),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.isLoaded = true;
      });
  }

  private handleLoadDataError = ({ error }) => {
    this.notificationHelperService.showValidation(error.message);
    this.router.navigate(['../'], { relativeTo: this.route });
    return EMPTY;
  };

  private getItemData() {
    const billId = this.isFromPurchaseOrder
      ? this.route.snapshot.paramMap.get('billId')
      : this.route.snapshot.paramMap.get('id');

    if (!billId) {
      return of(null);
    }

    return this.billsService.getBillFromPurchaseOrder(billId).pipe(
      tap(data => {
        this.bill = data.bill;
        this.purchaseOrder = data.purchaseOrder;
      })
    );
  }

  private loadAccounts() {
    return this.billsService.getAccounts().pipe(
      tap((accounts: AccountEntity[]) => {
        this.accounts = accounts;
      })
    );
  }

  private loadPurchaseOrder() {
    const purchaseOrderId = this.route.snapshot.paramMap.get('id');

    return this.purchaseOrdersApiService.getPurchaseOrder(purchaseOrderId).pipe(
      tap((purchaseOrder: APPurchaseOrder) => {
        this.purchaseOrder = purchaseOrder;
      })
    );
  }

  private loadMembers() {
    return this.billsService.getMembers().pipe(
      first(),
      tap(members => {
        this.members = members;
      })
    );
  }

  private loadCRMAccounts() {
    return this.crmService.getAccounts(true).pipe(
      first(),
      tap(crmAccounts => {
        this.crmAccountsList = crmAccounts.filter(
          crmAccount => crmAccount.id === this.purchaseOrder?.vendor?.company || !crmAccount.archived
        );
      })
    );
  }

  private loadGroups() {
    return this.billsService.getCompanyGroups().pipe(
      first(),
      tap(groups => {
        this.groups = groups;
      })
    );
  }

  private loadMilestones() {
    const billId = this.isFromPurchaseOrder
      ? this.route.snapshot.paramMap.get('billId')
      : this.route.snapshot.paramMap.get('id');
    return this.billsApiService.getBillMilestones(billId).pipe(
      first(),
      tap(milestones => {
        this.milestones = milestones;
      })
    );
  }

  onEdit() {
    this.state = PageStatesEnum.EDIT;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { editBill: true }
    });
  }

  onResult(billId: string) {
    if (this.isFromPurchaseOrder) {
      this.navigateToPO();
    } else {
      this.isLoaded = false;
      this.router.navigate(['/accounting/bills', billId], { relativeTo: this.route }).then(() => {
        this.initState();
        this.loadData();
      });
    }
  }

  generateViewBillPDF() {
    this.viewBillComponent.generateViewBillPDF();
  }
}
