import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AccountEntity } from '@services/app-layer/entities/account';
import { ARInvoice, ARInvoicePayment } from '@services/app-layer/entities/accounts-receivable';
import { EMPTY, forkJoin, mergeMap, Subject } from 'rxjs';
import { catchError, finalize, takeUntil, tap } from 'rxjs/operators';
import { NotificationHelperService } from '@services/helpers/notification-helper/notification-helper.service';
import { InvoicesService } from '@views/main/accounting/accounts-receivable/invoices/invoices.service';

enum PageStatesEnum {
  ADD,
  EDIT
}

@Component({
  selector: 'app-invoice-payment',
  templateUrl: 'invoice-payment.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InvoicePaymentComponent implements OnInit, OnDestroy {
  permissions = {
    canCreatePayment: false,
    canUpdatePayment: false,
    canDeletePayment: false
  };
  data: ARInvoicePayment;
  accounts: AccountEntity[] = [];
  invoice: ARInvoice;

  state: PageStatesEnum = null;
  isLoaded = false;
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private invoicesService: InvoicesService,
    private router: Router,
    private cd: ChangeDetectorRef,
    private notificationHelperService: NotificationHelperService
  ) {}

  ngOnInit() {
    this.setPermissions();
    this.initState();
    this.loadData();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initState() {
    const paymentId = this.route.snapshot.paramMap.has('paymentId');
    const isEdit = this.route.snapshot.queryParamMap.get('editPayment') === 'true';

    if (!paymentId && this.permissions.canCreatePayment) {
      this.state = PageStatesEnum.ADD;
    } else if (isEdit && this.permissions.canUpdatePayment) {
      this.state = PageStatesEnum.EDIT;
    }
  }

  get isAddState() {
    return this.state === PageStatesEnum.ADD;
  }

  get isEditState() {
    return this.state === PageStatesEnum.EDIT;
  }

  get title() {
    if (this.isEditState) {
      return 'Edit Payment';
    }

    if (this.isAddState) {
      return 'Add Payment';
    }
  }

  private loadData() {
    return forkJoin([this.getItemData(), this.loadInvoice()])
      .pipe(
        mergeMap(() => this.loadAccounts()),
        finalize(() => this.cd.markForCheck()),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.isLoaded = true;
      });
  }

  private loadInvoice() {
    return this.invoicesService.getInvoice(this.invoiceId).pipe(
      tap((invoice: ARInvoice) => {
        this.invoice = invoice;
      })
    );
  }

  private loadAccounts() {
    return this.invoicesService
      .getAccounts()
      .pipe(tap(accounts => (this.accounts = accounts.filter(account => account.id !== this.invoice?.ARAccount))));
  }

  get invoiceId() {
    const isFromSalesOrder = this.router.url.includes('sales-orders');
    const paramName = isFromSalesOrder ? 'invoiceId' : 'id';
    return this.route.snapshot.paramMap.get(paramName);
  }

  private getItemData() {
    const paymentId = this.route.snapshot.paramMap.get('paymentId');

    return this.invoicesService.getInvoicePayment(this.invoiceId, paymentId).pipe(
      tap(entry => (this.data = entry)),
      catchError(({ error }) => {
        this.notificationHelperService.showValidation(error.message);
        this.router.navigate(['../'], { relativeTo: this.route });
        return EMPTY;
      })
    );
  }

  onClose() {
    const isEditInvoice = this.route.snapshot.queryParamMap.get('editInvoice') === 'true';
    this.router.navigate(['../../'], {
      relativeTo: this.route,
      queryParams: {
        editInvoice: isEditInvoice
      }
    });
  }

  private setPermissions(): void {
    this.permissions = this.invoicesService.getPaymentPermissions();
  }
}
