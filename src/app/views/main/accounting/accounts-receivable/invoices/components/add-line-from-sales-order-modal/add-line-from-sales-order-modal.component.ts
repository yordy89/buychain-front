import { Component, Inject, LOCALE_ID, OnDestroy, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { EMPTY, Subject } from 'rxjs';
import { NotificationHelperService } from '@services/helpers/notification-helper/notification-helper.service';
import { ARLineItem } from '@services/app-layer/entities/accounts-receivable';
import { formatCurrency } from '@angular/common';
import { DxDataGridComponent } from 'devextreme-angular';
import { catchError, takeUntil } from 'rxjs/operators';
import { InvoicesApiService } from '@services/app-layer/invoices/invoices-api.services';

@Component({
  selector: 'app-add-line-from-sales-order-modal',
  templateUrl: 'add-line-from-sales-order-modal.component.html'
})
export class AddLineFromSalesOrderModalComponent implements OnDestroy {
  @ViewChild('lineItemsGrid', { static: false }) dataGrid: DxDataGridComponent;

  private destroy$ = new Subject<void>();

  constructor(
    private notificationHelperService: NotificationHelperService,
    private dialog: MatDialog,
    private dialogRef: MatDialogRef<AddLineFromSalesOrderModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { salesOrderId: string; openLineItems: ARLineItem[]; invoiceId: string },
    @Inject(LOCALE_ID) private localeId: string,
    private invoicesApiService: InvoicesApiService
  ) {}

  public ngOnDestroy(): void {
    this.destroy$.unsubscribe();
  }

  get selectedLineItems() {
    return this.dataGrid?.instance?.getSelectedRowsData();
  }

  public close(data?: ARLineItem[]): void {
    this.dialogRef.close(data);
  }

  formatAmountCurrency = e => formatCurrency(e.value, this.localeId, '$');

  public addLineItemsToInvoice(): void {
    const lineItemIds = this.selectedLineItems.map(lineItem => lineItem.id);

    const { salesOrderId, invoiceId } = this.data;

    const payload = {
      salesOrderId,
      lineItemIds
    };

    this.invoicesApiService
      .addInvoiceLineItemFromSalesOrder(invoiceId, payload)
      .pipe(
        catchError(({ error }) => {
          this.notificationHelperService.showValidation(error.message);
          return EMPTY;
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(invoice => {
        this.close(invoice.lineItems);
      });
  }
}
