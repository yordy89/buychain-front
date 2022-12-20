import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Inject,
  Input,
  LOCALE_ID,
  OnDestroy,
  OnInit
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TableAction } from '@app/models';
import { APBill, APBillPayment, APPurchaseOrder } from '@services/app-layer/entities/accounts-payable';
import { PurchaseOrdersService } from '@views/main/accounting/accounts-payable/purchase-orders/purchase-orders.service';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { APPurchaseOrderStateEnum } from '@services/app-layer/app-layer.enums';
import { BillsApiService } from '@services/app-layer/bills/bills-api.services';

enum Actions {
  VIEW,
  VIEW_IN_NEW_TAB,
  VIEW_IN_NEW_WINDOW,
  EDIT,
  DELETE
}

@Component({
  selector: 'app-purchase-order-bills-grid',
  templateUrl: 'purchase-order-bills-grid.component.html',
  styleUrls: ['./purchase-order-bills-grid.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PurchaseOrderBillsGridComponent implements OnInit, OnDestroy {
  @Input() purchaseOrder: APPurchaseOrder;
  @Input() onBillDeleted: (bills: APBill[]) => void;

  bills: APBill[] = [];
  actions: TableAction[] = [];
  permissions = {
    canReadBill: false,
    canCreateBill: false,
    canUpdateBill: false,
    canDeleteBill: false
  };

  private destroy$ = new Subject<void>();

  constructor(
    @Inject(LOCALE_ID) private localeId: string,
    private cd: ChangeDetectorRef,
    private purchaseOrdersService: PurchaseOrdersService,
    private billsApiService: BillsApiService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.bills = this.purchaseOrder.bills;
    this.permissions = this.purchaseOrdersService.getBillPermissions();
    this.initTableActions();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getBillUrl(id: string) {
    return `${location.origin}/accounting/bills/${id}`;
  }

  getRowData = rowData => rowData;

  get isEditPurchaseOrder() {
    return this.route.snapshot.queryParamMap.get('editPurchaseOrder') === 'true';
  }

  onAddBill() {
    this.router.navigate(['bill/add'], {
      relativeTo: this.route,
      queryParams: {
        editPurchaseOrder: this.isEditPurchaseOrder
      }
    });
  }

  private onEditBill(entry: APBill) {
    this.router.navigate(['bill/', entry.id], {
      relativeTo: this.route,
      queryParams: {
        editBill: true,
        editPurchaseOrder: this.isEditPurchaseOrder
      }
    });
  }

  private onDeleteBill(entry: APBill) {
    this.billsApiService
      .deleteBill(entry.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const index = this.bills.findIndex(item => item.id === entry.id);
        if (index === -1) {
          return;
        }
        this.bills = this.bills.filter(item => item.id !== entry.id);
        if (this.onBillDeleted) {
          this.onBillDeleted(this.bills);
        }
        this.cd.markForCheck();
      });
  }

  onBillAction(value: Actions, item: APBill) {
    switch (value) {
      case Actions.VIEW:
        this.onViewBill(item);
        break;
      case Actions.VIEW_IN_NEW_TAB:
        this.viewBillInNewTab(item);
        break;
      case Actions.VIEW_IN_NEW_WINDOW:
        this.viewBillInNewWindow(item);
        break;
      case Actions.EDIT:
        this.onEditBill(item);
        break;
      case Actions.DELETE:
        this.onDeleteBill(item);
        break;
    }
  }

  onViewBill(entry: APBill) {
    this.router.navigate(['bill', entry.id], {
      relativeTo: this.route,
      queryParams: {
        editPurchaseOrder: this.isEditPurchaseOrder
      }
    });
  }

  viewBillInNewTab(entry: APBill) {
    const { origin, pathname } = location;
    window.open(`${origin}${pathname}/bill/${entry.id}`);
  }

  viewBillInNewWindow(entry: APBill) {
    const { origin, pathname } = location;
    const strWindowFeatures = 'location=yes';
    window.open(`${origin}${pathname}/bill/${entry.id}`, '_blank', strWindowFeatures);
  }

  get canAddNewBill() {
    return this.permissions.canCreateBill && this.purchaseOrder.state === APPurchaseOrderStateEnum.OPEN;
  }

  voidNotAllowed = (action, bill: APBill) => bill.payments.some((item: APBillPayment) => !item.isVoid);

  private initTableActions() {
    this.actions = [
      {
        label: 'View',
        icon: 'visibility',
        value: Actions.VIEW,
        isHidden: () => !this.permissions.canReadBill
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
        isHidden: () => !this.permissions.canUpdateBill
      },
      {
        label: 'Delete',
        icon: 'delete',
        color: 'warn',
        value: Actions.DELETE,
        prompt: {
          title: 'Confirm please!',
          text: 'Are you sure you want to delete this Vendor Invoice?'
        },
        isHidden: (action, item: APBill) => !(this.permissions.canDeleteBill && item.isDeleteAllowed)
      }
    ];
  }
}
