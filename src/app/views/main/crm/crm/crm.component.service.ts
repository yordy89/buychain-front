import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { CrmService } from '@app/services/app-layer/crm/crm.service';
import {
  CrmAccountEntity,
  CrmLocationEntity,
  CrmContactEntity,
  CrmAccountSalesInfoEntity,
  CrmContactSalesInfoEntity,
  CrmLocationSalesInfoEntity,
  CrmAccountCreditInfoEntity,
  CrmAccountPaymentInfoEntity
} from '@app/services/app-layer/entities/crm';
import { Observable, throwError } from 'rxjs';
import { first, tap, map, catchError } from 'rxjs/operators';
import { NotificationHelperService } from '@services/helpers/notification-helper/notification-helper.service';

@Injectable({ providedIn: 'root' })
export class CrmComponentService {
  constructor(
    private dialog: MatDialog,
    private crmService: CrmService,
    private notificationHelperService: NotificationHelperService
  ) {}

  getAccountSalesInfo(account: CrmAccountEntity): Observable<CrmAccountSalesInfoEntity> {
    return this.crmService.getAccountSalesInfo(account.id);
  }

  getContactSalesInfo(contact: CrmContactEntity): Observable<CrmContactSalesInfoEntity> {
    return this.crmService.getContactSalesInfo(contact.crmAccountId, contact.id);
  }

  getLocationSalesInfo(location: CrmLocationEntity): Observable<CrmLocationSalesInfoEntity> {
    return this.crmService.getLocationSalesInfo(location.crmAccountId, location.id);
  }

  getAccountCreditInfo(account: CrmAccountEntity): Observable<CrmAccountCreditInfoEntity> {
    return this.crmService.getAccountCreditInfo(account.id);
  }

  getAccountPaymentInfo(account: CrmAccountEntity): Observable<CrmAccountPaymentInfoEntity> {
    return this.crmService.getAccountPaymentInfo(account.id);
  }

  // create
  createAccount(payload): Observable<CrmAccountEntity> {
    return this.crmService.createAccount(payload).pipe(
      first(),
      tap(() => this.notificationHelperService.showSuccess('CRM Account was successfully created')),
      catchError(({ error }) => {
        if (error.status === 400 && (error.message === 'ID must be unique' || error.message === 'Duplicate entry.')) {
          this.notificationHelperService.showValidation(
            'The specified name is already in use, either in an active or an archived Account.' +
              ' Please specify a different name or restore the existing one.'
          );
        }
        throw error;
      })
    );
  }

  createContact(account: CrmAccountEntity, payload): Observable<CrmContactEntity> {
    return this.crmService.createContact(account.id, payload).pipe(
      first(),
      map(contact => {
        this.notificationHelperService.showSuccess('CRM Contact was successfully created');
        contact.crmAccount = account;
        return contact;
      })
    );
  }

  createLocation(account: CrmAccountEntity, payload): Observable<CrmLocationEntity> {
    return this.crmService.createLocation(account.id, payload).pipe(
      first(),
      map(location => {
        this.notificationHelperService.showSuccess('CRM Location was successfully created');
        location.crmAccount = account;
        return location;
      })
    );
  }

  // Archive
  archiveAccount(account: CrmAccountEntity) {
    return this.crmService
      .archiveAccount(account.id)
      .pipe(tap(() => this.notificationHelperService.showSuccess('CRM Account was successfully archived.')));
  }

  archiveContact(contact: CrmContactEntity) {
    return this.crmService.archiveContact(contact.crmAccount.id, contact.id).pipe(
      first(),
      tap(() => this.notificationHelperService.showSuccess('CRM Contact was successfully archived.'))
    );
  }

  archiveLocation(location: CrmLocationEntity) {
    return this.crmService.archiveLocation(location.crmAccount.id, location.id).pipe(
      first(),
      tap(() => this.notificationHelperService.showSuccess('CRM Location was successfully archived.'))
    );
  }

  // UnArchive
  unArchiveAccount(account: CrmAccountEntity) {
    return this.crmService
      .unArchiveAccount(account.id)
      .pipe(tap(() => this.notificationHelperService.showSuccess('CRM Account was successfully unarchived.')));
  }

  unArchiveContact(contact: CrmContactEntity) {
    return this.crmService.unArchiveContact(contact.crmAccount.id, contact.id).pipe(
      first(),
      tap(() => this.notificationHelperService.showSuccess('CRM Contact was successfully unarchived.'))
    );
  }

  unArchiveLocation(location: CrmLocationEntity) {
    return this.crmService.unArchiveLocation(location.crmAccount.id, location.id).pipe(
      first(),
      tap(() => this.notificationHelperService.showSuccess('CRM Location was successfully unarchived.'))
    );
  }

