import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { APPurchaseOrder } from '@services/app-layer/entities/accounts-payable';
import { CrmAccountCreditInfoEntity, CrmAccountEntity } from '@services/app-layer/entities/crm';
import { DimensionEntity } from '@services/app-layer/entities/dimension';
import { GroupEntity } from '@services/app-layer/entities/group';
import { MemberEntity } from '@services/app-layer/entities/member';
import { TransactionEntity } from '@services/app-layer/entities/transaction';
import { NotificationHelperService } from '@services/helpers/notification-helper/notification-helper.service';
import { PurchaseOrdersService } from '@views/main/accounting/accounts-payable/purchase-orders/purchase-orders.service';
import { LogEntriesModalComponent } from '@views/main/common/modals/log-entries-modal/log-entries-modal.component';
import { EMPTY, forkJoin, of, Subject } from 'rxjs';
import { catchError, concatMap, finalize, takeUntil, tap } from 'rxjs/operators';
import { PurchaseOrdersApiService } from '@services/app-layer/purchase-orders/purchase-orders-api.service';
import { FacilityEntity } from '@services/app-layer/entities/facility';

enum PageStatesEnum {
  VIEW,
  ADD,
  EDIT
}

@Component({
  selector: 'app-purchase-order',
  styleUrls: ['./purchase-order.component.scss'],
  templateUrl: 'purchase-order.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PurchaseOrderComponent implements OnInit, OnDestroy {
  purchaseOrder: APPurchaseOrder = null;
  crmAccountsList: CrmAccountEntity[] = [];
  facilities: FacilityEntity[] = [];
  groupsList: GroupEntity[] = [];
  dimensionsList: DimensionEntity[] = [];
  members: MemberEntity[] = [];
  transaction: TransactionEntity;
  creditTerms: string;
  state: PageStatesEnum = null;
  isLoaded = false;

  permissions = { canRead: false, canCreate: false, canUpdate: false, canDelete: false };

  private destroy$ = new Subject<void>();

  constructor(
    private purchaseOrdersService: PurchaseOrdersService,
    private purchaseOrdersApiService: PurchaseOrdersApiService,
    private router: Router,
    private route: ActivatedRoute,
    private notificationHelperService: NotificationHelperService,
    private cd: ChangeDetectorRef,
    private dialog: MatDialog
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
    const id = this.route.snapshot.paramMap.has('id');
    const isEdit = this.route.snapshot.queryParamMap.get('editPurchaseOrder') === 'true';

    if (!id && this.permissions.canCreate) {
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
    if (this.isEditState) {
      return 'Edit Purchase Order';
    }

    if (this.isViewState) {
      return 'View Purchase Order';
    }

    if (this.isAddState) {
      return 'Add Purchase Order';
    }
  }

  navigateToGridView() {
    this.router.navigate(['/accounting/purchase-orders'], { relativeTo: this.route });
  }

  onEdit() {
    this.state = PageStatesEnum.EDIT;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { editPurchaseOrder: true }
    });
  }

  onOpenLog() {
    this.dialog
      .open(LogEntriesModalComponent, {
        disableClose: true,
        width: '800px',
        data: {
          logs: this.purchaseOrder.log,
          members: this.members,
          name: 'Purchase Order'
        }
      })
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }

  private setPermissions(): void {
    this.permissions = this.purchaseOrdersService.getPurchaseOrderPermissions();
  }

  loadData() {
    this.getItemData()
      .pipe(
        concatMap(entry => {
          this.purchaseOrder = entry;
          return this.getData();
        }),
        finalize(() => this.cd.markForCheck()),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.isLoaded = true;
      });
  }

  private getItemData() {
    const entryId = this.route.snapshot.paramMap.get('id');

    if (!entryId) {
      return of(null);
    }

    return this.purchaseOrdersApiService.getPurchaseOrder(entryId).pipe(
      catchError(({ error }) => {
        this.notificationHelperService.showValidation(error.message);
        this.router.navigate(['../'], { relativeTo: this.route });
        return EMPTY;
      })
    );
  }

  private getData() {
    return forkJoin([
      ...this.purchaseOrdersService.getDataRequestsArray(),
      this.loadTransaction(),
      this.loadCrmCreditInfo(),
      this.purchaseOrdersService.getFacilities()
    ]).pipe(
      tap(
        ([dimensions, groups, crmAccounts, members, transaction, creditInfo, facilities]: [
          DimensionEntity[],
          GroupEntity[],
          CrmAccountEntity[],
          MemberEntity[],
          TransactionEntity,
          CrmAccountCreditInfoEntity,
          FacilityEntity[]
        ]) => {
          this.dimensionsList = dimensions;
          this.groupsList = groups;
          this.crmAccountsList = crmAccounts.filter(
            crmAccount => crmAccount.id === this.purchaseOrder?.vendor?.company || !crmAccount.archived
          );
          this.members = members;
          this.transaction = transaction;
          this.creditTerms = creditInfo?.creditTerms;
          this.facilities = facilities;
        }
      )
    );
  }

  private loadCrmCreditInfo() {
    if (this.isViewState) {
      return this.purchaseOrdersService.getCrmCreditInfo(this.purchaseOrder.vendor.company);
    }

    return of(null);
  }

  private loadTransaction() {
    if (this.isAddState) {
      return of(null);
    }

    return this.purchaseOrdersService.getTransactionById(this.purchaseOrder.transaction).pipe(
      catchError(() => {
        this.navigateToGridView();
        return EMPTY;
      })
    );
  }

  onResult(purchaseOrderId: string) {
    this.isLoaded = false;
    this.router.navigate(['/accounting/purchase-orders', purchaseOrderId], { relativeTo: this.route }).then(() => {
      this.initState();
      this.loadData();
    });
  }
}
