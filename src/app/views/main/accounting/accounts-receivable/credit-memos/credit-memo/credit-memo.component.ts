import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ARCreditMemo, ARSalesOrder } from '@services/app-layer/entities/accounts-receivable';
import { NotificationHelperService } from '@services/helpers/notification-helper/notification-helper.service';
import { EMPTY, forkJoin, of, Subject } from 'rxjs';
import { catchError, concatMap, finalize, first, map, takeUntil, tap } from 'rxjs/operators';
import { CrmAccountEntity } from '@services/app-layer/entities/crm';
import { CreditMemosService } from '@views/main/accounting/accounts-receivable/credit-memos/credit-memos.service';
import { CrmService } from '@services/app-layer/crm/crm.service';
import { CreditMemosApiService } from '@services/app-layer/credit-memos/credit-memos-api.services';
import { LogEntriesModalComponent } from '@views/main/common/modals/log-entries-modal/log-entries-modal.component';
import { MatDialog } from '@angular/material/dialog';
import { MemberEntity } from '@services/app-layer/entities/member';
import { CompaniesService } from '@services/app-layer/companies/companies.service';
import { SalesOrdersApiService } from '@services/app-layer/sales-orders/sales-orders-api.service';
import { ARCreditMemoStateEnum } from '@services/app-layer/app-layer.enums';
import { ARCreditMemosFilters } from '@views/main/accounting/accounts-receivable/credit-memos/components/credit-memos-filters/credit-memos-filters.component';
import { AccountEntity } from '@services/app-layer/entities/account';
import { AccountsService } from '@services/app-layer/accounts/accounts.service';

enum PageStatesEnum {
  VIEW,
  ADD,
  EDIT,
  APPLY
}

