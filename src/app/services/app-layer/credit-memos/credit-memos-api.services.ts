import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment as config } from '@env/environment';
import { ARCreditMemo } from '@services/app-layer/entities/accounts-receivable';
import { ARCreditMemosFilters } from '@views/main/accounting/accounts-receivable/credit-memos/components/credit-memos-filters/credit-memos-filters.component';
import { HttpHelper } from '@services/helpers/utils/http-helper';
import { AccountingAttachment } from '@services/app-layer/accounting-attachments/accounting-attachments.service';

@Injectable({
  providedIn: 'root'
})
export class CreditMemosApiService {
  private accountingUrl = config.baseAccountingUrl();
  private baseUrl = `${this.accountingUrl}/credit-memo`;

  constructor(private httpClient: HttpClient) {}

  addCreditMemo(payload): Observable<ARCreditMemo> {
    return this.httpClient.post(this.baseUrl, payload).pipe(map(data => new ARCreditMemo().init(data)));
  }

  addCRMCreditMemo(payload): Observable<ARCreditMemo> {
    return this.httpClient.post(`${this.baseUrl}/crm`, payload).pipe(map(data => new ARCreditMemo().init(data)));
  }

  getCreditMemos(limit: number, offset: number, filters?: ARCreditMemosFilters): Observable<ARCreditMemo[]> {
    const params = { limit, offset, ...filters };

    return this.httpClient
      .get<any>(this.baseUrl, { params: HttpHelper.getQueryParams(params) })
      .pipe(map(creditMemos => creditMemos.map(creditMemo => new ARCreditMemo().init(creditMemo))));
  }

  getCRMCreditMemos(limit: number, offset: number, filter: { customers: string[] }): Observable<ARCreditMemo[]> {
    const params = { limit, offset, ...filter };

    return this.httpClient
      .get<any>(`${this.baseUrl}/crm`, { params: HttpHelper.getQueryParams(params) })
      .pipe(map(creditMemos => creditMemos.map(creditMemo => new ARCreditMemo().init(creditMemo))));
  }

  deleteCreditMemo(id: string): Observable<any> {
    return this.httpClient.delete(`${this.baseUrl}/${id}`);
  }

  getCreditMemo(id: string): Observable<ARCreditMemo> {
    return this.httpClient
      .get<any>(`${this.baseUrl}/${id}`)
      .pipe(map(creditMemo => new ARCreditMemo().init(creditMemo)));
  }

  editCreditMemo(id: string, payload): Observable<ARCreditMemo> {
    return this.httpClient.patch(`${this.baseUrl}/${id}`, payload).pipe(map(data => new ARCreditMemo().init(data)));
  }

  addCreditMemoAttachments(
    creditMemoId: string,
    payload: { attachments: AccountingAttachment[] }
  ): Observable<ARCreditMemo> {
    return this.httpClient
      .post(`${this.baseUrl}/${creditMemoId}/attachments`, payload)
      .pipe(map(data => new ARCreditMemo().init(data)));
  }

  deleteCreditMemoAttachment(creditMemoId: string, attachmentId: string): Observable<any> {
    return this.httpClient.delete<any>(`${this.baseUrl}/${creditMemoId}/attachments/${attachmentId}`);
  }
}
