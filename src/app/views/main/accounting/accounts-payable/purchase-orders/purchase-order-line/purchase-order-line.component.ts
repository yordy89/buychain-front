import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AccountsService } from '@services/app-layer/accounts/accounts.service';
import { AccountEntity } from '@services/app-layer/entities/account';
import { APLineItem } from '@services/app-layer/entities/accounts-payable';
import { PurchaseOrdersService } from '@views/main/accounting/accounts-payable/purchase-orders/purchase-orders.service';
import { EMPTY, mergeMap, of, Subject } from 'rxjs';
import { catchError, finalize, takeUntil, tap } from 'rxjs/operators';
import { PurchaseOrdersApiService } from '@services/app-layer/purchase-orders/purchase-orders-api.service';
import { NotificationHelperService } from '@services/helpers/notification-helper/notification-helper.service';

enum PageStatesEnum {
  ADD,
  EDIT
}

@Component({
  selector: 'app-purchase-order-line',
  templateUrl: 'purchase-order-line.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PurchaseOrderLineComponent implements OnInit, OnDestroy {
  permissions = {
    canCreateOpenLineItem: false,
    canUpdateOpenLineItem: false
  };
  data: APLineItem;
  accounts: AccountEntity[] = [];

  state: PageStatesEnum = null;
  isLoaded = false;
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private purchaseOrdersService: PurchaseOrdersService,
    private router: Router,
    private accountsService: AccountsService,
    private cd: ChangeDetectorRef,
    private purchaseOrdersApiService: PurchaseOrdersApiService,
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
    const billId = this.route.snapshot.queryParamMap.get('billId');
    const purchaseOrderId = this.route.snapshot.paramMap.get('id');
    const lineId = this.route.snapshot.paramMap.get('lineId');

    if (!purchaseOrderId || !lineId) {
      return of(null);
    }

    return this.purchaseOrdersService.getLineItem(purchaseOrderId, lineId, billId).pipe(
      tap(entry => (this.data = entry)),
      catchError(({ error }) => {
        this.notificationHelperService.showValidation(error.message);
        this.router.navigate(['../'], { relativeTo: this.route });
        return EMPTY;
      })
    );
  }

  onClose() {
    const isEditPurchaseOrder = this.route.snapshot.queryParamMap.get('editPurchaseOrder') === 'true';
    this.router.navigate(['../../'], {
      relativeTo: this.route,
      queryParams: {
        editPurchaseOrder: isEditPurchaseOrder
      }
    });
  }

  private setPermissions(): void {
    this.permissions = this.purchaseOrdersService.getOpenLineItemPermissions();
  }
}