  // update
  updateAccount(account: CrmAccountEntity, payload): Observable<CrmAccountEntity> {
    if (payload.id) delete payload.id;
    return this.crmService.updateAccount(account.id, payload).pipe(
      first(),
      catchError(({ error }) => {
        if (error.status === 400 && (error.message === 'ID must be unique' || error.message === 'Duplicate entry.')) {
          this.notificationHelperService.showValidation(
            'The specified name is already in use, either in an active or an archived Account. Please specify a different name.'
          );
        }

        return throwError(() => error);
      }),
      map(data => {
        data.labels = account.labels;
        return data;
      })
    );
  }

  updateContact(contact: CrmContactEntity, payload): Observable<CrmContactEntity> {
    return this.crmService.updateContact(contact.crmAccountId, contact.id, payload).pipe(
      first(),
      map(data => {
        data.labels = contact.labels;
        return data;
      })
    );
  }

  updateLocation(location: CrmLocationEntity, payload): Observable<CrmLocationEntity> {
    return this.crmService.updateLocation(location.crmAccountId, location.id, payload).pipe(
      first(),
      map(data => {
        data.labels = location.labels;
        return data;
      })
    );
  }

  updateAccountSalesInfo(account: CrmAccountEntity, payload): Observable<CrmAccountSalesInfoEntity> {
    return this.crmService
      .updateAccountSalesInfo(account.id, payload)
      .pipe(tap(() => this.notificationHelperService.showSuccess('CRM Account Sales Info was successfully updated')));
  }

  updateAccountCreditInfo(account: CrmAccountEntity, payload): Observable<CrmAccountCreditInfoEntity> {
    return this.crmService
      .updateAccountCreditInfo(account.id, payload)
      .pipe(tap(() => this.notificationHelperService.showSuccess('CRM Account Credit Info was successfully updated')));
  }

  updateAccountPaymentInfo(account: CrmAccountEntity, payload): Observable<CrmAccountPaymentInfoEntity> {
    return this.crmService
      .updateAccountPaymentInfo(account.id, payload)
      .pipe(tap(() => this.notificationHelperService.showSuccess('CRM Account Payment Info was successfully updated')));
  }

  updateContactSalesInfo(contact: CrmContactEntity, payload): Observable<CrmContactSalesInfoEntity> {
    return this.crmService
      .updateContactSalesInfo(contact.crmAccountId, contact.id, payload)
      .pipe(tap(() => this.notificationHelperService.showSuccess('CRM Contact Sales Info was successfully updated')));
  }

  updateLocationSalesInfo(location: CrmLocationEntity, payload): Observable<CrmLocationSalesInfoEntity> {
    return this.crmService
      .updateLocationSalesInfo(location.crmAccountId, location.id, payload)
      .pipe(tap(() => this.notificationHelperService.showSuccess('CRM Location Sales Info was successfully updated')));
  }

  // Toggle link
  toggleAccountLink(account: CrmAccountEntity, linkId: string): Observable<CrmAccountEntity> {
    return this.crmService.updateAccount(account.id, { link: linkId }).pipe(
      map(data => {
        data.labels = account.labels;
        return data;
      })
    );
  }

  toggleContactLink(contact: CrmContactEntity, linkId: string): Observable<CrmContactEntity> {
    return this.updateContact(contact, { link: linkId });
  }

  toggleLocationLink(location: CrmLocationEntity, linkId: string): Observable<CrmLocationEntity> {
    return this.updateLocation(location, { link: linkId });
  }

  // update labels
  updateAccountLabels(account: CrmAccountEntity, payload: any): Observable<CrmAccountEntity> {
    return this.crmService.updateCrmAccountLabels(account.id, payload).pipe(
      first(),
      map(labels => (account = new CrmAccountEntity().init(Object.assign(account, { labels }))))
    );
  }

  updateContactLabels(contact: CrmContactEntity, payload: any): Observable<CrmContactEntity> {
    return this.crmService.updateCrmAccountContactLabels(contact.crmAccountId, contact.id, payload).pipe(
      first(),
      map(labels => (contact = new CrmContactEntity().init(Object.assign(contact, { labels }))))
    );
  }

  updateLocationLabels(location: CrmLocationEntity, payload: any): Observable<CrmLocationEntity> {
    return this.crmService.updateCrmAccountLocationLabels(location.crmAccountId, location.id, payload).pipe(
      first(),
      map(labels => (location = new CrmLocationEntity().init(Object.assign(location, { labels }))))
    );
  }
}
