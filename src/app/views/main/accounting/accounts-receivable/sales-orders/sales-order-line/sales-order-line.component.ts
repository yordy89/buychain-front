import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AccountsService } from '@services/app-layer/accounts/accounts.service';
import { AccountEntity } from '@services/app-layer/entities/account';
import { ARLineItem } from '@services/app-layer/entities/accounts-receivable';
import { SalesOrdersService } from '@views/main/accounting/accounts-receivable/sales-orders/sales-orders.service';
import { EMPTY, mergeMap, of, Subject } from 'rxjs';
import { catchError, finalize, takeUntil, tap } from 'rxjs/operators';
import { SalesOrdersApiService } from '@services/app-layer/sales-orders/sales-orders-api.service';
import { NotificationHelperService } from '@services/helpers/notification-helper/notification-helper.service';

enum PageStatesEnum {
  ADD,
  EDIT
}

@Component({
  selector: 'app-sales-order-line',
  templateUrl: 'sales-order-line.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SalesOrderLineComponent implements OnInit, OnDestroy {
  permissions = {
    canCreateOpenLineItem: false,
    canUpdateOpenLineItem: false
  };
  data: ARLineItem;
  accounts: AccountEntity[] = [];

  state: PageStatesEnum = null;
  isLoaded = false;
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private salesOrdersService: SalesOrdersService,
    private router: Router,
    private accountsService: AccountsService,
    private cd: ChangeDetectorRef,
    private salesOrdersApiService: SalesOrdersApiService,
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

    if (!lineId && this.permissions.canCreateOpenLineItem) {
      this.state = PageStatesEnum.ADD;
    } else if (isEdit && this.permissions.canUpdateOpenLineItem) {
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

  private loadData() {
    this.getItemData()
      .pipe(
        mergeMap(() => this.loadAccounts()),
        finalize(() => this.cd.markForCheck()),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.isLoaded = true;
      });
  }

  private loadAccounts() {
    return this.accountsService.getAccounts(1000, 0).pipe(tap(accounts => (this.accounts = accounts)));
  }

  private getItemData() {
    const invoiceId = this.route.snapshot.queryParamMap.get('invoiceId');
    const salesOrderId = this.route.snapshot.paramMap.get('id');
    const lineId = this.route.snapshot.paramMap.get('lineId');

    if (!salesOrderId || !lineId) {
      return of(null);
    }

    return this.salesOrdersService.getLineItem(salesOrderId, lineId, invoiceId).pipe(
      tap(entry => (this.data = entry)),
      catchError(({ error }) => {
        this.notificationHelperService.showValidation(error.message);
        this.router.navigate(['../'], { relativeTo: this.route });
        return EMPTY;
      })
    );
  }

  onClose() {
    const isEditSalesOrder = this.route.snapshot.queryParamMap.get('editSalesOrder') === 'true';
    this.router.navigate(['../../'], {
      relativeTo: this.route,
      queryParams: {
        editSalesOrder: isEditSalesOrder
      }
    });
  }

  private setPermissions(): void {
    this.permissions = this.salesOrdersService.getOpenLineItemPermissions();
  }
}
