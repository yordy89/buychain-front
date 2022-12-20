import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, Input, LOCALE_ID, OnInit } from '@angular/core';
import { APBill, APPurchaseOrder } from '@services/app-layer/entities/accounts-payable';
import { ActivatedRoute, Router } from '@angular/router';
import { BillsService } from '@views/main/accounting/accounts-payable/bills/bills.service';
import { CrmAccountEntity, CrmLocationEntity } from '@services/app-layer/entities/crm';
import { formatCurrency } from '@angular/common';
import { MemberEntity } from '@services/app-layer/entities/member';
import { SpinnerHelperService } from '@services/helpers/spinner-helper/spinner-helper.service';
import { AccountingPrintService } from '@services/app-layer/accounting-print/accounting-print.service';
import { MilestoneEntity } from '@services/app-layer/entities/transaction';

@Component({
  selector: 'app-view-bill',
  templateUrl: 'view-bill.component.html',
  styleUrls: ['./view-bill.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ViewBillComponent implements OnInit {
  @Input() data: APBill;
  @Input() purchaseOrder: APPurchaseOrder;
  @Input() billToLocation: CrmLocationEntity;
  @Input() shipToLocation: CrmLocationEntity;
  @Input() members: MemberEntity[];
  @Input() crmAccounts: CrmAccountEntity[] = [];
  @Input() milestones: MilestoneEntity[];

  permissions = { canRead: false, canCreate: false, canUpdate: false, canDelete: false };
  attachments = [];
  paymentsTabTitle = 'Payments - $0.00';
  printing = false;

  constructor(
    private cd: ChangeDetectorRef,
    private router: Router,
    private route: ActivatedRoute,
    private billsService: BillsService,
    @Inject(LOCALE_ID) private localeId: string,
    private spinnerService: SpinnerHelperService,
    private printService: AccountingPrintService
  ) {}

  ngOnInit(): void {
    this.setPaymentTabTitle();
    this.permissions = this.billsService.getBillPermissions();
  }

  private setPaymentTabTitle() {
    this.paymentsTabTitle = `Payments - ${formatCurrency(this.data.paymentAmountSum, this.localeId, '$')}`;
  }

  formatAmountCurrency = e => formatCurrency(e.value, this.localeId, '$');

  onPaymentsUpdated() {
    this.setPaymentTabTitle();
  }

  generateViewBillPDF() {
    this.spinnerService.setStatus(true);
    const body = document.querySelector('body');
    body.classList.add('print');
    const elementId = 'view-bill';
    const filename = 'vendor_invoice.pdf';
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
