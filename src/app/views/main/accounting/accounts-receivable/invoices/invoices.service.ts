import { ComponentFactoryResolver, Injectable, Injector } from '@angular/core';
import { FilterBuilderHelper } from '@services/helpers/utils/filter-builder-helper';
import { InvoicesApiService } from '@services/app-layer/invoices/invoices-api.services';
import { ARInvoicesFilters } from '@views/main/accounting/accounts-receivable/invoices/components/invoices-filters/invoices-filters.component';
import { AccountsService } from '@services/app-layer/accounts/accounts.service';
import { SalesOrdersApiService } from '@services/app-layer/sales-orders/sales-orders-api.service';
import { first, map, mergeMap, tap } from 'rxjs/operators';
import { CrmService } from '@services/app-layer/crm/crm.service';
import { ARInvoice, SalesOrderCustomerInfo } from '@services/app-layer/entities/accounts-receivable';
import { CompaniesService } from '@services/app-layer/companies/companies.service';
import { of } from 'rxjs';
import { Environment } from '@services/app-layer/app-layer.environment';
import { AccessControlScope } from '@services/app-layer/permission/permission.interface';
import { AccountingAttachmentsService } from '@services/app-layer/accounting-attachments/accounting-attachments.service';
import { CrmLocationEntity } from '@services/app-layer/entities/crm';
import { InvoicePdfTemplateComponent } from '@views/main/accounting/accounts-receivable/invoices/invoice-pdf-template/invoice-pdf-template.component';
import { SpinnerHelperService } from '@services/helpers/spinner-helper/spinner-helper.service';
import * as html2pdf from 'html2pdf.js';
import { AttachmentEntity } from '@services/app-layer/entities/transaction';
import { MilestoneService } from '@services/app-layer/milestone/milestone.service';

export interface InvoicePdfTemplateData {
  invoice: ARInvoice;
  salesOrderNumber: number;
  billToLocation: CrmLocationEntity;
  shipToLocation: CrmLocationEntity;
}

@Injectable({
  providedIn: 'root'
})
export class InvoicesService {
  constructor(
    private invoicesApiService: InvoicesApiService,
    private accountsService: AccountsService,
    private salesOrdersApiService: SalesOrdersApiService,
    private attachmentsService: AccountingAttachmentsService,
    private crmService: CrmService,
    private companiesService: CompaniesService,
    private spinnerService: SpinnerHelperService,
    private resolver: ComponentFactoryResolver,
    private injector: Injector,
    private milestoneService: MilestoneService
  ) {}

  getInvoicePermissions() {
    const normalizedRoles = Environment.getCurrentUser().normalizedAccessControlRoles;
    const accountPermissions = normalizedRoles?.ACCOUNT?.accountSection?.sectionGroup;
    const crmAccountsPermissions = normalizedRoles?.CRM_ACCOUNT?.CRMSection?.sectionGroup;
    const readInvoicePermissions = normalizedRoles?.INVOICE.readInvoiceSection.sectionGroup;
    const invoicePermissions = normalizedRoles?.INVOICE.invoiceSection.sectionGroup;

    const canReadAccounts = accountPermissions?.read.value === AccessControlScope.Company;
    const canReadCrmAccounts =
      crmAccountsPermissions.readEntry.value === AccessControlScope.Company ||
      crmAccountsPermissions.readEntry.value === AccessControlScope.Owner;
    const canReadInvoices = readInvoicePermissions.read.value === AccessControlScope.Company;

    return {
      canRead: canReadInvoices && canReadCrmAccounts && canReadAccounts,
      canCreate: invoicePermissions.create.value === AccessControlScope.Company,
      canUpdate: invoicePermissions.update.value === AccessControlScope.Company,
      canDelete: invoicePermissions.delete.value === AccessControlScope.Company,
      canReview: invoicePermissions.review.value === AccessControlScope.Company
    };
  }

