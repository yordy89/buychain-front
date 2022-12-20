import { Component, Input } from '@angular/core';
import { CrmStateService } from '@views/main/crm/crm/crm-state.service';
import { BehaviorSubject, EMPTY } from 'rxjs';
import { FormGroup } from '@angular/forms';
import { FormGroupHelper } from '@services/helpers/utils/form-group-helper';
import { catchError, first } from 'rxjs/operators';
import { NotificationHelperService } from '@services/helpers/notification-helper/notification-helper.service';
import { AccessControlScope } from '@services/app-layer/permission/permission.interface';
import { MatDialog } from '@angular/material/dialog';
import { LinkedCrmContactModalComponent } from '@views/main/crm/crm/right-hand-side/crm-contact/linked-crm-contact-modal/linked-crm-contact-modal.component';
import { UnlinkedCrmContactModalComponent } from '@views/main/crm/crm/right-hand-side/crm-contact/unlinked-crm-contact-modal/unlinked-crm-contact-modal.component';
import { ObjectUtil } from '@services/helpers/utils/object-util';
import { Environment } from '@services/app-layer/app-layer.environment';
import { CrmAccountEntity, CrmContactEntity } from '@services/app-layer/entities/crm';
import { CrmComponentService } from '@views/main/crm/crm/crm.component.service';
import { CrmTypeEnum, LabelKey, LabelGroupName } from '@services/app-layer/app-layer.enums';

@Component({
  selector: 'app-crm-contact',
  templateUrl: './crm-contact.component.html',
  styleUrls: ['../common/right-hand-side.common.scss', './crm-contact.component.scss']
})
export class CrmContactComponent {
  public crmAccountData$: BehaviorSubject<CrmAccountEntity> = new BehaviorSubject<CrmAccountEntity>(null);
  private _crmAccountData: CrmAccountEntity;
  @Input() get crmAccountData(): CrmAccountEntity {
    return this._crmAccountData;
  }
  set crmAccountData(value: CrmAccountEntity) {
    this._crmAccountData = value;
    this.crmAccountData$.next(value);
    if (value) this.setUserPermissions();
  }
  public crmContactData$: BehaviorSubject<CrmContactEntity> = new BehaviorSubject<CrmContactEntity>(null);
  private _crmContactData: CrmContactEntity;
  @Input() get crmContactData(): CrmContactEntity {
    return this._crmContactData;
  }
  set crmContactData(value: CrmContactEntity) {
    this._crmContactData = value;
    this.crmContactData$.next(value);
    if (!value) this.setReadOnlyStatus(false);
  }

  public crmPermissions: any;
  public LabelKey = LabelKey;
  public CRMType = CrmTypeEnum;
  public LabelGroupName = LabelGroupName;
  public isOnlyOffline = Environment.isOnlyOffline();

  public readonlyMode$: BehaviorSubject<boolean> = new BehaviorSubject(true);
  public form: FormGroup;

  constructor(
    private notificationHelperService: NotificationHelperService,
    private crmComponentService: CrmComponentService,
    private dialog: MatDialog,
    public crmStateService: CrmStateService
  ) {
    this.createForm();
  }

  public edit(): void {
    this.setReadOnlyStatus(false);
  }
  public cancel(): void {
    if (this.crmContactData) this.setReadOnlyStatus(true);
    else this.close();
  }
  public close(): void {
    this.crmStateService.setActiveEntity(this.crmAccountData);
  }

  public async createUpdateCRMContact() {
    if (this.form.invalid) return FormGroupHelper.markTouchedAndDirty(this.form);

    const payload = FormGroupHelper.getChangedValues(this.form.value.profile, this.crmContactData);
    Object.keys(payload).forEach(key => (payload[key] = payload[key] || null));

    if (this.crmContactData) {
      this.updateCrmContact(payload);
    } else {
      Object.keys(payload).forEach(key => payload[key] || delete payload[key]);
      this.createCrmContact(payload);
    }
  }

  private updateCrmContact(payload) {
    if (ObjectUtil.isEmptyObject(payload)) {
      this.setReadOnlyStatus(true);
      return;
    }

    this.crmComponentService
      .updateContact(this.crmContactData, payload)
      .pipe(
        first(),
        catchError(error => {
          this.showErrorMessage(error);
          return EMPTY;
        })
      )
      .subscribe(data => {
        data.labels = this.crmContactData.labels;
        this.crmStateService.updateActiveContact(data);
        this.notificationHelperService.showSuccess('CRM Contact was successfully updated');
        FormGroupHelper.markUntouchedAndPristine(this.form);
        this.setReadOnlyStatus(true);
      });
  }

  private createCrmContact(payload) {
    this.crmComponentService
      .createContact(this.crmAccountData, payload)
      .pipe(
        first(),
        catchError(error => {
          this.showErrorMessage(error);
          return EMPTY;
        })
      )
      .subscribe(data => {
        this.crmStateService.addContact(data);
        this.crmStateService.setActiveEntity(data);
        FormGroupHelper.markUntouchedAndPristine(this.form);
        this.setReadOnlyStatus(true);
      });
  }

  private showErrorMessage(error) {
    const errorMessage = error?.error?.message;
    if (errorMessage.startsWith('"body.username')) {
      this.notificationHelperService.showValidation('Email is not valid');
    }
  }

  public openLinkedCrmContactModal(contact?: CrmContactEntity): void {
    this.dialog
      .open(LinkedCrmContactModalComponent, {
        width: '648px',
        disableClose: true,
        data: contact || this.crmContactData
      })
      .afterClosed()
      .subscribe(data => {
        if (data) {
          this.crmStateService.updateActiveContact(data);
        }
      });
  }
  public openUnlinkedCrmContactModal(): void {
    this.dialog
      .open(UnlinkedCrmContactModalComponent, {
        width: '648px',
        disableClose: true,
        data: this.crmContactData
      })
      .afterClosed()
      .subscribe(contact => {
        if (contact) {
          this.crmStateService.updateActiveContact(contact);
          this.openLinkedCrmContactModal(contact);
        }
      });
  }

  /*
   * private helpers
   * */

  private createForm(): void {
    this.form = new FormGroup({});
  }
  private setReadOnlyStatus(value: boolean): void {
    this.readonlyMode$.next(value);
  }

  private setUserPermissions(): void {
    const user = Environment.getCurrentUser();
    this.crmPermissions = {
      canReadSalesInfo:
        user.normalizedAccessControlRoles.CRM_ACCOUNT.CRMSection.sectionGroup.readSalesInfo.value ===
          AccessControlScope.Company ||
        (user.normalizedAccessControlRoles.CRM_ACCOUNT.CRMSection.sectionGroup.readSalesInfo.value ===
          AccessControlScope.Owner &&
          this.crmAccountData.salesTeam.some(seller => seller === user.id)),
      canUpdate:
        user.normalizedAccessControlRoles.CRM_ACCOUNT.CRMSection.sectionGroup.updateEntry.value ===
          AccessControlScope.Company ||
        (user.normalizedAccessControlRoles.CRM_ACCOUNT.CRMSection.sectionGroup.updateEntry.value ===
          AccessControlScope.Owner &&
          this.crmAccountData.salesTeam.some(seller => seller === user.id))
    };
  }
}
