import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { NotificationHelperService } from '@services/helpers/notification-helper/notification-helper.service';
import { CompaniesService } from '@services/app-layer/companies/companies.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CompanyDetails, CompanySalesPractices } from '@app/services/data-layer/http-api/base-api/swagger-gen';
import { FormGroupHelper } from '@services/helpers/utils/form-group-helper';
import { ObjectUtil } from '@services/helpers/utils/object-util';
import { first } from 'rxjs/operators';
import { SelectionCriteriaEnum, TooltipTextEnum } from '@services/app-layer/app-layer.enums';

@Component({
  selector: 'app-edit-sales-practices-modal',
  templateUrl: './edit-sales-practices-modal.component.html'
})
export class EditSalesPracticesModalComponent implements OnInit {
  public form: FormGroup;

  public selectionCriteria: FormControl;

  public selectionCriteriaOptions = ObjectUtil.enumToKeyValueArray(SelectionCriteriaEnum);

  public salesPractices: CompanySalesPractices;

  readonly tooltipTextEnum = TooltipTextEnum;

  constructor(
    private notificationHelperService: NotificationHelperService,
    private companiesService: CompaniesService,
    private dialogRef: MatDialogRef<EditSalesPracticesModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CompanyDetails
  ) {}

  ngOnInit() {
    this.salesPractices = this.data.salesPractices;
    this.createFormControls();
    this.createForm();
  }

  public close(company?: CompanyDetails): void {
    this.dialogRef.close(company);
  }

  public updateSalesPractices(): void {
    if (this.form.invalid) return FormGroupHelper.markTouchedAndDirty(this.form);
    if (ObjectUtil.isEmptyObject(FormGroupHelper.getDirtyValues(this.form))) return this.close();
    this.companiesService
      .updateCompanySalesPractices(this.data.id, FormGroupHelper.getDirtyValues(this.form))
      .pipe(first())
      .subscribe(salesPractices => {
        this.notificationHelperService.showSuccess('Company Sales practices were successfully updated');
        this.data.salesPractices = salesPractices;
        this.close(this.data);
      });
  }

  /*
   * private helpers
   * */

  private createFormControls(): void {
    this.selectionCriteria = new FormControl(this.salesPractices.selectionCriteria);
  }
  private createForm(): void {
    this.form = new FormGroup({
      selectionCriteria: this.selectionCriteria
    });
  }
}