  getLineItemPermissions() {
    const normalizedRoles = Environment.getCurrentUser().normalizedAccessControlRoles;
    const invoiceLineItemPermissions = normalizedRoles?.INVOICE.invoiceLineItemSection.sectionGroup;

    return {
      canCreateLineItem: invoiceLineItemPermissions.create.value === AccessControlScope.Company,
      canUpdateLineItem: invoiceLineItemPermissions.update.value === AccessControlScope.Company,
      canDeleteLineItem: invoiceLineItemPermissions.delete.value === AccessControlScope.Company
    };
  }

  getPaymentPermissions() {
    const normalizedRoles = Environment.getCurrentUser().normalizedAccessControlRoles;
    const invoicePaymentPermissions = normalizedRoles?.INVOICE.invoicePaymentSection.sectionGroup;

    return {
      canCreatePayment: invoicePaymentPermissions.create.value === AccessControlScope.Company,
      canUpdatePayment: invoicePaymentPermissions.update.value === AccessControlScope.Company,
      canDeletePayment: invoicePaymentPermissions.delete.value === AccessControlScope.Company,
      canApplyCreditMemo: true
    };
  }

  getOpenLineItemPermissions() {
    const normalizedRoles = Environment.getCurrentUser().normalizedAccessControlRoles;
    const salesOrderLineItemPermissions = normalizedRoles?.SALES_ORDER.salesOrderLineItemSection.sectionGroup;

    return {
      canCreateOpenLineItem: salesOrderLineItemPermissions.create.value === AccessControlScope.Company,
      canUpdateOpenLineItem: salesOrderLineItemPermissions.update.value === AccessControlScope.Company,
      canDeleteOpenLineItem: salesOrderLineItemPermissions.delete.value === AccessControlScope.Company
    };
  }

  getInvoices(limit: number, offset: number, filters: ARInvoicesFilters) {
    const advancedFilters: ARInvoicesFilters = {
      ...filters,
      invoiceDate: FilterBuilderHelper.getDateForRange(filters.invoiceDate)?.toISOString(),
      dueDate: FilterBuilderHelper.getDateForRange(filters.dueDate)?.toISOString()
    };
    return this.invoicesApiService.getInvoices(limit, offset, advancedFilters);
  }

  getInvoice(id: string) {
    if (!id) {
      return of(null);
    }

    return this.invoicesApiService.getInvoice(id);
  }

  getInvoiceFromSalesOrder(invoiceId: string) {
    return this.salesOrdersApiService.getSalesOrders(1000, 0, { invoiceIds: [invoiceId] }).pipe(
      first(),
      map(salesOrders => {
        const salesOrder = salesOrders[0];
        const invoice = salesOrder.invoices.find(entry => entry.id === invoiceId);
        return { invoice, salesOrder };
      })
    );
  }

  addInvoice(payload) {
    return this.invoicesApiService.addInvoice(payload);
  }

  editInvoice(id: string, payload) {
    return this.invoicesApiService.editInvoice(id, payload);
  }

  deleteInvoice(id: string) {
    return this.invoicesApiService.deleteInvoice(id);
  }

  getSalesOrder(salesOrderId) {
    return this.salesOrdersApiService.getSalesOrderById(salesOrderId);
  }

  getAccounts() {
    const limit = 1000;
    const offset = 0;
    return this.accountsService.getAccounts(limit, offset);
  }

  getCrmLocations(customer: SalesOrderCustomerInfo) {
    return this.crmService.getLocations(true).pipe(
      first(),
      map(locations => {
        const billToLocation = locations.find(location => location.id === customer.billToLocation);
        if (customer.billToLocation === customer.shipToLocation) {
          return {
            billToLocation,
            shipToLocation: billToLocation
          };
        }

        const shipToLocation = locations.find(location => location.id === customer.shipToLocation);
        return {
          billToLocation,
          shipToLocation
        };
      })
    );
  }

