import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AccountEntity } from '@services/app-layer/entities/account';
import { APBill, APLineItem } from '@services/app-layer/entities/accounts-payable';
import { EMPTY, forkJoin, of, Subject } from 'rxjs';
import { catchError, finalize, takeUntil, tap } from 'rxjs/operators';
import { NotificationHelperService } from '@services/helpers/notification-helper/notification-helper.service';
import { BillsService } from '@views/main/accounting/accounts-payable/bills/bills.service';
import { BillsApiService } from '@services/app-layer/bills/bills-api.services';

enum PageStatesEnum {
  ADD,
  EDIT
}

@Component({
  selector: 'app-bill-line',
  templateUrl: 'bill-line.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BillLineComponent implements OnInit, OnDestroy {
  permissions = {
    canCreateLineItem: false,
    canUpdateLineItem: false,
    canDeleteLineItem: false
  };
  data: APLineItem;
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
    const lineId = this.route.snapshot.paramMap.has('lineId');
    const isEdit = this.route.snapshot.queryParamMap.get('editLineItem') === 'true';

    if (!lineId && this.permissions.canCreateLineItem) {
      this.state = PageStatesEnum.ADD;
    } else if (isEdit && this.permissions.canUpdateLineItem) {
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
      return 'Edit Line Item';
    }

    if (this.isAddState) {
      return 'Add Line Item';
    }
  }

  get billId() {
    const isFromPurchaseOrder = this.router.url.includes('purchase-orders');
    const paramName = isFromPurchaseOrder ? 'billId' : 'id';
    return this.route.snapshot.paramMap.get(paramName);
  }

  private loadData() {
    forkJoin([this.getItemData(), this.billsService.getAccounts(), this.billsApiService.getBill(this.billId)])
      .pipe(
        tap(([lineItem, accounts, bill]: [APLineItem, AccountEntity[], APBill]) => {
          this.data = lineItem;
          this.accounts = accounts;
          this.bill = bill;
        }),
        catchError(({ error }) => {
          this.notificationHelperService.showValidation(error.message);
          this.router.navigate(['../'], { relativeTo: this.route });
          return EMPTY;
        }),
        finalize(() => this.cd.markForCheck()),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.isLoaded = true;
      });
  }

  private getItemData() {
    const lineId = this.route.snapshot.paramMap.get('lineId');
    if (!this.billId || !lineId) {
      return of(null);
    }

    return this.billsApiService.getBillLineItem(this.billId, lineId);
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
    this.permissions = this.billsService.getLineItemPermissions();
  }
}
