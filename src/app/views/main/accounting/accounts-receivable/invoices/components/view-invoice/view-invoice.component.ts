import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, Input, LOCALE_ID, OnInit } from '@angular/core';
import { ARInvoice, ARSalesOrder } from '@services/app-layer/entities/accounts-receivable';
import { ActivatedRoute, Router } from '@angular/router';
import { InvoicesService } from '@views/main/accounting/accounts-receivable/invoices/invoices.service';
import { CrmLocationEntity } from '@services/app-layer/entities/crm';
import { formatCurrency } from '@angular/common';
import { MemberEntity } from '@services/app-layer/entities/member';
import { SpinnerHelperService } from '@services/helpers/spinner-helper/spinner-helper.service';
import { AccountingPrintService } from '@services/app-layer/accounting-print/accounting-print.service';
import { MilestoneEntity } from '@services/app-layer/entities/transaction';

@Component({
  selector: 'app-view-invoice',
  templateUrl: 'view-invoice.component.html',
  styleUrls: ['./view-invoice.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ViewInvoiceComponent implements OnInit {
  @Input() data: ARInvoice;
  @Input() salesOrder: ARSalesOrder;
  @Input() billToLocation: CrmLocationEntity;
  @Input() shipToLocation: CrmLocationEntity;
  @Input() members: MemberEntity[];
  @Input() milestones: MilestoneEntity[];

  permissions = { canRead: false, canCreate: false, canUpdate: false, canDelete: false };
  attachments = [];
  paymentsTabTitle = 'Payments - $0.00';
  printing = false;

  constructor(
    private cd: ChangeDetectorRef,
    private router: Router,
    private route: ActivatedRoute,
    private invoicesService: InvoicesService,
    @Inject(LOCALE_ID) private localeId: string,
    private spinnerService: SpinnerHelperService,
    private printService: AccountingPrintService
  ) {}

  ngOnInit(): void {
    this.setPaymentTabTitle();
    this.permissions = this.invoicesService.getInvoicePermissions();
  }

  private setPaymentTabTitle() {
    this.paymentsTabTitle = `Payments - ${formatCurrency(this.data.paymentAmountSum, this.localeId, '$')}`;
  }

  formatAmountCurrency = e => formatCurrency(e.value, this.localeId, '$');

  onPaymentsUpdated() {
    this.setPaymentTabTitle();
  }

  generateViewInvoicePDF() {
    this.spinnerService.setStatus(true);
    const body = document.querySelector('body');
    body.classList.add('print');
    const elementId = 'view-invoice';
    const filename = `invoice_${this.data.number}.pdf`;
    this.printing = true;
    this.cd.markForCheck();
    this.printService.generatePDF(elementId, filename).then(pdf => {
      this.printing = false;
      this.cd.markForCheck();
      pdf.save(filename);
      body.classList.remove('print');
      this.spinnerService.setStatus(false);
    });
  }
}
