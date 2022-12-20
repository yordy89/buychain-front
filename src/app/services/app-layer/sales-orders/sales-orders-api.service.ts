import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ARLineItem, ARSalesOrder } from '@services/app-layer/entities/accounts-receivable';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment as config } from '@env/environment';
import { HttpHelper } from '@services/helpers/utils/http-helper';
import { ARSalesOrdersFilters } from '@views/main/accounting/accounts-receivable/sales-orders/components/sales-orders-filters/sales-orders-filters.component';
import { ARSalesOrderStateEnum } from '@services/app-layer/app-layer.enums';
import { AccountingAttachment } from '@services/app-layer/accounting-attachments/accounting-attachments.service';

@Injectable({
  providedIn: 'root'
})
export class SalesOrdersApiService {
  private accountingUrl = config.baseAccountingUrl();

  constructor(private httpClient: HttpClient) {}

  getSalesOrders(limit: number, offset: number, filters?: ARSalesOrdersFilters): Observable<ARSalesOrder[]> {
    const params = { limit, offset, ...filters };

    return this.httpClient
      .get<any>(`${this.accountingUrl}/sales-order`, { params: HttpHelper.getQueryParams(params) })
      .pipe(map(salesOrders => salesOrders.map(saleOrder => new ARSalesOrder().init(saleOrder))));
  }

  addSalesOrder(payload): Observable<ARSalesOrder> {
    return this.httpClient
      .post(`${this.accountingUrl}/sales-order`, payload)
      .pipe(map(data => new ARSalesOrder().init(data)));
  }

  editSalesOrder(id: string, payload): Observable<ARSalesOrder> {
    return this.httpClient
      .patch(`${this.accountingUrl}/sales-order/${id}`, payload)
      .pipe(map(data => new ARSalesOrder().init(data)));
  }

  deleteSalesOrder(id: string): Observable<any> {
    return this.httpClient.delete(`${this.accountingUrl}/sales-order/${id}`);
  }

  closeSalesOrder(id: string): Observable<ARSalesOrder> {
    const payload = { state: ARSalesOrderStateEnum.CLOSED };
    return this.httpClient
      .put(`${this.accountingUrl}/sales-order/${id}/state`, payload)
      .pipe(map(data => new ARSalesOrder().init(data)));
  }

  addSalesOrderOpenLineItem(salesOrderId: string, payload): Observable<ARSalesOrder> {
    return this.httpClient
      .post(`${this.accountingUrl}/sales-order/${salesOrderId}/open-line-items`, payload)
      .pipe(map(data => new ARSalesOrder().init(data)));
  }

  getSalesOrderOpenLineItem(salesOrderId: string, lineItemId: string): Observable<ARLineItem> {
    return this.httpClient
      .get(`${this.accountingUrl}/sales-order/${salesOrderId}/open-line-items/${lineItemId}`)
      .pipe(map(data => new ARLineItem().init(data)));
  }

  editSalesOrderOpenLineItem(salesOrderId: string, lineItemId: string, payload): Observable<ARSalesOrder> {
    return this.httpClient
      .put(`${this.accountingUrl}/sales-order/${salesOrderId}/open-line-items/${lineItemId}`, payload)
      .pipe(map(data => new ARSalesOrder().init(data)));
  }

  deleteSalesOrderOpenLineItem(salesOrderId: string, lineItemId: string): Observable<any> {
    return this.httpClient.delete(`${this.accountingUrl}/sales-order/${salesOrderId}/open-line-items/${lineItemId}`);
  }

  getSalesOrderById(id: string): Observable<ARSalesOrder> {
    return this.httpClient
      .get<any>(`${this.accountingUrl}/sales-order/${id}`)
      .pipe(map(salesOrder => new ARSalesOrder().init(salesOrder)));
  }

  addSalesOrderAttachments(
    salesOrderId: string,
    payload: { attachments: AccountingAttachment[] }
  ): Observable<ARSalesOrder> {
    return this.httpClient
      .post(`${this.accountingUrl}/sales-order/${salesOrderId}/attachments`, payload)
      .pipe(map(data => new ARSalesOrder().init(data)));
  }

  deleteSalesOrderAttachment(salesOrderId: string, attachmentId: string): Observable<any> {
    return this.httpClient.delete<any>(`${this.accountingUrl}/sales-order/${salesOrderId}/attachments/${attachmentId}`);
  }
}
