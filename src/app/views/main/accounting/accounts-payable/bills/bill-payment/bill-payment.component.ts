import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AccountEntity } from '@services/app-layer/entities/account';
import { APBill, APBillPayment } from '@services/app-layer/entities/accounts-payable';
import { EMPTY, forkJoin, mergeMap, of, Subject } from 'rxjs';
import { catchError, finalize, takeUntil, tap } from 'rxjs/operators';
import { NotificationHelperService } from '@services/helpers/notification-helper/notification-helper.service';
import { BillsService } from '@views/main/accounting/accounts-payable/bills/bills.service';
import { BillsApiService } from '@services/app-layer/bills/bills-api.services';

enum PageStatesEnum {
  ADD,
  EDIT
}

@Component({
  selector: 'app-bill-payment',
  templateUrl: 'bill-payment.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BillPaymentComponent implements OnInit, OnDestroy {
  permissions = {
    canCreatePayment: false,
    canUpdatePayment: false,
    canDeletePayment: false
  };
  data: APBillPayment;
  accounts: AccountEntity[] = [];
  bill: APBill;

  state: PageStatesEnum = null;
  isLoaded = false;
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private billsService: BillsService,
    private billsApiService: BillsApiService,
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
    return forkJoin([this.getItemData(), this.loadBill()])
      .pipe(
        mergeMap(() => this.loadAccounts()),
        finalize(() => this.cd.markForCheck()),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.isLoaded = true;
      });
  }

  private loadBill() {
    return this.billsApiService.getBill(this.billId).pipe(tap((bill: APBill) => (this.bill = bill)));
  }

  private loadAccounts() {
    return this.billsService
      .getAccounts()
      .pipe(tap(accounts => (this.accounts = accounts.filter(account => account.id !== this.bill.APAccount))));
  }

  get billId() {
    const isFromPurchaseOrder = this.router.url.includes('purchase-orders');
    const paramName = isFromPurchaseOrder ? 'billId' : 'id';
    return this.route.snapshot.paramMap.get(paramName);
  }

  private getItemData() {
    const paymentId = this.route.snapshot.paramMap.get('paymentId');
    if (!this.billId || !paymentId) {
      return of(null);
    }

    return this.billsApiService.getBillPayment(this.billId, paymentId).pipe(
      tap(entry => (this.data = entry)),
      catchError(({ error }) => {
        this.notificationHelperService.showValidation(error.message);
        this.router.navigate(['../'], { relativeTo: this.route });
        return EMPTY;
      })
    );
  }

  onClose() {
    const isEditBill = this.route.snapshot.queryParamMap.get('editBill') === 'true';
    this.router.navigate(['../../'], {
      relativeTo: this.route,
      queryParams: {
        editBill: isEditBill
      }
    });
  }

  private setPermissions(): void {
    this.permissions = this.billsService.getPaymentPermissions();
  }
}
