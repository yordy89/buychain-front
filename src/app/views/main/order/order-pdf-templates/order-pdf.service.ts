import { Injectable, Injector, ComponentFactoryResolver } from '@angular/core';
import { Environment } from '@services/app-layer/app-layer.environment';
import { BillOfLadingEntity } from '@services/app-layer/entities/bill-of-lading';
import { AttachmentEntity, TransactionEntity } from '@services/app-layer/entities/transaction';
import { TransactionsService } from '@services/app-layer/transactions/transactions.service';
import { BillOfLadingComponent } from '@views/main/order/order-pdf-templates/bill-of-lading/bill-of-lading.component';
import { InvoiceComponent } from '@views/main/order/order-pdf-templates/invoice/invoice.component';
import { OrderConfirmationComponent } from '@views/main/order/order-pdf-templates/order-confirmation/order-confirmation.component';
import { PickSheetComponent } from '@views/main/order/order-pdf-templates/pick-sheet/pick-sheet.component';
import * as html2pdf from 'html2pdf.js';
import { MilestoneService } from '@app/services/app-layer/milestone/milestone.service';
import { first, mergeMap, tap } from 'rxjs/operators';
import { SpinnerHelperService } from '@app/services/helpers/spinner-helper/spinner-helper.service';
import { OrderConfirmationEntity } from '@services/app-layer/entities/order-confirmation';
import { InvoiceEntity } from '@services/app-layer/entities/invoice';
import { PickTicketEntity } from '@services/app-layer/entities/pick-ticket';

@Injectable({ providedIn: 'root' })
export class OrderPdfService {
  constructor(
    private resolver: ComponentFactoryResolver,
    private injector: Injector,
    private transactionService: TransactionsService,
    private milestoneService: MilestoneService,
    private spinnerService: SpinnerHelperService
  ) {}

  public async generateOrderConfirmation(
    orderConfirmationData: OrderConfirmationEntity,
    transaction: TransactionEntity
  ) {
    try {
      this.spinnerService.setStatus(true);

      const factory = this.resolver.resolveComponentFactory(OrderConfirmationComponent);
      const component = factory.create(this.injector);
      component.instance.orderConfirmation = orderConfirmationData;

      component.changeDetectorRef.detectChanges();

      const htmlTemplate = component.location.nativeElement;
      const options = this.getPdfOptions(`order_confirmation`);
      const milestoneDescription = 'Order Confirmation PDF file generated';

      await this.generatePdfFileAndAttacheAsMilestone(options, htmlTemplate, transaction, milestoneDescription);
    } catch (error) {
      console.error(error);
    } finally {
      this.spinnerService.setStatus(false);
    }
  }

  public async generateInvoice(invoice: InvoiceEntity, transaction: TransactionEntity) {
    try {
      this.spinnerService.setStatus(true);

      const factory = this.resolver.resolveComponentFactory(InvoiceComponent);
      const component = factory.create(this.injector);
      component.instance.invoice = invoice;

      component.changeDetectorRef.detectChanges();

      const htmlTemplate = component.location.nativeElement;
      const options = this.getPdfOptions(`invoice`);
      const milestoneDescription = 'Invoice PDF file generated';

      await this.generatePdfFileAndAttacheAsMilestone(options, htmlTemplate, transaction, milestoneDescription);
    } catch (error) {
      console.error(error);
    } finally {
      this.spinnerService.setStatus(false);
    }
  }

  public async generatePickSheet(pickTicket: PickTicketEntity, transaction: TransactionEntity) {
    try {
      this.spinnerService.setStatus(true);

      const factory = this.resolver.resolveComponentFactory(PickSheetComponent);
      const component = factory.create(this.injector);
      component.instance.pickTicket = pickTicket;

      component.changeDetectorRef.detectChanges();

      const htmlTemplate = component.location.nativeElement;
      const options = this.getPdfOptions(`pick_ticket`);
      const milestoneDescription = 'Pick Ticket PDF file generated';

      await this.generatePdfFileAndAttacheAsMilestone(options, htmlTemplate, transaction, milestoneDescription);
    } catch (error) {
      console.error(error);
    } finally {
      this.spinnerService.setStatus(false);
    }
  }

  public async generateBillOfLadingPdf(billOfLadingData: BillOfLadingEntity, transaction: TransactionEntity) {
    try {
      this.spinnerService.setStatus(true);

      const factory = this.resolver.resolveComponentFactory(BillOfLadingComponent);
      const component = factory.create(this.injector);
      component.instance.billOfLadingData = billOfLadingData;

      component.changeDetectorRef.detectChanges();

      const htmlTemplate = component.location.nativeElement;
      const options = this.getPdfOptions(`bill_of_lading`);
      const milestoneDescription = 'Bill of Lading PDF file generated';

      await this.generatePdfFileAndAttacheAsMilestone(options, htmlTemplate, transaction, milestoneDescription);
    } catch (error) {
      console.error(error);
    } finally {
      this.spinnerService.setStatus(false);
    }
  }

  async generatePdfFileAndAttacheAsMilestone(options, htmlTemplate, transaction, milestoneDescription) {
    await html2pdf()
      .set(options)
      .from(htmlTemplate)
      .toPdf()
      .get('pdf')
      .then(pdf => {
        const pdfFile = this.constructPdfFileFromBlob(pdf.output('blob'), options.filename);
        return this.attacheAsMilestone(transaction, milestoneDescription, pdfFile, options.filePrefix).toPromise();
      });
  }

  private constructPdfFileFromBlob(blob, fileName) {
    return new File([blob], fileName, { type: 'application/pdf' });
  }

  private attacheAsMilestone(transaction: TransactionEntity, description: string, file: File, filePrefix: string) {
    return this.milestoneService.uploadDocument(file, filePrefix).pipe(
      first(),
      mergeMap(attachment => {
        const milestone = {
          description,
          icon: 'pdf',
          attachment: attachment.id
        };

        return this.transactionService.addTransactionMilestone(transaction.id, milestone).pipe(
          tap(milestoneEntity => {
            milestoneEntity.attachment = <AttachmentEntity>attachment;
            milestoneEntity.creator = Environment.getCurrentUser();
            transaction.milestones.push(milestoneEntity);
          })
        );
      })
    );
  }

  private getPdfOptions(fileName: string) {
    return {
      margin: 10,
      filename: fileName + '.pdf',
      filePrefix: fileName,
      html2canvas: { scale: 1.5, useCORS: true, logging: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['css'], before: '.page-break' }
    };
  }
}
