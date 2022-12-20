import { Component, Input, OnDestroy } from '@angular/core';
import { FormGroupHelper } from '@services/helpers/utils/form-group-helper';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { AccessControlScope } from '@services/app-layer/permission/permission.interface';
import { ObjectUtil } from '@services/helpers/utils/object-util';
import { Environment } from '@services/app-layer/app-layer.environment';
import { CrmContactEntity, CrmContactSalesInfoEntity } from '@services/app-layer/entities/crm';
import { CrmComponentService } from '@views/main/crm/crm/crm.component.service';

@Component({
  selector: 'app-crm-contact-sales-info',
  templateUrl: './crm-contact-sales-info.component.html',
  styleUrls: ['../../common/crm-sales-info.common.scss']
})
export class CrmContactSalesInfoComponent implements OnDestroy {
  private _crmContactData: CrmContactEntity;
  @Input() get crmContactData(): CrmContactEntity {
    return this._crmContactData;
  }
  set crmContactData(value: CrmContactEntity) {
    this._crmContactData = value;
    if (value) {
      this.setUserPermissions(value.crmAccount);
      this.setSalesInfo();
    }
  }

  public salesForm: FormGroup;
  public preferredContactMethod: FormControl;
  public notes: FormControl;
  public crmPermissions: any;

  public readonlyMode = true;

  salesInfo: CrmContactSalesInfoEntity = null;

  private destroy$ = new Subject<void>();

  constructor(private crmComponentService: CrmComponentService) {
    this.createFormControls();
    this.createForm();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  public edit(): void {
    this.readonlyMode = false;
    this.setInitialData(this.salesInfo);
  }
  public cancel(): void {
    this.readonlyMode = true;
  }

  public updateContactSalesInfo(): void {
    if (this.salesForm.invalid) {
      return FormGroupHelper.markTouchedAndDirty(this.salesForm);
    }
    if (ObjectUtil.isEmptyObject(FormGroupHelper.getDirtyValues(this.salesForm))) {
      this.readonlyMode = true;
      return;
    }
    this.crmComponentService
      .updateContactSalesInfo(this.crmContactData, FormGroupHelper.getDirtyValues(this.salesForm))
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        this.salesInfo = data;
        this.readonlyMode = true;
        FormGroupHelper.markUntouchedAndPristine(this.salesForm);
      });
  }

  private createFormControls(): void {
    this.notes = new FormControl(null, [Validators.maxLength(2500)]);
    this.preferredContactMethod = new FormControl(null, [Validators.maxLength(100)]);
  }
  private createForm(): void {
    this.salesForm = new FormGroup({
      notes: this.notes,
      preferredContactMethod: this.preferredContactMethod
    });
  }
  private setInitialData(salesInitialInfo: CrmContactSalesInfoEntity): void {
    if (salesInitialInfo) {
      this.notes.setValue(salesInitialInfo.notes);
      this.preferredContactMethod.setValue(salesInitialInfo.preferredContactMethod);
    }
  }

  private setUserPermissions(account): void {
    const user = Environment.getCurrentUser();
    this.crmPermissions = {
      canRead:
        user.normalizedAccessControlRoles.CRM_ACCOUNT.CRMSection.sectionGroup.readSalesInfo.value ===
          AccessControlScope.Company ||
        (user.normalizedAccessControlRoles.CRM_ACCOUNT.CRMSection.sectionGroup.readSalesInfo.value ===
          AccessControlScope.Owner &&
          account.salesTeam.some(seller => seller === user.id)),
      canUpdate:
        user.normalizedAccessControlRoles.CRM_ACCOUNT.CRMSection.sectionGroup.updateSalesInfo.value ===
          AccessControlScope.Company ||
        (user.normalizedAccessControlRoles.CRM_ACCOUNT.CRMSection.sectionGroup.updateSalesInfo.value ===
          AccessControlScope.Owner &&
          account.salesTeam.some(seller => seller === user.id))
    };
  }

  private setSalesInfo(): void {
    if (!this.crmPermissions.canRead) {
      return;
    }

    this.crmComponentService
      .getContactSalesInfo(this.crmContactData)
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        this.salesInfo = data;
        this.setInitialData(data);
      });
  }
}
