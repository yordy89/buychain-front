import { Injectable } from '@angular/core';
import { BaseApiService } from '@app/services/data-layer/http-api/base-api/base-api.service';
import { Observable } from 'rxjs';
import { first, map } from 'rxjs/operators';
import {
  CrmAccountEntity,
  CrmContactEntity,
  CrmLocationEntity,
  CrmAccountSalesInfoEntity,
  CrmAccountCreditInfoEntity,
  CrmContactSalesInfoEntity,
  CrmLocationSalesInfoEntity,
  CrmAccountPaymentInfoEntity
} from '../entities/crm';
import {
  CrmAccountContactLabelsPopulated,
  CrmAccountLabelsPopulated,
  CrmAccountLocationLabelsPopulated
} from '@services/data-layer/http-api/base-api/swagger-gen';

@Injectable({
  providedIn: 'root'
})
export class CrmService {
  private readonly limit = 1000;

  constructor(private baseApi: BaseApiService) {}

  public getAccounts(includeArchived?: boolean): Observable<CrmAccountEntity[]> {
    const archived = includeArchived ? null : false;
    return this.baseApi.crm.getCrmAccounts(archived, this.limit).pipe(
      first(),
      map(dataArray =>
        dataArray.map(dto => new CrmAccountEntity().init(dto)).sort((a, b) => a.fullName.localeCompare(b.fullName))
      )
    );
  }

  public createAccount(data): Observable<CrmAccountEntity> {
    return this.baseApi.crm.addCrmAccount(data).pipe(
      first(),
      map(dto => new CrmAccountEntity().init(dto))
    );
  }

  public updateAccount(accountId: string, data: any): Observable<CrmAccountEntity> {
    return this.baseApi.crm.updateCrmAccount(accountId, data).pipe(
      first(),
      map(resp => new CrmAccountEntity().init(resp))
    );
  }

  public archiveAccount(accountId: string): Observable<any> {
    const payload: any = { archived: true };
    return this.baseApi.crm.updateCrmAccount(accountId, payload).pipe(first());
  }

  public unArchiveAccount(accountId: string): Observable<any> {
    const payload: any = { archived: false };
    return this.baseApi.crm.updateCrmAccount(accountId, payload).pipe(first());
  }

  public getAccountSalesInfo(accountId: string): Observable<CrmAccountSalesInfoEntity> {
    return this.baseApi.crm.getCrmAccountSalesInfo(accountId).pipe(
      first(),
      map(dto => new CrmAccountSalesInfoEntity().init(dto))
    );
  }

  public updateAccountSalesInfo(accountId: string, data): Observable<CrmAccountSalesInfoEntity> {
    return this.baseApi.crm.updateCrmAccountSalesInfo(accountId, data).pipe(
      first(),
      map(dto => new CrmAccountSalesInfoEntity().init(dto))
    );
  }

  public getAccountCreditInfo(accountId: string): Observable<CrmAccountCreditInfoEntity> {
    return this.baseApi.crm.getCrmAccountCreditInfo(accountId).pipe(
      first(),
      map(dto => new CrmAccountCreditInfoEntity().init(dto))
    );
  }

  public getAccountPaymentInfo(accountId: string): Observable<CrmAccountPaymentInfoEntity> {
    return this.baseApi.crm.getCrmAccountPaymentInfo(accountId).pipe(
      first(),
      map(dto => new CrmAccountPaymentInfoEntity().init(dto))
    );
  }

  public updateAccountCreditInfo(accountId: string, data): Observable<CrmAccountCreditInfoEntity> {
    return this.baseApi.crm.updateCrmAccountCreditInfo(accountId, data).pipe(
      first(),
      map(dto => new CrmAccountCreditInfoEntity().init(dto))
    );
  }

  public updateAccountPaymentInfo(accountId: string, data): Observable<CrmAccountPaymentInfoEntity> {
    return this.baseApi.crm.updateCrmAccountPaymentInfo(accountId, data).pipe(
      first(),
      map(dto => new CrmAccountPaymentInfoEntity().init(dto))
    );
  }

  public updateCrmAccountLabels(accountId: string, payload: any): Observable<CrmAccountLabelsPopulated> {
    return this.baseApi.crm.updateCrmAccountLabels(accountId, payload).pipe(first());
  }

