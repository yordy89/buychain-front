import { formatCurrency } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Inject,
  Input,
  LOCALE_ID,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TableAction } from '@app/models';
import { APLineItem, APPurchaseOrder } from '@services/app-layer/entities/accounts-payable';
import { PurchaseOrdersService } from '@views/main/accounting/accounts-payable/purchase-orders/purchase-orders.service';
import { Subject } from 'rxjs';
import { APPurchaseOrderStateEnum } from '@services/app-layer/app-layer.enums';
import { PurchaseOrdersApiService } from '@services/app-layer/purchase-orders/purchase-orders-api.service';

enum Actions {
  EDIT,
  DELETE
}

@Component({
  selector: 'app-purchase-order-line-items-grid',
  templateUrl: 'purchase-order-line-items-grid.component.html',
  styleUrls: ['./purchase-order-line-items-grid.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PurchaseOrderLineItemsGridComponent implements OnInit, OnDestroy {
  @Input() purchaseOrder: APPurchaseOrder;

  @Output() lineItemDeletedEvent = new EventEmitter();

  lineItems: APLineItem[] = [];
  actions: TableAction[] = [];
  permissions = {
    canCreateOpenLineItem: false,
    canUpdateOpenLineItem: false,
    canDeleteOpenLineItem: false
  };

  private destroy$ = new Subject<void>();

  constructor(
    @Inject(LOCALE_ID) private localeId: string,
    private cd: ChangeDetectorRef,
    private purchaseOrdersService: PurchaseOrdersService,
    private purchaseOrdersApiService: PurchaseOrdersApiService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.lineItems = this.purchaseOrder.allLines;
    this.initTableActions();
    this.permissions = this.purchaseOrdersService.getOpenLineItemPermissions();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getBillUrl(id: string) {
    return `${location.origin}/accounting/bills/${id}`;
  }

  formatAmountCurrency = e => formatCurrency(e.value, this.localeId, '$');

  onAction(value: Actions, item: APLineItem) {
    switch (value) {
      case Actions.EDIT:
        this.onEditLineItem(item);
        break;
      case Actions.DELETE:
        this.onDeleteLineItem(item);
        break;
    }
  }

  get isEditPurchaseOrder() {
    return this.route.snapshot.queryParamMap.get('editPurchaseOrder') === 'true';
  }

  onEditLineItem(entry: APLineItem) {
    this.router.navigate(['line/', entry.id], {
      relativeTo: this.route,
      queryParams: {
        editLineItem: true,
        billId: entry?.bill?.id,
        editPurchaseOrder: this.isEditPurchaseOrder
      }
    });
  }

  onDeleteLineItem(entry: APLineItem) {
    this.purchaseOrdersService.deleteLineItem(this.purchaseOrder.id, entry.id, entry?.bill?.id).subscribe(() => {
      const index = this.lineItems.findIndex(item => item.id === entry.id);
      if (index === -1) {
        return;
      }
      this.lineItems = this.lineItems.filter(item => item.id !== entry.id);
      this.cd.markForCheck();
      this.lineItemDeletedEvent.emit();
    });
  }

  onAddLineItem() {
    this.router.navigate(['line/add'], {
      relativeTo: this.route,
      queryParams: {
        editPurchaseOrder: this.isEditPurchaseOrder
      }
    });
  }

  get canAddNewLineItem() {
    return this.permissions.canCreateOpenLineItem && this.purchaseOrder.state === APPurchaseOrderStateEnum.OPEN;
  }

  billIsDraft(item: APLineItem) {
    return item?.bill ? item.bill.isDraft : true;
  }

  private initTableActions() {
    this.actions = [
      {
        label: 'Edit',
        icon: 'edit',
        value: Actions.EDIT,
        isHidden: (action, item: APLineItem) => !(this.permissions.canUpdateOpenLineItem && this.billIsDraft(item))
      },
      {
        label: 'Delete',
        icon: 'delete',
        color: 'warn',
        value: Actions.DELETE,
        prompt: {
          title: 'Confirm please!',
          text: 'Are you sure you want to delete Line Item?'
        },
        isHidden: (action, item: APLineItem) => !(this.permissions.canDeleteOpenLineItem && this.billIsDraft(item))
      }
    ];
  }
}
