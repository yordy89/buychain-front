import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { CompaniesService } from '@services/app-layer/companies/companies.service';
import { CompaniesSummary } from '@services/data-layer/http-api/base-api/swagger-gen';

@Component({
  selector: 'app-company-join-form',
  templateUrl: './company-join-form.component.html',
  styleUrls: ['./company-join-form.component.scss']
})
export class CompanyJoinFormComponent implements OnInit, OnDestroy {
  @Input() parentForm: FormGroup;
  @Input() companiesList: CompaniesSummary;

  public form: FormGroup;
  public selectedCompany: FormControl;

  constructor(public companiesService: CompaniesService) {}

  ngOnInit() {
    this.companiesList = this.companiesList || [];
    this.createFormControls();
    this.createForm();
    this.extendParentFormGroup(this.parentForm);
  }

  public ngOnDestroy(): void {
    this.removeCurrentFormControl();
  }

  /*
   * Private Methods
   */
  private createFormControls(): void {
    this.selectedCompany = new FormControl('', [Validators.required]);
  }
  private createForm(): void {
    this.form = new FormGroup({
      selectedCompany: this.selectedCompany
    });
  }
  private extendParentFormGroup(parentForm: FormGroup): void {
    parentForm.addControl('selectedData', this.form || new FormGroup({}));
  }
  private removeCurrentFormControl(): void {
    this.parentForm.removeControl('selectedData');
  }
}
