import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { APPurchaseOrder, APLineItem } from '@services/app-layer/entities/accounts-payable';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment as config } from '@env/environment';
import { HttpHelper } from '@services/helpers/utils/http-helper';
import { APPurchaseOrdersFilters } from '@views/main/accounting/accounts-payable/purchase-orders/component/purchase-orders-filters/purchase-orders-filters.component';
import { APPurchaseOrderStateEnum } from '@services/app-layer/app-layer.enums';

@Injectable({
  providedIn: 'root'
})
export class PurchaseOrdersApiService {
  private accountingUrl = config.baseAccountingUrl();

  constructor(private httpClient: HttpClient) {}

  getPurchaseOrders(limit: number, offset: number, filters?: APPurchaseOrdersFilters): Observable<APPurchaseOrder[]> {
    const params = { limit, offset, ...filters };

    return this.httpClient
      .get<any>(`${this.accountingUrl}/purchase-order`, { params: HttpHelper.getQueryParams(params) })
      .pipe(map(purchaseOrders => purchaseOrders.map(purchaseOrder => new APPurchaseOrder().init(purchaseOrder))));
  }

  getPurchaseOrder(id: string): Observable<APPurchaseOrder> {
    return this.httpClient
      .get<any>(`${this.accountingUrl}/purchase-order/${id}`)
      .pipe(map(purchaseOrder => new APPurchaseOrder().init(purchaseOrder)));
  }

  addPurchaseOrder(payload): Observable<APPurchaseOrder> {
    return this.httpClient
      .post(`${this.accountingUrl}/purchase-order`, payload)
      .pipe(map(data => new APPurchaseOrder().init(data)));
  }

  editPurchaseOrder(id: string, payload): Observable<APPurchaseOrder> {
    return this.httpClient
      .patch(`${this.accountingUrl}/purchase-order/${id}`, payload)
      .pipe(map(data => new APPurchaseOrder().init(data)));
  }

  deletePurchaseOrder(id: string): Observable<any> {
    return this.httpClient.delete(`${this.accountingUrl}/purchase-order/${id}`);
  }

  closePurchaseOrder(id: string): Observable<APPurchaseOrder> {
    const payload = { state: APPurchaseOrderStateEnum.CLOSED };
    return this.httpClient
      .put(`${this.accountingUrl}/purchase-order/${id}/state`, payload)
      .pipe(map(data => new APPurchaseOrder().init(data)));
  }

  addPurchaseOrderOpenLineItem(purchaseOrderId: string, payload): Observable<APPurchaseOrder> {
    return this.httpClient
      .post(`${this.accountingUrl}/purchase-order/${purchaseOrderId}/open-line-items`, payload)
      .pipe(map(data => new APPurchaseOrder().init(data)));
  }

  getPurchaseOrderOpenLineItem(purchaseOrderId: string, lineItemId: string): Observable<APLineItem> {
    return this.httpClient
      .get(`${this.accountingUrl}/purchase-order/${purchaseOrderId}/open-line-items/${lineItemId}`)
      .pipe(map(data => new APLineItem().init(data)));
  }

  editPurchaseOrderOpenLineItem(purchaseOrderId: string, lineItemId: string, payload): Observable<APPurchaseOrder> {
    return this.httpClient
      .put(`${this.accountingUrl}/purchase-order/${purchaseOrderId}/open-line-items/${lineItemId}`, payload)
      .pipe(map(data => new APPurchaseOrder().init(data)));
  }

  deletePurchaseOrderOpenLineItem(purchaseOrderId: string, lineItemId: string): Observable<any> {
    return this.httpClient.delete(
      `${this.accountingUrl}/purchase-order/${purchaseOrderId}/open-line-items/${lineItemId}`
    );
  }

  addPurchaseOrderAttachments(purchaseOrderId: string, payload: { attachments: any[] }): Observable<APPurchaseOrder> {
    return this.httpClient
      .post(`${this.accountingUrl}/purchase-order/${purchaseOrderId}/attachments`, payload)
      .pipe(map(data => new APPurchaseOrder().init(data)));
  }

  deletePurchaseOrderAttachment(purchaseOrderId: string, attachmentId: string): Observable<any> {
    return this.httpClient.delete<any>(
      `${this.accountingUrl}/purchase-order/${purchaseOrderId}/attachments/${attachmentId}`
    );
  }
}
