import { Component, Input, OnDestroy } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { FormGroupHelper } from '@services/helpers/utils/form-group-helper';
import { AccessControlScope } from '@services/app-layer/permission/permission.interface';
import { ObjectUtil } from '@services/helpers/utils/object-util';
import { Environment } from '@services/app-layer/app-layer.environment';
import { CrmAccountEntity, CrmAccountSalesInfoEntity } from '@services/app-layer/entities/crm';
import { CrmComponentService } from '@views/main/crm/crm/crm.component.service';

@Component({
  selector: 'app-crm-account-sales-info',
  templateUrl: './crm-account-sales-info.component.html',
  styleUrls: ['../../common/crm-sales-info.common.scss']
})
export class CrmAccountSalesInfoComponent implements OnDestroy {
  private _crmAccountData: CrmAccountEntity;
  @Input() get crmAccountData(): CrmAccountEntity {
    return this._crmAccountData;
  }
  set crmAccountData(value: CrmAccountEntity) {
    if (!value) return;
    this._crmAccountData = value;
    this.readonlyMode = true;
    this.setUserPermissions();
    this.loadSalesInfo();
  }

  public salesForm: FormGroup;
  public notes: FormControl;

  public readonlyMode = true;
  public crmPermissions: any;

  salesInfo: CrmAccountSalesInfoEntity = null;

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
    FormGroupHelper.markUntouchedAndPristine(this.salesForm);
  }

  public updateCRMAccountSalesInfo(): void {
    if (this.salesForm.invalid) {
      return FormGroupHelper.markTouchedAndDirty(this.salesForm);
    }
    if (ObjectUtil.isEmptyObject(FormGroupHelper.getDirtyValues(this.salesForm))) {
      this.readonlyMode = true;
      return;
    }
    this.crmComponentService
      .updateAccountSalesInfo(this.crmAccountData, FormGroupHelper.getDirtyValues(this.salesForm))
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        this.salesInfo = data;
        this.readonlyMode = true;
        FormGroupHelper.markUntouchedAndPristine(this.salesForm);
      });
  }

  /*
   * private helpers
   * */

  private createFormControls(): void {
    this.notes = new FormControl(null, Validators.maxLength(2500));
  }
  private createForm(): void {
    this.salesForm = new FormGroup({
      notes: this.notes
    });
  }
  private setInitialData(salesInitialInfo: CrmAccountSalesInfoEntity): void {
    if (salesInitialInfo) this.notes.setValue(salesInitialInfo.notes);
  }

  private setUserPermissions(): void {
    const user = Environment.getCurrentUser();
    this.crmPermissions = {
      canRead:
        user.normalizedAccessControlRoles.CRM_ACCOUNT.CRMSection.sectionGroup.readSalesInfo.value ===
          AccessControlScope.Company ||
        (user.normalizedAccessControlRoles.CRM_ACCOUNT.CRMSection.sectionGroup.readSalesInfo.value ===
          AccessControlScope.Owner &&
          this.crmAccountData.salesTeam.some(seller => seller === user.id)),
      canUpdate:
        user.normalizedAccessControlRoles.CRM_ACCOUNT.CRMSection.sectionGroup.updateSalesInfo.value ===
          AccessControlScope.Company ||
        (user.normalizedAccessControlRoles.CRM_ACCOUNT.CRMSection.sectionGroup.updateSalesInfo.value ===
          AccessControlScope.Owner &&
          this.crmAccountData.salesTeam.some(seller => seller === user.id))
    };
  }

  private loadSalesInfo(): void {
    if (!this.crmPermissions.canRead) {
      return;
    }
    this.crmComponentService
      .getAccountSalesInfo(this.crmAccountData)
      .pipe(takeUntil(this.destroy$))
      .subscribe(resp => {
        this.salesInfo = resp;
        this.setInitialData(resp);
      });
  }
}
