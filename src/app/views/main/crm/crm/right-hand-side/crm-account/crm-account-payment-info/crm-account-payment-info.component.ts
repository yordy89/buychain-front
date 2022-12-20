import { Component, Input, OnDestroy } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { FormGroupHelper } from '@services/helpers/utils/form-group-helper';
import { AccessControlScope } from '@services/app-layer/permission/permission.interface';
import { ObjectUtil } from '@services/helpers/utils/object-util';
import { Environment } from '@services/app-layer/app-layer.environment';
import { TransactionsService } from '@services/app-layer/transactions/transactions.service';
import { CrmAccountEntity, CrmAccountPaymentInfoEntity } from '@services/app-layer/entities/crm';
import { CrmComponentService } from '@views/main/crm/crm/crm.component.service';
import { NotificationHelperService } from '@services/helpers/notification-helper/notification-helper.service';
import { SearchService } from '@services/app-layer/search/search.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-crm-account-payment-info',
  templateUrl: './crm-account-payment-info.component.html',
  styleUrls: ['./crm-account-payment-info.component.scss']
})
export class CrmAccountPaymentInfoComponent implements OnDestroy {
  private _crmAccountData: CrmAccountEntity;
  @Input() get crmAccountData(): CrmAccountEntity {
    return this._crmAccountData;
  }
  set crmAccountData(value: CrmAccountEntity) {
    if (!value) return;
    this._crmAccountData = value;
    this.readonlyMode = true;
    this.setUserPermissions();
    this.setPaymentInfo();
  }

  public paymentForm: FormGroup;
  public paymentTerms: FormControl;

  paymentInfo: CrmAccountPaymentInfoEntity;

  public readonlyMode = true;
  public crmPermissions: any;

  private destroy$ = new Subject<void>();

  constructor(
    private crmComponentService: CrmComponentService,
    private transactionsService: TransactionsService,
    private searchService: SearchService,
    private notificationHelperService: NotificationHelperService,
    private fb: FormBuilder
  ) {
    this.createForm();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  public edit(): void {
    this.readonlyMode = false;
    this.setInitialData();
  }

  public cancel(): void {
    this.readonlyMode = true;
  }

  public updateCRMAccountPaymentTerms(): void {
    if (this.paymentForm.invalid) {
      return FormGroupHelper.markTouchedAndDirty(this.paymentForm);
    }

    if (ObjectUtil.isEmptyObject(FormGroupHelper.getDirtyValues(this.paymentForm))) {
      this.readonlyMode = true;
      return;
    }
    this.crmComponentService
      .updateAccountPaymentInfo(this.crmAccountData, FormGroupHelper.getDirtyValues(this.paymentForm))
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        this.paymentInfo = data;
        this.readonlyMode = true;
        FormGroupHelper.markUntouchedAndPristine(this.paymentForm);
      });
  }

  private createForm(): void {
    this.paymentTerms = new FormControl(null, [Validators.maxLength(2500)]);
    this.paymentForm = this.fb.group({
      paymentTerms: this.paymentTerms
    });
  }

  private setInitialData(): void {
    this.paymentTerms.setValue(this.paymentInfo.paymentTerms);
  }

  private setUserPermissions(): void {
    const user = Environment.getCurrentUser();
    this.crmPermissions = {
      canRead:
        user.normalizedAccessControlRoles.CRM_ACCOUNT.CRMSection.sectionGroup.readPaymentInfo.value ===
          AccessControlScope.Company ||
        (user.normalizedAccessControlRoles.CRM_ACCOUNT.CRMSection.sectionGroup.readPaymentInfo.value ===
          AccessControlScope.Owner &&
          this.crmAccountData.salesTeam.some(seller => seller === user.id)),
      canUpdate:
        user.normalizedAccessControlRoles.CRM_ACCOUNT.CRMSection.sectionGroup.updatePaymentInfo.value ===
          AccessControlScope.Company ||
        (user.normalizedAccessControlRoles.CRM_ACCOUNT.CRMSection.sectionGroup.updatePaymentInfo.value ===
          AccessControlScope.Owner &&
          this.crmAccountData.salesTeam.some(seller => seller === user.id))
    };
  }

  private setPaymentInfo(): void {
    if (!this.crmPermissions.canRead) {
      return;
    }

    this.crmComponentService
      .getAccountPaymentInfo(this.crmAccountData)
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        this.paymentInfo = data;
        this.setInitialData();
      });
  }
}
