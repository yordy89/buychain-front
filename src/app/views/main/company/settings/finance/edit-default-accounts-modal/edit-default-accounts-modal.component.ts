import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { AccountEntity } from '@services/app-layer/entities/account';
import { NotificationHelperService } from '@services/helpers/notification-helper/notification-helper.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CompaniesService } from '@services/app-layer/companies/companies.service';
import { FormGroupHelper } from '@services/helpers/utils/form-group-helper';
import { ObjectUtil } from '@services/helpers/utils/object-util';
import { FinanceService } from '@views/main/company/settings/finance/finance.service';
import { first } from 'rxjs/operators';
import {
  CompanyDetails,
  CompanyAccountingPracticesDefaultAccounts
} from '@services/data-layer/http-api/base-api/swagger-gen';
//import { CompanyLib } from '@buychain/lib';

@Component({
  selector: 'app-edit-default-accounts-modal',
  templateUrl: './edit-default-accounts-modal.component.html',
  styleUrls: ['./edit-default-accounts-modal.component.scss']
})
export class EditDefaultAccountsModalComponent implements OnInit {
  form: FormGroup;
  accountsKeyTypeList = [];
  // private readonly defaultAccountRules: { [key: string]: { naturalBalance: string; type: string } } =
  //   CompanyLib.getDefaultAccountsRules();
  private readonly defaultAccountRules: { [key: string]: { naturalBalance: string; type: string } } = {};

  constructor(
    private notificationHelperService: NotificationHelperService,
    private companiesService: CompaniesService,
    private dialogRef: MatDialogRef<EditDefaultAccountsModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { company: CompanyDetails; accounts: AccountEntity[] },
    private fb: FormBuilder,
    private financeService: FinanceService
  ) {}

  ngOnInit() {
    this.accountsKeyTypeList = this.financeService.accountsKeyTypeList;
    this.createForm();
  }

  getOptions(key) {
    const restrictions = this.defaultAccountRules[key];
    return this.data.accounts.filter(
      item => item.type === restrictions.type && item.naturalBalance === restrictions.naturalBalance
    );
  }

  public close(defaultAccounts?: CompanyAccountingPracticesDefaultAccounts): void {
    this.dialogRef.close(defaultAccounts);
  }

  onSave() {
    const payload = FormGroupHelper.getDirtyValues(this.form);
    if (ObjectUtil.isEmptyObject(payload)) {
      return this.close();
    }

    this.companiesService
      .updateCompanyAccountingPracticesDefaultAccounts(this.data.company.id, payload)
      .pipe(first())
      .subscribe(defaultAccounts => {
        this.notificationHelperService.showSuccess('Company Default Accounts were successfully updated');
        this.close(defaultAccounts);
      });
  }

  private createForm(): void {
    const config = {};
    const defaultAccounts = this.data.company.accountingPractices.defaultAccounts || {};

    this.accountsKeyTypeList.forEach(({ key }) => {
      const value = defaultAccounts[key] || null;
      config[key] = [value];
    });
    this.form = this.fb.group(config);
  }
}
