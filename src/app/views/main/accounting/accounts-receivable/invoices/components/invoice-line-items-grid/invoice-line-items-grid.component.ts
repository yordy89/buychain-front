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
import { ARInvoice, ARLineItem, ARSalesOrder } from '@services/app-layer/entities/accounts-receivable';
import { MatDialog } from '@angular/material/dialog';
import { InvoicesService } from '@views/main/accounting/accounts-receivable/invoices/invoices.service';
import { formatCurrency } from '@angular/common';
import { TableAction } from '@app/models';
import { AddLineFromSalesOrderModalComponent } from '@views/main/accounting/accounts-receivable/invoices/components/add-line-from-sales-order-modal/add-line-from-sales-order-modal.component';
import { ARInvoiceStateEnum, ARLineItemTypeEnum } from '@services/app-layer/app-layer.enums';
import { Subject } from 'rxjs';
import { switchMap, takeUntil } from 'rxjs/operators';

enum Actions {
  EDIT,
  DELETE
}

@Component({
  selector: 'app-invoice-line-items-grid',
  templateUrl: 'invoice-line-items-grid.component.html',
  styleUrls: ['../common/invoice-grid-items.common.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InvoiceLineItemsGridComponent implements OnInit, OnDestroy {
  @Input() data: ARInvoice;
  @Input() salesOrder: ARSalesOrder;
  @Input() printing = false;

  actions: TableAction[];
  openLineItems: ARLineItem[] = [];
  permissions = {
    canCreateLineItem: false,
    canUpdateLineItem: false,
    canDeleteLineItem: false
  };

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private invoicesService: InvoicesService,
    private router: Router,
    private cd: ChangeDetectorRef,
    private dialog: MatDialog,
    @Inject(LOCALE_ID) private localeId: string
  ) {}

  ngOnInit() {
    this.permissions = this.invoicesService.getLineItemPermissions();
    this.openLineItems = this.filteredOpenLineItems;
    this.initTableActions();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  formatAmountCurrency = e => {
    const formattedValue = formatCurrency(Math.abs(e.value), this.localeId, '$');
    if (e.value < 0) {
      return `(${formattedValue})`;
    }
    return formattedValue;
  };

  private initTableActions() {
    this.actions = [
      {
        label: 'Edit',
        icon: 'edit',
        value: Actions.EDIT,
        isHidden: !(this.permissions.canUpdateLineItem && this.data.isDraft)
      },
      {
        label: 'Delete',
        icon: 'delete',
        color: 'warn',
        value: Actions.DELETE,
        prompt: {
          title: 'Confirm please!',
          text: 'Are you sure you want to delete this Line Item?'
        },
        isHidden: !(this.permissions.canDeleteLineItem && this.data.isDraft)
      }
    ];
  }

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

  onAddLineItem() {
    const isEditInvoice = this.route.snapshot.queryParamMap.get('editInvoice') === 'true';
    this.router.navigate(['line/add'], {
      relativeTo: this.route,
      queryParams: {
        editInvoice: isEditInvoice
      }
    });
  }

  get filteredOpenLineItems() {
    if (this.data.state === ARInvoiceStateEnum.ISSUED) {
      return this.salesOrder.openLineItems.filter(item => item.type === ARLineItemTypeEnum.INTERNAL_EXPENSE);
    }
    return this.salesOrder.openLineItems;
  }

  get canNotAddLineItems() {
    return !this.data.isDraft && !this.data.isIssued;
  }

  get canNotAddLineItemsFromSalesOrder() {
    return this.canNotAddLineItems || !this.openLineItems?.length;
  }

  onAddLineItemFromSalesOrder() {
    const data = {
      salesOrderId: this.salesOrder.id,
      openLineItems: this.openLineItems,
      invoiceId: this.data.id
    };

    this.dialog
      .open(AddLineFromSalesOrderModalComponent, {
        width: '848px',
        data
      })
      .afterClosed()
      .subscribe((addedLineItems: ARLineItem[]) => {
        if (addedLineItems?.length) {
          this.data.lineItems = addedLineItems;
          const isNotAddedLineItem = (lineItem: ARLineItem) =>
            addedLineItems.every(addedLineItem => addedLineItem.id !== lineItem.id);
          this.openLineItems = this.openLineItems.filter(isNotAddedLineItem);
          this.cd.markForCheck();
        }
      });
  }

  onEditLineItem(entry: ARLineItem) {
    const isEditInvoice = this.route.snapshot.queryParamMap.get('editInvoice') === 'true';
    this.router.navigate(['line/', entry.id], {
      relativeTo: this.route,
      queryParams: {
        editInvoice: isEditInvoice,
        editLineItem: true
      }
    });
  }

  onDeleteLineItem(entry: ARLineItem) {
    this.invoicesService
      .deleteInvoiceLineItem(this.data.id, entry.id)
      .pipe(
        switchMap(() => {
          return this.invoicesService.getSalesOrder(this.salesOrder.id).pipe(takeUntil(this.destroy$));
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(so => {
        const index = this.data.lineItems.findIndex(item => item.id === entry.id);

        if (index === -1) {
          return;
        }

        if (so?.openLineItems) {
          this.openLineItems = so.openLineItems;
        }

        this.data.lineItems = this.data.lineItems.filter(item => item.id !== entry.id);
        this.cd.markForCheck();
      });
  }
}
