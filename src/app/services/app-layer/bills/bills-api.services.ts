import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { APBill, APBillPayment, APLineItem } from '@services/app-layer/entities/accounts-payable';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment as config } from '@env/environment';
import { HttpHelper } from '@services/helpers/utils/http-helper';
import { MilestoneEntity } from '@services/app-layer/entities/transaction';

@Injectable({
  providedIn: 'root'
})
export class BillsApiService {
  private accountingUrl = config.baseAccountingUrl();

  constructor(private httpClient: HttpClient) {}

  getBills(limit: number, offset: number, filters): Observable<APBill[]> {
    const params = { limit, offset, ...filters };

    return this.httpClient
      .get<any>(`${this.accountingUrl}/bills`, { params: HttpHelper.getQueryParams(params) })
      .pipe(map(bills => bills.map(bill => new APBill().init(bill))));
  }

  getBill(id: string): Observable<APBill> {
    return this.httpClient.get(`${this.accountingUrl}/bills/${id}`).pipe(map(data => new APBill().init(data)));
  }

  addBill(payload): Observable<APBill> {
    return this.httpClient.post(`${this.accountingUrl}/bills`, payload).pipe(map(data => new APBill().init(data)));
  }

  editBill(id: string, payload): Observable<APBill> {
    return this.httpClient
      .patch(`${this.accountingUrl}/bills/${id}`, payload)
      .pipe(map(data => new APBill().init(data)));
  }

  deleteBill(id: string): Observable<any> {
    return this.httpClient.delete(`${this.accountingUrl}/bills/${id}`);
  }

  addBillLineItem(billId: string, payload): Observable<APBill> {
    return this.httpClient
      .post(`${this.accountingUrl}/bills/${billId}/bill-line-items`, payload)
      .pipe(map(data => new APBill().init(data)));
  }

  addBillLineItemFromPurchaseOrder(billId: string, payload): Observable<APBill> {
    return this.httpClient
      .post(`${this.accountingUrl}/bills/${billId}/bill-line-items/purchase-order`, payload)
      .pipe(map(data => new APBill().init(data)));
  }

  getBillLineItem(billId: string, lineItemId: string): Observable<APLineItem> {
    return this.httpClient
      .get(`${this.accountingUrl}/bills/${billId}/bill-line-items/${lineItemId}`)
      .pipe(map(data => new APLineItem().init(data)));
  }

  editBillLineItem(billId: string, lineItemId: string, payload): Observable<APBill> {
    return this.httpClient
      .put(`${this.accountingUrl}/bills/${billId}/bill-line-items/${lineItemId}`, payload)
      .pipe(map(data => new APBill().init(data)));
  }

  deleteBillLineItem(billId: string, lineItemId: string): Observable<any> {
    return this.httpClient.delete(`${this.accountingUrl}/bills/${billId}/bill-line-items/${lineItemId}`);
  }

  addBillPayment(billId: string, payload): Observable<APBill> {
    return this.httpClient
      .post(`${this.accountingUrl}/bills/${billId}/payments`, payload)
      .pipe(map(data => new APBill().init(data)));
  }

  getBillPayment(billId: string, paymentId: string): Observable<APBillPayment> {
    return this.httpClient
      .get(`${this.accountingUrl}/bills/${billId}/payments/${paymentId}`)
      .pipe(map(data => new APBillPayment().init(data)));
  }

  editBillPayment(billId: string, paymentId: string, payload): Observable<APBill> {
    return this.httpClient
      .patch(`${this.accountingUrl}/bills/${billId}/payments/${paymentId}`, payload)
      .pipe(map(data => new APBill().init(data)));
  }

  deleteBillPayment(billId: string, paymentId: string): Observable<any> {
    return this.httpClient.delete(`${this.accountingUrl}/bills/${billId}/payments/${paymentId}`);
  }

  addBillAttachments(billId: string, payload: { attachments: any[] }): Observable<APBill> {
    return this.httpClient
      .post(`${this.accountingUrl}/bills/${billId}/attachments`, payload)
      .pipe(map(data => new APBill().init(data)));
  }

  deleteBillAttachment(billId: string, attachmentId: string): Observable<any> {
    return this.httpClient.delete<any>(`${this.accountingUrl}/bills/${billId}/attachments/${attachmentId}`);
  }

  addBillPaymentAttachments(
    billId: string,
    paymentId: string,
    payload: { payment: { attachments: any[] } }
  ): Observable<APBill> {
    return this.httpClient
      .post(`${this.accountingUrl}/bills/${billId}/payments/${paymentId}/attachments`, payload)
      .pipe(map(data => new APBill().init(data)));
  }

  deleteBillPaymentAttachment(billId: string, paymentId: string, attachmentId: string): Observable<any> {
    return this.httpClient.delete<any>(
      `${this.accountingUrl}/bills/${billId}/payments/${paymentId}/attachments/${attachmentId}`
    );
  }

  getBillMilestones(billId: string): Observable<MilestoneEntity[]> {
    return this.httpClient
      .get<[]>(`${this.accountingUrl}/bills/${billId}/milestones`)
      .pipe(map(milestones => milestones.map(milestones => new MilestoneEntity().init(milestones))));
  }

  public addBillMilestone(billId: string, payload): Observable<MilestoneEntity> {
    return this.httpClient
      .post(`${this.accountingUrl}/bills/${billId}/milestones`, payload)
      .pipe(map(data => new MilestoneEntity().init(data)));
  }
}
