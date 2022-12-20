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
import { ARLineItem, ARSalesOrder } from '@services/app-layer/entities/accounts-receivable';
import { SalesOrdersService } from '@views/main/accounting/accounts-receivable/sales-orders/sales-orders.service';
import { Subject } from 'rxjs';
import { ARSalesOrderStateEnum } from '@services/app-layer/app-layer.enums';
import { takeUntil } from 'rxjs/operators';

enum Actions {
  EDIT,
  DELETE
}

@Component({
  selector: 'app-sales-order-line-items-grid',
  templateUrl: 'sales-order-line-items-grid.component.html',
  styleUrls: ['./sales-order-line-items-grid.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SalesOrderLineItemsGridComponent implements OnInit, OnDestroy {
  @Input() salesOrder: ARSalesOrder;

  @Output() lineItemDeletedEvent = new EventEmitter();

  lineItems: ARLineItem[] = [];
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
    private salesOrdersService: SalesOrdersService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.lineItems = this.salesOrder.allLines;
    this.initTableActions();
    this.permissions = this.salesOrdersService.getOpenLineItemPermissions();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getInvoiceUrl(id: string) {
    return `${location.origin}/accounting/invoices/${id}`;
  }

  formatAmountCurrency = e => formatCurrency(e.value, this.localeId, '$');

  onAction(value: Actions, item: ARLineItem) {
    switch (value) {
      case Actions.EDIT:
        this.onEditLineItem(item);
        break;
      case Actions.DELETE:
        this.onDeleteLineItem(item);
        break;
    }
  }

  get isEditSalesOrder() {
    return this.route.snapshot.queryParamMap.get('editSalesOrder') === 'true';
  }

  onEditLineItem(entry: ARLineItem) {
    this.router.navigate(['line/', entry.id], {
      relativeTo: this.route,
      queryParams: {
        editLineItem: true,
        invoiceId: entry?.invoice?.id,
        editSalesOrder: this.isEditSalesOrder
      }
    });
  }

  onDeleteLineItem(entry: ARLineItem) {
    this.salesOrdersService
      .deleteLineItem(this.salesOrder.id, entry.id, entry?.invoice?.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
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
        editSalesOrder: this.isEditSalesOrder
      }
    });
  }

  get canAddNewLineItem() {
    return this.permissions.canCreateOpenLineItem && this.salesOrder.state === ARSalesOrderStateEnum.OPEN;
  }

  invoiceIsDraft(item: ARLineItem) {
    return item?.invoice ? item.invoice.isDraft : true;
  }

  private initTableActions() {
    this.actions = [
      {
        label: 'Edit',
        icon: 'edit',
        value: Actions.EDIT,
        isHidden: (action, item: ARLineItem) => !(this.permissions.canUpdateOpenLineItem && this.invoiceIsDraft(item))
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
        isHidden: (action, item: ARLineItem) => !(this.permissions.canDeleteOpenLineItem && this.invoiceIsDraft(item))
      }
    ];
  }
}
