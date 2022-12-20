import { Component, Inject, LOCALE_ID, OnDestroy, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { EMPTY, Subject } from 'rxjs';
import { NotificationHelperService } from '@services/helpers/notification-helper/notification-helper.service';
import { APLineItem } from '@services/app-layer/entities/accounts-payable';
import { formatCurrency } from '@angular/common';
import { DxDataGridComponent } from 'devextreme-angular';
import { BillsService } from '@views/main/accounting/accounts-payable/bills/bills.service';
import { catchError, takeUntil } from 'rxjs/operators';
import { BillsApiService } from '@services/app-layer/bills/bills-api.services';

@Component({
  selector: 'app-add-line-from-purchase-order-modal',
  templateUrl: 'add-line-from-purchase-order-modal.component.html'
})
export class AddLineFromPurchaseOrderModalComponent implements OnDestroy {
  @ViewChild('lineItemsGrid', { static: false }) dataGrid: DxDataGridComponent;

  private destroy$ = new Subject<void>();

  constructor(
    private notificationHelperService: NotificationHelperService,
    private dialog: MatDialog,
    private dialogRef: MatDialogRef<AddLineFromPurchaseOrderModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { purchaseOrderId: string; openLineItems: APLineItem[]; billId: string },
    @Inject(LOCALE_ID) private localeId: string,
    private billsService: BillsService,
    private billsApiService: BillsApiService
  ) {}

  public ngOnDestroy(): void {
    this.destroy$.unsubscribe();
  }

  get selectedLineItems() {
    return this.dataGrid?.instance?.getSelectedRowsData();
  }

  public close(data?: APLineItem[]): void {
    this.dialogRef.close(data);
  }

  formatAmountCurrency = e => formatCurrency(e.value, this.localeId, '$');

  public addLineItemsToBill(): void {
    const lineItemIds = this.selectedLineItems.map(lineItem => lineItem.id);

    const { purchaseOrderId, billId } = this.data;

    const payload = {
      purchaseOrderId,
      lineItemIds
    };

    this.billsApiService
      .addBillLineItemFromPurchaseOrder(billId, payload)
      .pipe(
        catchError(({ error }) => {
          this.notificationHelperService.showValidation(error.message);
          return EMPTY;
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(bill => {
        this.close(bill.billLineItems);
      });
  }
}
