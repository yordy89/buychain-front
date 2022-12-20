import { Injectable } from '@angular/core';
import { environment as config } from '@env/environment';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { BillOfLadingEntity } from '../entities/bill-of-lading';
import { Observable } from 'rxjs';
import { OrderConfirmationEntity } from '@services/app-layer/entities/order-confirmation';
import { InvoiceEntity } from '@services/app-layer/entities/invoice';
import { PickTicketEntity } from '@services/app-layer/entities/pick-ticket';

@Injectable({
  providedIn: 'root'
})
export class ReportsService {
  private reportsUrl = config.baseReportsUrl();

  constructor(private httpClient: HttpClient) {}

  public getBillOfLading(transactionId: string): Observable<BillOfLadingEntity> {
    const params = { transactionId };
    return this.httpClient
      .get(`${this.reportsUrl}/reports/bill-of-lading`, { params })
      .pipe(map(dto => new BillOfLadingEntity().init(dto)));
  }
  public getOrderConfirmation(transactionId: string): Observable<OrderConfirmationEntity> {
    const params = { transactionId };
    return this.httpClient
      .get(`${this.reportsUrl}/reports/order-confirmation`, { params })
      .pipe(map(dto => new OrderConfirmationEntity().init(dto)));
  }
  public getInvoice(transactionId: string): Observable<InvoiceEntity> {
    const params = { transactionId };
    return this.httpClient
      .get(`${this.reportsUrl}/reports/invoice`, { params })
      .pipe(map(dto => new InvoiceEntity().init(dto)));
  }
  public getPickTicket(transactionId: string): Observable<PickTicketEntity> {
    const params = { transactionId };
    return this.httpClient
      .get(`${this.reportsUrl}/reports/pick-ticket`, { params })
      .pipe(map(dto => new PickTicketEntity().init(dto)));
  }
}