  getInvoiceLineItem(invoiceId: string, lineItemId: string) {
    if (!invoiceId || !lineItemId) {
      return of(null);
    }

    return this.invoicesApiService.getInvoiceLineItem(invoiceId, lineItemId);
  }

  addInvoiceLineItem(invoiceId: string, paylaod) {
    return this.invoicesApiService.addInvoiceLineItem(invoiceId, paylaod);
  }

  editInvoiceLineItem(invoiceId: string, lineItemId: string, payload) {
    return this.invoicesApiService.editInvoiceLineItem(invoiceId, lineItemId, payload);
  }

  deleteInvoiceLineItem(invoiceId: string, lineItemId: string) {
    return this.invoicesApiService.deleteInvoiceLineItem(invoiceId, lineItemId);
  }

  addInvoicePayment(invoiceId: string, payload) {
    return this.invoicesApiService.addInvoicePayment(invoiceId, payload);
  }

  getInvoicePayment(invoiceId: string, paymentId: string) {
    if (!invoiceId || !paymentId) {
      return of(null);
    }

    return this.invoicesApiService.getInvoicePayment(invoiceId, paymentId);
  }

  editInvoicePayment(invoiceId: string, paymentId: string, payload) {
    return this.invoicesApiService.editInvoicePayment(invoiceId, paymentId, payload);
  }

  deleteInvoicePayment(invoiceId: string, paymentId: string) {
    return this.invoicesApiService.deleteInvoicePayment(invoiceId, paymentId);
  }

  getMembers() {
    return this.companiesService.getCompanyCompleteMembers().pipe(map(items => items.filter(m => m.firstName)));
  }

  public async generateInvoicePDF({
    invoice,
    salesOrderNumber,
    billToLocation,
    shipToLocation
  }: InvoicePdfTemplateData) {
    try {
      this.spinnerService.setStatus(true);

      const factory = this.resolver.resolveComponentFactory(InvoicePdfTemplateComponent);
      const component = factory.create(this.injector);
      component.instance.invoice = invoice;
      component.instance.salesOrderNumber = salesOrderNumber;
      component.instance.billToLocation = billToLocation;
      component.instance.shipToLocation = shipToLocation;

      component.changeDetectorRef.detectChanges();

      const fileName = `invoice_${invoice.number}_issued`;
      const htmlTemplate = component.location.nativeElement;
      const options = {
        margin: 10,
        filename: fileName + '.pdf',
        filePrefix: fileName,
        html2canvas: { scale: 1.5, useCORS: true, logging: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css'], before: '.page-break' }
      };
      const milestoneDescription = 'Invoice PDF file generated';

      return await this.generatePdfFileAndAttacheAsMilestone(options, htmlTemplate, invoice, milestoneDescription);
    } catch (error) {
      console.error(error);
    } finally {
      this.spinnerService.setStatus(false);
    }
  }

  async generatePdfFileAndAttacheAsMilestone(options, htmlTemplate, invoice, milestoneDescription) {
    return await html2pdf()
      .set(options)
      .from(htmlTemplate)
      .toPdf()
      .get('pdf')
      .then(pdf => {
        const pdfFile = new File([pdf.output('blob')], options.filename, { type: 'application/pdf' });
        return this.attacheAsMilestone(invoice, milestoneDescription, pdfFile, options.filePrefix).toPromise();
      });
  }

  private attacheAsMilestone(invoice: ARInvoice, description: string, file: File, filePrefix: string) {
    return this.milestoneService.uploadDocument(file, filePrefix).pipe(
      first(),
      mergeMap(attachment => {
        const milestone = {
          description,
          icon: 'pdf',
          attachment: attachment.id
        };

        return this.invoicesApiService.addInvoiceMilestone(invoice.id, milestone).pipe(
          tap(milestone => {
            milestone.attachment = <AttachmentEntity>attachment;
            milestone.creator = Environment.getCurrentUser();
            return milestone;
          })
        );
      })
    );
  }
}
