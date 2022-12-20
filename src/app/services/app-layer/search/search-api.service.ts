import { Injectable } from '@angular/core';
import { environment as config } from '@env/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ObjectUtil } from '@services/helpers/utils/object-util';

export interface AdvancedFilterPayload {
  filters: any;
  fields?: Array<string>;
  limit?: number;
  offset?: number;
}

export interface ProductLotsSearchPayload {
  filters: any;
}

export interface MarketSearchPayload {
  products?: string[];
  productGroup: string;
  organizationIds: string[];
  shipFromIds?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class SearchApiService {
  private searchUrl = config.baseSearchUrl();

  constructor(private httpClient: HttpClient) {}

  searchTransactions(payload: AdvancedFilterPayload, isBackgroundRequest?: boolean): Observable<any> {
    this.handleEmptyPayload(payload);
    let params = new HttpParams();
    if (isBackgroundRequest) params = params.set('background-request', 'true');
    return this.httpClient.post<any>(`${this.searchUrl}/transactions`, payload, { params });
  }

  searchProducts(payload: AdvancedFilterPayload, isBackgroundRequest?: boolean): Observable<any> {
    this.handleEmptyPayload(payload);
    let params = new HttpParams();
    if (isBackgroundRequest) params = params.set('background-request', 'true');
    return this.httpClient.post<any>(`${this.searchUrl}/products`, payload, { params });
  }

  searchProductsCount(payload: ProductLotsSearchPayload): Observable<number> {
    this.handleEmptyPayload(payload);
    return this.httpClient.post<any>(`${this.searchUrl}/products/count`, payload);
  }

  searchProductsLot(payload: ProductLotsSearchPayload): Observable<string[]> {
    this.handleEmptyPayload(payload);
    return this.httpClient.post<any>(`${this.searchUrl}/products/lot`, payload);
  }

  searchProductsMarket(payload: MarketSearchPayload): Observable<any> {
    this.handleEmptyPayload(payload);
    return this.httpClient.post<any>(`${this.searchUrl}/products/market`, payload);
  }

  searchJournalEntries(payload: AdvancedFilterPayload): Observable<any> {
    this.handleEmptyPayload(payload);
    return this.httpClient.post<any>(`${this.searchUrl}/journal-entries`, payload);
  }

  private handleEmptyPayload(payload): void {
    if (!payload || ObjectUtil.isEmptyObject(payload)) {
      throw new Error('Something unexpected happened. Please check the filters and try again.');
    }
  }
}
