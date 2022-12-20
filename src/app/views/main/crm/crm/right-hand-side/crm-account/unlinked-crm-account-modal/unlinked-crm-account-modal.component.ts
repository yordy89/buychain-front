import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CrmStateService } from '@views/main/crm/crm/crm-state.service';
import { Subject } from 'rxjs';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { FormGroupHelper } from '@services/helpers/utils/form-group-helper';
import { NotificationHelperService } from '@services/helpers/notification-helper/notification-helper.service';
import { CompaniesService } from '@services/app-layer/companies/companies.service';
import { CompaniesSummary } from '@app/services/data-layer/http-api/base-api/swagger-gen';
import { CrmComponentService } from '@views/main/crm/crm/crm.component.service';
import { CrmAccountEntity } from '@app/services/app-layer/entities/crm';
import { first } from 'rxjs/operators';
import { UserService } from '@services/app-layer/user/user.service';
import { Environment } from '@services/app-layer/app-layer.environment';

@Component({
  selector: 'app-unlinked-crm-account-modal',
  templateUrl: './unlinked-crm-account-modal.component.html',
  styleUrls: ['../../common/unlinked-crm-modal.common.scss', './unlinked-crm-account-modal.component.scss']
})
export class UnlinkedCrmAccountModalComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  public companiesList: CompaniesSummary = [];

  public form: FormGroup;
  public selectedCompany: FormControl;

  public invitationForm: FormGroup;
  public email: FormControl;

  public inviteMode = false;

  constructor(
    public companiesService: CompaniesService,
    private crmComponentService: CrmComponentService,
    private notificationHelperService: NotificationHelperService,
    @Inject(MAT_DIALOG_DATA) public data: CrmAccountEntity,
    private dialogRef: MatDialogRef<UnlinkedCrmAccountModalComponent>,
    private crmStateService: CrmStateService,
    private userService: UserService
  ) {}

  ngOnInit() {
    this.createFormControls();
    this.createForm();
    this.companiesService
      .getCompanyNames()
      .pipe(first())
      .subscribe(companies => {
        this.companiesList = companies.filter(
          unit => !this.crmStateService.entities.some(crm => crm.link && crm.link.id === unit.id)
        );
      });
  }

  public ngOnDestroy(): void {
    this.destroy$.unsubscribe();
  }
  public close(data?: CrmAccountEntity): void {
    this.dialogRef.close(data);
  }
  public linkAccount(): void {
    if (this.form.invalid) return FormGroupHelper.markTouchedAndDirty(this.form);

    this.crmComponentService
      .toggleAccountLink(this.data, this.selectedCompany.value)
      .subscribe(resp => this.close(resp));
  }

  public toggleInvitationMode(isVisible: boolean): void {
    this.inviteMode = isVisible;
  }

  public sendAnInvitation(): void {
    if (this.invitationForm.invalid) return FormGroupHelper.markTouchedAndDirty(this.invitationForm);

    this.userService
      .sendInvitationEmail({
        applicationUrl: Environment.linkToApplicationUi(),
        companyName: Environment.getCurrentCompany().name,
        username: this.email.value
      })
      .pipe()
      .subscribe();
    this.notificationHelperService.showSuccess('An invitation email was successfully sent');
    this.toggleInvitationMode(false);
  }

  /*
   * private helpers
   * */

  private createFormControls(): void {
    this.selectedCompany = new FormControl('', [Validators.required]);
    this.email = new FormControl('', [Validators.email, Validators.required]);
  }
  private createForm(): void {
    this.form = new FormGroup({
      selectedCompany: this.selectedCompany
    });
    this.invitationForm = new FormGroup({
      email: this.email
    });
  }
}
