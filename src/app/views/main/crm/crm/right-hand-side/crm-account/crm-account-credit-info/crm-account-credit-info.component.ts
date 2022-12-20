import { Component, Input, OnDestroy } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { FormGroupHelper } from '@services/helpers/utils/form-group-helper';
import { AccessControlScope } from '@services/app-layer/permission/permission.interface';
import { ObjectUtil } from '@services/helpers/utils/object-util';
import { Environment } from '@services/app-layer/app-layer.environment';
import { TransactionsService } from '@services/app-layer/transactions/transactions.service';
import { CrmAccountCreditInfoEntity, CrmAccountEntity } from '@services/app-layer/entities/crm';
import { CrmComponentService } from '@views/main/crm/crm/crm.component.service';
import { TransactionStateEnum } from '@services/app-layer/app-layer.enums';
import { NotificationHelperService } from '@services/helpers/notification-helper/notification-helper.service';
import { SearchService } from '@services/app-layer/search/search.service';
import { TransactionEntity } from '@services/app-layer/entities/transaction';

@Component({
  selector: 'app-crm-account-credit-info',
  templateUrl: './crm-account-credit-info.component.html',
  styleUrls: ['./crm-account-credit-info.component.scss']
})
export class CrmAccountCreditInfoComponent implements OnDestroy {
  private _crmAccountData: CrmAccountEntity;
  @Input() get crmAccountData(): CrmAccountEntity {
    return this._crmAccountData;
  }
  set crmAccountData(value: CrmAccountEntity) {
    if (!value) return;
    this._crmAccountData = value;
    this.readonlyMode = true;
    this.setUserPermissions();
    this.setCreditInfo();
  }

  public creditForm: FormGroup;
  public maxCredit: FormControl;
  public creditTerms: FormControl;

  public usedCredit: number;

  public readonlyMode = true;
  public crmPermissions: any;

  creditInfo: CrmAccountCreditInfoEntity;

  private destroy$ = new Subject<void>();

  constructor(
    private crmComponentService: CrmComponentService,
    private transactionsService: TransactionsService,
    private searchService: SearchService,
    private notificationHelperService: NotificationHelperService
  ) {
    this.createCreditInfoFormControls();
    this.createCreditInfoForm();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  public edit(): void {
    this.readonlyMode = false;
    this.setInitialData(this.creditInfo);
  }
  public cancel(): void {
    this.readonlyMode = true;
  }
  public updateCRMAccountCreditInfo(): void {
    if (this.creditForm.invalid) {
      return FormGroupHelper.markTouchedAndDirty(this.creditForm);
    }
    if (this.maxCredit.dirty && !this.maxCredit.value) {
      return this.notificationHelperService.showValidation('Please provide a valid number for max credit');
    }
    if (ObjectUtil.isEmptyObject(FormGroupHelper.getDirtyValues(this.creditForm))) {
      this.readonlyMode = true;
      return;
    }
    this.crmComponentService
      .updateAccountCreditInfo(this.crmAccountData, FormGroupHelper.getDirtyValues(this.creditForm))
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        this.creditInfo = data;
        this.readonlyMode = true;
        FormGroupHelper.markUntouchedAndPristine(this.creditForm);
      });
  }

  /*
   * private helpers
   * */

  private createCreditInfoFormControls(): void {
    this.maxCredit = new FormControl(0, [
      Validators.required,
      Validators.min(0),
      Validators.max(Environment.maxSafeNumber)
    ]);
    this.creditTerms = new FormControl(null, [Validators.maxLength(2500)]);
  }
  private createCreditInfoForm(): void {
    this.creditForm = new FormGroup({
      maxCredit: this.maxCredit,
      creditTerms: this.creditTerms
    });
  }

  private setInitialData(creditInitialData: CrmAccountCreditInfoEntity): void {
    this.maxCredit.setValue(creditInitialData.maxCredit);
    this.creditTerms.setValue(creditInitialData.creditTerms);

    this.searchService
      .fetchTransactionData(this.getCrmOutstandingTxsSearchPayload())
      .subscribe(
        crmOutstandingTxs =>
          (this.usedCredit = crmOutstandingTxs
            .map(t => new TransactionEntity().init(t))
            .reduce((acc, cur) => acc + cur.totalPrice - cur.costData.cogSubtotal, 0))
      );
  }

  private setUserPermissions(): void {
    const user = Environment.getCurrentUser();
    this.crmPermissions = {
      canRead:
        user.normalizedAccessControlRoles.CRM_ACCOUNT.CRMSection.sectionGroup.readCreditInfo.value ===
          AccessControlScope.Company ||
        (user.normalizedAccessControlRoles.CRM_ACCOUNT.CRMSection.sectionGroup.readCreditInfo.value ===
          AccessControlScope.Owner &&
          this.crmAccountData.salesTeam.some(seller => seller === user.id)),
      canUpdate:
        user.normalizedAccessControlRoles.CRM_ACCOUNT.CRMSection.sectionGroup.updateCreditInfo.value ===
          AccessControlScope.Company ||
        (user.normalizedAccessControlRoles.CRM_ACCOUNT.CRMSection.sectionGroup.updateCreditInfo.value ===
          AccessControlScope.Owner &&
          this.crmAccountData.salesTeam.some(seller => seller === user.id))
    };
  }

  private setCreditInfo(): void {
    if (!this.crmPermissions.canRead) {
      return;
    }

    this.crmComponentService
      .getAccountCreditInfo(this.crmAccountData)
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        this.creditInfo = data;
        this.setInitialData(this.creditInfo);
      });
  }

  private getCrmOutstandingTxsSearchPayload(): any {
    const statesPayload = {
      children: {
        logicalOperator: 'or',
        items: [
          { value: { comparisonOperator: 'eq', field: 'state', fieldValue: TransactionStateEnum.InTransit } },
          { value: { comparisonOperator: 'eq', field: 'state', fieldValue: TransactionStateEnum.Confirmed } },
          { value: { comparisonOperator: 'eq', field: 'state', fieldValue: TransactionStateEnum.ChangePending } }
        ]
      }
    };
    const vendorPayload = {
      value: { field: 'vendorOnline', comparisonOperator: 'eq', fieldValue: Environment.getCurrentCompany().id }
    };
    const customerPayload = {
      value: { field: 'customerCrm', comparisonOperator: 'eq', fieldValue: this.crmAccountData.id }
    };

    return {
      filters: {
        children: {
          logicalOperator: 'and',
          items: [vendorPayload, customerPayload, statesPayload]
        }
      },
      fields: ['tally', 'trackingData', 'costData', 'state', 'register']
    };
  }
}
