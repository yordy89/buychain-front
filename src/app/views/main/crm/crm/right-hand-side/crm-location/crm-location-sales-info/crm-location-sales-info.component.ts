import { Component, Input, OnDestroy } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { FormGroupHelper } from '@services/helpers/utils/form-group-helper';
import { AccessControlScope } from '@services/app-layer/permission/permission.interface';
import { ObjectUtil } from '@services/helpers/utils/object-util';
import { Environment } from '@services/app-layer/app-layer.environment';
import { CrmComponentService } from '@views/main/crm/crm/crm.component.service';
import { CrmLocationEntity, CrmLocationSalesInfoEntity } from '@services/app-layer/entities/crm';

@Component({
  selector: 'app-crm-location-sales-info',
  templateUrl: './crm-location-sales-info.component.html',
  styleUrls: ['../../common/crm-sales-info.common.scss']
})
export class CrmLocationSalesInfoComponent implements OnDestroy {
  private _crmLocationData: CrmLocationEntity;
  @Input() get crmLocationData(): CrmLocationEntity {
    return this._crmLocationData;
  }
  set crmLocationData(value: CrmLocationEntity) {
    this._crmLocationData = value;
    if (value) {
      this.setUserPermissions(value.crmAccount);
      this.setSalesInfo();
    }
  }

  public salesForm: FormGroup;
  public notes: FormControl;
  public crmPermissions: any;

  public readonlyMode = true;

  salesInfo: CrmLocationSalesInfoEntity = null;

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

  public updateLocationSalesInfo(): void {
    if (this.salesForm.invalid) {
      return FormGroupHelper.markTouchedAndDirty(this.salesForm);
    }
    if (ObjectUtil.isEmptyObject(FormGroupHelper.getDirtyValues(this.salesForm))) {
      this.readonlyMode = true;
      return;
    }
    this.crmComponentService
      .updateLocationSalesInfo(this.crmLocationData, FormGroupHelper.getDirtyValues(this.salesForm))
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        this.salesInfo = data;
        this.readonlyMode = true;
        FormGroupHelper.markUntouchedAndPristine(this.salesForm);
      });
  }

  private createFormControls(): void {
    this.notes = new FormControl('', [Validators.required, Validators.maxLength(2500)]);
  }
  private createForm(): void {
    this.salesForm = new FormGroup({
      notes: this.notes
    });
  }
  private setInitialData(salesInitialInfo: CrmLocationSalesInfoEntity): void {
    if (salesInitialInfo) this.notes.setValue(salesInitialInfo.notes);
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
      .getLocationSalesInfo(this.crmLocationData)
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        this.salesInfo = data;
        this.setInitialData(data);
      });
  }
}
