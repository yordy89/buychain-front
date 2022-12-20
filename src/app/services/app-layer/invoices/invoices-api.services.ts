import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ARInvoice, ARInvoicePayment, ARLineItem } from '@services/app-layer/entities/accounts-receivable';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment as config } from '@env/environment';
import { HttpHelper } from '@services/helpers/utils/http-helper';
import { ARInvoiceReviewStateEnum, ARInvoiceStateEnum } from '@services/app-layer/app-layer.enums';
import { AccountingAttachment } from '@services/app-layer/accounting-attachments/accounting-attachments.service';
import { MilestoneEntity } from '@services/app-layer/entities/transaction';

export type EditInvoiceReviewStatePayload = {
  reviewState: ARInvoiceReviewStateEnum.REJECT | ARInvoiceReviewStateEnum.APPROVED;
};

@Injectable({
  providedIn: 'root'
})
export class InvoicesApiService {
  private accountingUrl = config.baseAccountingUrl();

  constructor(private httpClient: HttpClient) {}

  getInvoices(limit: number, offset: number, filters): Observable<ARInvoice[]> {
    const params = { limit, offset, ...filters };

    return this.httpClient
      .get<any>(`${this.accountingUrl}/invoices`, { params: HttpHelper.getQueryParams(params) })
      .pipe(map(invoices => invoices.map(invoice => new ARInvoice().init(invoice))));
  }

  getInvoice(id: string): Observable<ARInvoice> {
    return this.httpClient.get(`${this.accountingUrl}/invoices/${id}`).pipe(map(data => new ARInvoice().init(data)));
  }

  addInvoice(payload): Observable<ARInvoice> {
    return this.httpClient
      .post(`${this.accountingUrl}/invoices`, payload)
      .pipe(map(data => new ARInvoice().init(data)));
  }

  editInvoice(id: string, payload): Observable<ARInvoice> {
    return this.httpClient
      .patch(`${this.accountingUrl}/invoices/${id}`, payload)
      .pipe(map(data => new ARInvoice().init(data)));
  }

  editInvoiceReviewState(id: string, payload: EditInvoiceReviewStatePayload): Observable<ARInvoice> {
    return this.httpClient
      .patch(`${this.accountingUrl}/invoices/${id}/review`, payload)
      .pipe(map(data => new ARInvoice().init(data)));
  }

  deleteInvoice(id: string): Observable<any> {
    return this.httpClient.delete(`${this.accountingUrl}/invoices/${id}`);
  }

  addInvoiceLineItem(invoiceId: string, payload): Observable<ARInvoice> {
    return this.httpClient
      .post(`${this.accountingUrl}/invoices/${invoiceId}/line-items`, payload)
      .pipe(map(data => new ARInvoice().init(data)));
  }

  addInvoiceLineItemFromSalesOrder(invoiceId: string, payload): Observable<ARInvoice> {
    return this.httpClient
      .post(`${this.accountingUrl}/invoices/${invoiceId}/line-items/sales-order`, payload)
      .pipe(map(data => new ARInvoice().init(data)));
  }

  getInvoiceLineItem(invoiceId: string, lineItemId: string): Observable<ARLineItem> {
    return this.httpClient
      .get(`${this.accountingUrl}/invoices/${invoiceId}/line-items/${lineItemId}`)
      .pipe(map(data => new ARLineItem().init(data)));
  }

  editInvoiceLineItem(invoiceId: string, lineItemId: string, payload): Observable<ARInvoice> {
    return this.httpClient
      .put(`${this.accountingUrl}/invoices/${invoiceId}/line-items/${lineItemId}`, payload)
      .pipe(map(data => new ARInvoice().init(data)));
  }

  deleteInvoiceLineItem(invoiceId: string, lineItemId: string): Observable<any> {
    return this.httpClient.delete(`${this.accountingUrl}/invoices/${invoiceId}/line-items/${lineItemId}`);
  }

  addInvoicePayment(invoiceId: string, payload): Observable<ARInvoice> {
    return this.httpClient
      .post(`${this.accountingUrl}/invoices/${invoiceId}/payments`, payload)
      .pipe(map(data => new ARInvoice().init(data)));
  }

  getInvoicePayment(invoiceId: string, paymentId: string): Observable<ARInvoicePayment> {
    return this.httpClient
      .get(`${this.accountingUrl}/invoices/${invoiceId}/payments/${paymentId}`)
      .pipe(map(data => new ARInvoicePayment().init(data)));
  }

  editInvoicePayment(invoiceId: string, paymentId: string, payload): Observable<ARInvoice> {
    return this.httpClient
      .patch(`${this.accountingUrl}/invoices/${invoiceId}/payments/${paymentId}`, payload)
      .pipe(map(data => new ARInvoice().init(data)));
  }

  deleteInvoicePayment(invoiceId: string, paymentId: string): Observable<any> {
    return this.httpClient.delete(`${this.accountingUrl}/invoices/${invoiceId}/payments/${paymentId}`);
  }

  addInvoiceAttachments(invoiceId: string, payload: { attachments: AccountingAttachment[] }): Observable<ARInvoice> {
    return this.httpClient
      .post(`${this.accountingUrl}/invoices/${invoiceId}/attachments`, payload)
      .pipe(map(data => new ARInvoice().init(data)));
  }

  deleteInvoiceAttachment(invoiceId: string, attachmentId: string): Observable<any> {
    return this.httpClient.delete<any>(`${this.accountingUrl}/invoices/${invoiceId}/attachments/${attachmentId}`);
  }

  addPaymentAttachments(
    invoiceId: string,
    paymentId: string,
    payload: { payment: { attachments: AccountingAttachment[] } }
  ): Observable<ARInvoice> {
    return this.httpClient
      .post(`${this.accountingUrl}/invoices/${invoiceId}/payments/${paymentId}/attachments`, payload)
      .pipe(map(data => new ARInvoice().init(data)));
  }

  deletePaymentAttachment(invoiceId: string, paymentId: string, attachmentId: string): Observable<any> {
    return this.httpClient.delete<any>(
      `${this.accountingUrl}/invoices/${invoiceId}/payments/${paymentId}/attachments/${attachmentId}`
    );
  }

  getInvoiceMilestones(invoiceId: string): Observable<MilestoneEntity[]> {
    return this.httpClient
      .get<[]>(`${this.accountingUrl}/invoices/${invoiceId}/milestones`)
      .pipe(map(milestones => milestones.map(milestones => new MilestoneEntity().init(milestones))));
  }

  voidInvoice(invoiceId: string): Observable<ARInvoice> {
    return this.httpClient
      .patch(`${this.accountingUrl}/invoices/${invoiceId}/void`, { state: ARInvoiceStateEnum.VOIDED })
      .pipe(map(data => new ARInvoice().init(data)));
  }

  addInvoiceMilestone(invoiceId: string, payload): Observable<MilestoneEntity> {
    return this.httpClient
      .post(`${this.accountingUrl}/invoices/${invoiceId}/milestones`, payload)
      .pipe(map(data => new MilestoneEntity().init(data)));
  }
}
