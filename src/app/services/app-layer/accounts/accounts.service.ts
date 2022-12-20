import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HttpHelper } from '@services/helpers/utils/http-helper';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AccountEntity } from '@services/app-layer/entities/account';
import { environment as config } from '@env/environment';

@Injectable({
  providedIn: 'root'
})
export class AccountsService {
  private accountingUrl = config.baseAccountingUrl();

  constructor(private httpClient: HttpClient) {}

  getAccountById(accountId: string): Observable<AccountEntity> {
    return this.httpClient
      .get<any>(`${this.accountingUrl}/accounts/${accountId}`)
      .pipe(map(account => new AccountEntity().init(account)));
  }

  getAccounts(limit: number, offset: number, filters?: any): Observable<AccountEntity[]> {
    const params = { limit, offset, ...filters };

    return this.httpClient
      .get<any>(`${this.accountingUrl}/accounts`, { params: HttpHelper.getQueryParams(params) })
      .pipe(map(accounts => accounts.map(account => new AccountEntity().init(account))));
  }

  addAccount(payload: any): Observable<any> {
    return this.httpClient
      .post<any>(`${this.accountingUrl}/accounts`, payload)
      .pipe(map(data => new AccountEntity().init(data)));
  }

  editAccount(account: AccountEntity, payload: any): Observable<any> {
    return this.httpClient
      .patch<any>(`${this.accountingUrl}/accounts/${account.id}`, payload)
      .pipe(map(data => new AccountEntity().init(data)));
  }

  deleteAccount(accountId: string): Observable<any> {
    return this.httpClient.delete<any>(`${this.accountingUrl}/accounts/${accountId}`);
  }
}