@Component({
  selector: 'app-credit-memo',
  styleUrls: ['./credit-memo.component.scss'],
  templateUrl: 'credit-memo.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreditMemoComponent implements OnInit, OnDestroy {
  creditMemo: ARCreditMemo = null;
  state: PageStatesEnum = null;
  isLoaded = false;
  private offset = 0;
  private limit = 1000;

  crmAccountsList: CrmAccountEntity[] = [];
  members: MemberEntity[] = [];
  salesOrders: ARSalesOrder[] = [];
  accounts: AccountEntity[] = [];

  creditMemosToApply: ARCreditMemo[] = [];
  salesOrder: ARSalesOrder = null;

  permissions = { canRead: false, canCreate: false, canUpdate: false, canDelete: false, canApply: false };

  private destroy$ = new Subject<void>();

  constructor(
    private creditMemosService: CreditMemosService,
    private router: Router,
    private route: ActivatedRoute,
    private notificationHelperService: NotificationHelperService,
    private cd: ChangeDetectorRef,
    private crmService: CrmService,
    private creditMemosApiService: CreditMemosApiService,
    private dialog: MatDialog,
    private companiesService: CompaniesService,
    private salesOrdersApiService: SalesOrdersApiService,
    private accountsService: AccountsService
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
    const isApply = this.route.snapshot.url[0]?.path === 'apply';
    const isEdit = this.route.snapshot.queryParamMap.get('editCreditMemo') === 'true';

    if (isAdd && this.permissions.canCreate) {
      this.state = PageStatesEnum.ADD;
    } else if (isApply && this.permissions.canApply) {
      this.state = PageStatesEnum.APPLY;
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

  get isApplyState() {
    return this.state === PageStatesEnum.APPLY;
  }

  get title() {
    if (this.isViewState) {
      return 'View Credit Memo';
    }

    if (this.isAddState) {
      return 'Add Credit Memo';
    }

    if (this.isEditState) {
      return 'Edit Credit Memo';
    }

    if (this.isApplyState) {
      return 'Apply Credit Memo';
    }
  }

  get isFromCRM() {
    return this.route.snapshot.queryParamMap.get('isFromCRM') === 'true';
  }

  onClose() {
    if (this.isFromCRM) {
      this.router.navigate(['/crm'], { relativeTo: this.route });
    } else {
      this.router.navigate(['/accounting/credit-memos'], { relativeTo: this.route });
    }
  }

  private setPermissions(): void {
    this.permissions = this.creditMemosService.getPermissions();
  }

  private getItemData() {
    const entryId = this.route.snapshot.paramMap.get('id');

    if (!entryId) {
      return of(null);
    }

    return this.creditMemosApiService.getCreditMemo(entryId).pipe(
      concatMap((creditMemo: ARCreditMemo) => {
        this.creditMemo = creditMemo;
        if (this.isEditState) {
          const customerData = creditMemo.customer as CrmAccountEntity;
          return this.loadCustomerSalesOrders(customerData.id);
        }
        return of(creditMemo);
      }),
      catchError(this.handleLoadDataError)
    );
  }

  private loadCustomerSalesOrders(customerId: string) {
    return this.salesOrdersApiService.getSalesOrders(this.limit, this.offset, { customer: customerId }).pipe(
      first(),
      map((salesOrders: ARSalesOrder[]) => {
        this.salesOrders = salesOrders;
      })
    );
  }

  private loadCRMAccounts() {
    return this.crmService.getAccounts(true).pipe(
      tap((crmAccounts: CrmAccountEntity[]) => {
        this.crmAccountsList = crmAccounts;
      })
    );
  }

  private loadMembers() {
    if (this.isAddState) {
      return of(null);
    }

    return this.companiesService.getCompanyCompleteMembers().pipe(
      map(items => items.filter(m => m.firstName)),
      tap((members: MemberEntity[]) => {
        this.members = members;
      })
    );
  }

  private loadInvoiceSalesOrder() {
    const invoiceId = this.route.snapshot.queryParamMap.get('invoiceId');

    if (!invoiceId) {
      return of(null);
    }

    return this.salesOrdersApiService.getSalesOrders(this.limit, this.offset, { invoiceIds: [invoiceId] }).pipe(
      concatMap((result: ARSalesOrder[]) => {
        this.salesOrder = result[0];
        return this.loadCustomerCreditMemos(this.salesOrder.customer.company);
      }),
      catchError(this.handleLoadDataError)
    );
  }

  private loadCustomerCreditMemos(customerId: string) {
    const filters: ARCreditMemosFilters = {
      customers: [customerId],
      state: [ARCreditMemoStateEnum.CREDITED, ARCreditMemoStateEnum.PARTIAL_APPLIED]
    };
    return this.creditMemosApiService.getCreditMemos(this.limit, this.offset, filters).pipe(
      tap((creditMemos: ARCreditMemo[]) => {
        this.creditMemosToApply = creditMemos;
      })
    );
  }

  private loadAccounts() {
    if (this.isAddState || this.isEditState || this.isViewState) {
      return this.accountsService.getAccounts(this.limit, this.offset).pipe(
        tap((accounts: AccountEntity[]) => {
          this.accounts = accounts;
        })
      );
    }
    return of(null);
  }

  private loadData() {
    return forkJoin([
      this.getItemData(),
      this.loadCRMAccounts(),
      this.loadMembers(),
      this.loadInvoiceSalesOrder(),
      this.loadAccounts()
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

  private handleLoadDataError = ({ error }) => {
    this.notificationHelperService.showValidation(error.message);
    this.router.navigate(['../'], { relativeTo: this.route });
    return EMPTY;
  };

  onEdit() {
    const customerData = this.creditMemo.customer as CrmAccountEntity;
    this.loadCustomerSalesOrders(customerData.id)
      .pipe(
        catchError(this.handleLoadDataError),
        finalize(() => this.cd.markForCheck()),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.state = PageStatesEnum.EDIT;
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: { editCreditMemo: true }
        });
      });
  }

  onOpenLog() {
    this.dialog
      .open(LogEntriesModalComponent, {
        disableClose: true,
        width: '800px',
        data: {
          logs: this.creditMemo.log,
          members: this.members,
          name: 'Credit'
        }
      })
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }

  onResult(creditMemoId: string) {
    this.isLoaded = false;
    this.router
      .navigate(['/accounting/credit-memos', creditMemoId], {
        relativeTo: this.route,
        queryParams: { isFromCRM: this.isFromCRM }
      })
      .then(() => {
        this.initState();
        this.loadData();
      });
  }
}
