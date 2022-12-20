import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { ARSalesOrder } from '@services/app-layer/entities/accounts-receivable';
import { CrmAccountCreditInfoEntity, CrmAccountEntity } from '@services/app-layer/entities/crm';
import { DimensionEntity } from '@services/app-layer/entities/dimension';
import { GroupEntity } from '@services/app-layer/entities/group';
import { MemberEntity } from '@services/app-layer/entities/member';
import { TransactionEntity } from '@services/app-layer/entities/transaction';
import { NotificationHelperService } from '@services/helpers/notification-helper/notification-helper.service';
import { SalesOrdersService } from '@views/main/accounting/accounts-receivable/sales-orders/sales-orders.service';
import { LogEntriesModalComponent } from '@views/main/common/modals/log-entries-modal/log-entries-modal.component';
import { EMPTY, forkJoin, of, Subject } from 'rxjs';
import { catchError, concatMap, finalize, takeUntil, tap } from 'rxjs/operators';

enum PageStatesEnum {
  VIEW,
  ADD,
  EDIT
}

@Component({
  selector: 'app-sales-order',
  styleUrls: ['./sales-order.component.scss'],
  templateUrl: 'sales-order.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SalesOrderComponent implements OnInit, OnDestroy {
  salesOrder: ARSalesOrder = null;
  crmAccountsList: CrmAccountEntity[] = [];
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
    private salesOrdersService: SalesOrdersService,
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
    const isEdit = this.route.snapshot.queryParamMap.get('editSalesOrder') === 'true';

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
      return 'Edit Sales Order';
    }

    if (this.isViewState) {
      return 'View Sales Order';
    }

    if (this.isAddState) {
      return 'Add Sales Order';
    }
  }

  navigateToGridView() {
    this.router.navigate(['/accounting/sales-orders'], { relativeTo: this.route });
  }

  onEdit() {
    this.state = PageStatesEnum.EDIT;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { editSalesOrder: true }
    });
  }

  onOpenLog() {
    this.dialog
      .open(LogEntriesModalComponent, {
        disableClose: true,
        width: '800px',
        data: {
          logs: this.salesOrder.log,
          members: this.members,
          name: 'Sales Order'
        }
      })
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }

  private setPermissions(): void {
    this.permissions = this.salesOrdersService.getSalesOrderPermissions();
  }

  loadData() {
    this.getItemData()
      .pipe(
        concatMap(entry => {
          this.salesOrder = entry;
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

    return this.salesOrdersService.getSalesOrder(entryId).pipe(
      catchError(({ error }) => {
        this.notificationHelperService.showValidation(error.message);
        this.router.navigate(['../'], { relativeTo: this.route });
        return EMPTY;
      })
    );
  }

  private getData() {
    return forkJoin([
      ...this.salesOrdersService.getDataRequestsArray(),
      this.loadTransaction(),
      this.loadCrmCreditInfo()
    ]).pipe(
      tap(
        ([dimensions, groups, crmAccounts, members, transaction, creditInfo]: [
          DimensionEntity[],
          GroupEntity[],
          CrmAccountEntity[],
          MemberEntity[],
          TransactionEntity,
          CrmAccountCreditInfoEntity
        ]) => {
          this.dimensionsList = dimensions;
          this.groupsList = groups;
          this.crmAccountsList = crmAccounts.filter(
            crmAccount => crmAccount.id === this.salesOrder?.customer?.company || !crmAccount.archived
          );
          this.members = members;
          this.transaction = transaction;
          this.creditTerms = creditInfo?.creditTerms;
        }
      )
    );
  }

  private loadCrmCreditInfo() {
    if (this.isViewState) {
      return this.salesOrdersService.getCrmCreditInfo(this.salesOrder.customer.company);
    }

    return of(null);
  }

  private loadTransaction() {
    if (this.isAddState) {
      return of(null);
    }

    return this.salesOrdersService.getTransactionById(this.salesOrder.transaction).pipe(
      catchError(() => {
        this.navigateToGridView();
        return EMPTY;
      })
    );
  }

  onResult(salesOrderId: string) {
    this.isLoaded = false;
    this.router.navigate(['/accounting/sales-orders', salesOrderId], { relativeTo: this.route }).then(() => {
      this.initState();
      this.loadData();
    });
  }
}