  public getContacts(includeArchived?: boolean): Observable<CrmContactEntity[]> {
    const archived = includeArchived ? null : false;
    return this.baseApi.crm.getCrmContacts(archived, this.limit).pipe(
      first(),
      map(dataArray =>
        dataArray.map(dto => new CrmContactEntity().init(dto)).sort((a, b) => a.fullName.localeCompare(b.fullName))
      )
    );
  }

  public createContact(accountId: string, data: any): Observable<CrmContactEntity> {
    return this.baseApi.crm.addCrmAccountContact(accountId, data).pipe(
      first(),
      map(dto => new CrmContactEntity().init(dto))
    );
  }

  public updateContact(accountId: string, contactId: string, data): Observable<CrmContactEntity> {
    return this.baseApi.crm.updateCrmAccountContact(accountId, contactId, data).pipe(
      first(),
      map(resp => new CrmContactEntity().init(resp))
    );
  }

  public archiveContact(accountId: string, contactId: string): Observable<any> {
    const payload: any = { archived: true };
    return this.baseApi.crm.updateCrmAccountContact(accountId, contactId, payload).pipe(first());
  }

  public unArchiveContact(accountId: string, contactId: string): Observable<any> {
    const payload: any = { archived: false };
    return this.baseApi.crm.updateCrmAccountContact(accountId, contactId, payload).pipe(first());
  }

  public getContactSalesInfo(accountId: string, contactId: string): Observable<CrmContactSalesInfoEntity> {
    return this.baseApi.crm.getCrmAccountContactSalesInfo(accountId, contactId).pipe(
      first(),
      map(dto => new CrmContactSalesInfoEntity().init(dto))
    );
  }

  public updateContactSalesInfo(accountId: string, contactId: string, data): Observable<CrmContactSalesInfoEntity> {
    return this.baseApi.crm.updateCrmAccountContactSalesInfo(accountId, contactId, data).pipe(
      first(),
      map(dto => new CrmContactSalesInfoEntity().init(dto))
    );
  }

  public updateCrmAccountContactLabels(
    accountId: string,
    contactId: string,
    payload: any
  ): Observable<CrmAccountContactLabelsPopulated> {
    return this.baseApi.crm.updateCrmAccountContactLabels(accountId, contactId, payload).pipe(first());
  }

  public getLocations(includeArchived?: boolean): Observable<CrmLocationEntity[]> {
    const archived = includeArchived ? null : false;
    return this.baseApi.crm.getCrmLocations(archived, this.limit).pipe(
      first(),
      map(dataArray =>
        dataArray.map(dto => new CrmLocationEntity().init(dto)).sort((a, b) => a.fullName.localeCompare(b.fullName))
      )
    );
  }

  public createLocation(accountId: string, data: any): Observable<CrmLocationEntity> {
    return this.baseApi.crm.addCrmAccountLocation(accountId, data).pipe(
      first(),
      map(dto => new CrmLocationEntity().init(dto))
    );
  }

  public updateLocation(accountId: string, locationId: string, data: any): Observable<CrmLocationEntity> {
    return this.baseApi.crm.updateCrmAccountLocation(accountId, locationId, data).pipe(
      first(),
      map(resp => new CrmLocationEntity().init(resp))
    );
  }

  public archiveLocation(accountId: string, locationId: string): Observable<any> {
    const payload: any = { archived: true };
    return this.baseApi.crm.updateCrmAccountLocation(accountId, locationId, payload).pipe(first());
  }

  public unArchiveLocation(accountId: string, locationId: string): Observable<any> {
    const payload: any = { archived: false };
    return this.baseApi.crm.updateCrmAccountLocation(accountId, locationId, payload).pipe(first());
  }

  public getLocationSalesInfo(accountId: string, locationId: string): Observable<CrmLocationSalesInfoEntity> {
    return this.baseApi.crm.getCrmAccountLocationSalesInfo(accountId, locationId).pipe(
      first(),
      map(dto => new CrmLocationSalesInfoEntity().init(dto))
    );
  }

  public updateLocationSalesInfo(accountId: string, locationId: string, data): Observable<CrmLocationSalesInfoEntity> {
    return this.baseApi.crm.updateCrmAccountLocationSalesInfo(accountId, locationId, data).pipe(
      first(),
      map(dto => new CrmLocationSalesInfoEntity().init(dto))
    );
  }

  public updateCrmAccountLocationLabels(
    accountId: string,
    locationId: string,
    payload: any
  ): Observable<CrmAccountLocationLabelsPopulated> {
    return this.baseApi.crm.updateCrmAccountLocationLabels(accountId, locationId, payload).pipe(first());
  }
}
