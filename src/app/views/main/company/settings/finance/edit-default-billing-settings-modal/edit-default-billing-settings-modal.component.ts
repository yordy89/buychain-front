import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { FacilityEntity } from '@app/services/app-layer/entities/facility';
import { MemberEntity } from '@app/services/app-layer/entities/member';
import { FacilitiesService } from '@app/services/app-layer/facilities/facilities.service';
import { CompaniesService } from '@app/services/app-layer/companies/companies.service';
import { FormControl, FormGroup } from '@angular/forms';
import { Environment } from '@app/services/app-layer/app-layer.environment';
import { CompanyDetails } from '@app/services/data-layer/http-api/base-api/swagger-gen';
import { FormGroupHelper } from '@app/services/helpers/utils/form-group-helper';
import { ObjectUtil } from '@services/helpers/utils/object-util';

@Component({
  selector: 'app-edit-default-billing-settings',
  templateUrl: './edit-default-billing-settings-modal.component.html'
})
export class EditDefaultBillingSettingsModalComponent implements OnInit {
  public company: CompanyDetails;

  public facilities: FacilityEntity[];
  public members: MemberEntity[];

  public facilityFormControl = new FormControl();
  public memberFormControl = new FormControl();
  public form = new FormGroup({
    defaultBillToContact: this.memberFormControl,
    defaultBillToLocation: this.facilityFormControl
  });

  constructor(
    private dialogRef: MatDialogRef<EditDefaultBillingSettingsModalComponent>,
    private facilitiesService: FacilitiesService,
    private companyService: CompaniesService
  ) {
    this.company = Environment.getCurrentCompany();
  }

  ngOnInit() {
    this.loadFacilities();
    this.loadMembers();
  }

  save() {
    if (this.form.invalid) return FormGroupHelper.markTouchedAndDirty(this.form);
    const changes = FormGroupHelper.getChangedValues(this.form.value, this.company.accountingPractices);
    if (ObjectUtil.isEmptyObject(changes)) return this.close();

    this.companyService.updateCompanyAccountingPractices(this.company.id, changes).subscribe(accountingPractice => {
      Environment.currentCompany.accountingPractices = accountingPractice;
      this.dialogRef.close(Environment.currentCompany);
    });
  }

  resetControl(e: Event, control: FormControl): void {
    e.stopPropagation();
    control.reset(null);
  }

  close() {
    this.dialogRef.close();
  }

  /*
   * private helpers
   * */

  private loadFacilities(): void {
    this.facilitiesService.getCompanyFacilities(Environment.getCurrentUser().companyId).subscribe(facilities => {
      this.facilities = facilities;
      this.facilityFormControl.setValue(this.company.accountingPractices.defaultBillToLocation);
    });
  }

  private loadMembers(): void {
    this.companyService.getCompanyCompleteMembers().subscribe(members => {
      this.members = members;
      this.memberFormControl.setValue(this.company.accountingPractices.defaultBillToContact);
    });
  }
}
