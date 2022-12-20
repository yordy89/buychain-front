import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { ARInvoice } from '@services/app-layer/entities/accounts-receivable';
import { CrmLocationEntity } from '@services/app-layer/entities/crm';

@Component({
  selector: 'app-invoice-pdf-template',
  templateUrl: './invoice-pdf-template.component.html',
  styleUrls: ['./invoice-pdf-template.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InvoicePdfTemplateComponent {
  @Input() invoice: ARInvoice;
  @Input() salesOrderNumber: number;
  @Input() billToLocation: CrmLocationEntity;
  @Input() shipToLocation: CrmLocationEntity;

  public currentDate = new Date();

  public spacerRowHeight() {
    return Math.max(400 - 50 * this.invoice.lineItems.length, 0);
  }
}
