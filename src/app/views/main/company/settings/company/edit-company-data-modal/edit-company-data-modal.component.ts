import { Component, Inject, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { first } from 'rxjs/operators';
import { BehaviorSubject } from 'rxjs';
import { NotificationHelperService } from '@services/helpers/notification-helper/notification-helper.service';
import { FormGroupHelper } from '@services/helpers/utils/form-group-helper';
import { ObjectUtil } from '@services/helpers/utils/object-util';
import { CompaniesService } from '@services/app-layer/companies/companies.service';
import { CompanyDetails } from '@app/services/data-layer/http-api/base-api/swagger-gen';

@Component({
  selector: 'app-edit-company-data-modal',
  templateUrl: './edit-company-data-modal.component.html'
})
export class EditCompanyDataModalComponent implements OnInit {
  public form: FormGroup;

  public readonlyMode$: BehaviorSubject<boolean> = new BehaviorSubject(true);
  public companyData$: BehaviorSubject<CompanyDetails> = new BehaviorSubject(null);

  constructor(
    private notificationHelperService: NotificationHelperService,
    private companiesService: CompaniesService,
    private dialogRef: MatDialogRef<EditCompanyDataModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CompanyDetails
  ) {}

  ngOnInit() {
    this.companyData$.next(this.data);
    this.createForm();
  }

  public edit(): void {
    this.setReadOnlyStatus(false);
  }
  public cancel(): void {
    this.setReadOnlyStatus(true);
  }
  public close(): void {
    this.dialogRef.close(this.data);
  }

  public updateCompany(): void {
    if (this.form.invalid) return FormGroupHelper.markTouchedAndDirty(this.form);
    if (ObjectUtil.isEmptyObject(FormGroupHelper.getDirtyValues(this.form.controls.company)))
      return this.setReadOnlyStatus(true);
    this.companiesService
      .updateUserCompany(this.data.id, FormGroupHelper.getDirtyValues(this.form.controls.company))
      .pipe(first())
      .subscribe(company => {
        this.data = Object.assign(this.data, company);
        this.data.logoUrl = company.logoUrl;
        this.notificationHelperService.showSuccess('CompanyData was successfully updated');
        this.companyData$.next(this.data);
        this.setReadOnlyStatus(true);
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
}
