import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { NotificationHelperService } from '@services/helpers/notification-helper/notification-helper.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CompaniesService } from '@services/app-layer/companies/companies.service';
import { FormGroupHelper } from '@services/helpers/utils/form-group-helper';
import { ObjectUtil } from '@services/helpers/utils/object-util';
import { first } from 'rxjs/operators';
import { CompanyDetails, CompanyAccountingPractices } from '@services/data-layer/http-api/base-api/swagger-gen';
import {
  FiscalYearStartEnum,
  InventoryManagementSystemEnum,
  RevenueRecognitionMethodEnum,
  AutoInvoiceGenerationEnum,
  TooltipTextEnum
} from '@services/app-layer/app-layer.enums';

@Component({
  selector: 'app-edit-accounting-practices-modal',
  templateUrl: './edit-accounting-practices-modal.component.html'
})
export class EditAccountingPracticesModalComponent implements OnInit {
  public form: FormGroup;

  public accountingPractices: CompanyAccountingPractices;
  public inventoryMgmtSystemOptions = ObjectUtil.enumToKeyValueArray(InventoryManagementSystemEnum);
  public fiscalYearStartOptions = ObjectUtil.enumToKeyValueArray(FiscalYearStartEnum);
  public revenueRecognitionMethodOptions = ObjectUtil.enumToKeyValueArray(RevenueRecognitionMethodEnum);
  public autoInvoicingMethodOptions = ObjectUtil.enumToKeyValueArray(AutoInvoiceGenerationEnum);

  public inventoryMgmtSystem: FormControl;
  public fiscalYearStart: FormControl;
  public revenueRecognitionMethod: FormControl;
  public autoInvoicingMethod: FormControl;
  readonly tooltipTextEnum = TooltipTextEnum;

  constructor(
    private notificationHelperService: NotificationHelperService,
    private companiesService: CompaniesService,
    private dialogRef: MatDialogRef<EditAccountingPracticesModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CompanyDetails
  ) {}

  ngOnInit() {
    this.accountingPractices = this.data.accountingPractices;
    this.createFormControls();
    this.createForm();
  }

  public close(company?: CompanyDetails): void {
    this.dialogRef.close(company);
  }

  public updateAccountingPractices(): void {
    if (this.form.invalid) return FormGroupHelper.markTouchedAndDirty(this.form);
    if (ObjectUtil.isEmptyObject(FormGroupHelper.getDirtyValues(this.form))) return this.close();
    this.companiesService
      .updateCompanyAccountingPractices(this.data.id, FormGroupHelper.getDirtyValues(this.form))
      .pipe(first())
      .subscribe(accountingPractices => {
        this.notificationHelperService.showSuccess('Company Accounting practices were successfully updated');
        this.data.accountingPractices = accountingPractices;
        this.close(this.data);
      });
  }

  /*
   * private helpers
   * */

  private createFormControls(): void {
    this.inventoryMgmtSystem = new FormControl(this.accountingPractices.inventoryMgmtSystem);
    this.fiscalYearStart = new FormControl(this.accountingPractices.fiscalYearStart);
    this.revenueRecognitionMethod = new FormControl(this.accountingPractices.revenueRecognitionMethod);
    this.autoInvoicingMethod = new FormControl(this.accountingPractices.autoInvoicingMethod);
  }

  private createForm(): void {
    this.form = new FormGroup({
      inventoryMgmtSystem: this.inventoryMgmtSystem,
      fiscalYearStart: this.fiscalYearStart,
      revenueRecognitionMethod: this.revenueRecognitionMethod,
      autoInvoicingMethod: this.autoInvoicingMethod
    });
  }
}
