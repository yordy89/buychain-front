import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CrmStateService } from '@views/main/crm/crm/crm-state.service';
import { Subject } from 'rxjs';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { FormGroupHelper } from '@services/helpers/utils/form-group-helper';
import { first } from 'rxjs/operators';
import { CompaniesService } from '@services/app-layer/companies/companies.service';
import { MemberSummaryEntity } from '@services/app-layer/entities/member';
import { CrmContactEntity } from '@app/services/app-layer/entities/crm';
import { CrmComponentService } from '@views/main/crm/crm/crm.component.service';

@Component({
  selector: 'app-unlinked-crm-contact-modal',
  templateUrl: './unlinked-crm-contact-modal.component.html',
  styleUrls: ['../../common/unlinked-crm-modal.common.scss']
})
export class UnlinkedCrmContactModalComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  public form: FormGroup;
  public selectedContact: FormControl;

  public contactsList: MemberSummaryEntity[];
  public contactsFilteredList: MemberSummaryEntity[];

  constructor(
    private crmComponentService: CrmComponentService,
    private companiesService: CompaniesService,
    @Inject(MAT_DIALOG_DATA) public contact: CrmContactEntity,
    private dialogRef: MatDialogRef<UnlinkedCrmContactModalComponent>,
    private crmStateService: CrmStateService
  ) {}

  ngOnInit() {
    this.createFormControls();
    this.createForm();
    this.companiesService
      .getCompanyMembersSummary(this.contact.crmAccount.link.id)
      .pipe(first())
      .subscribe(membersList => {
        this.contactsList = membersList;
        this.contactsFilteredList = this.contactsList.filter(
          member => !this.crmStateService.crmContacts.some(crmUnit => crmUnit.link && crmUnit.link.id === member.id)
        );
      });
  }

  public ngOnDestroy(): void {
    this.destroy$.unsubscribe();
  }
  close(entity?: CrmContactEntity): void {
    this.dialogRef.close(entity);
  }

  public linkContact(): void {
    if (this.form.invalid) return FormGroupHelper.markTouchedAndDirty(this.form);

    this.crmComponentService
      .toggleContactLink(this.contact, this.selectedContact.value.id)
      .pipe(first())
      .subscribe(resp => this.close(resp));
  }

  /*
   * private helpers
   * */

  private createFormControls(): void {
    this.selectedContact = new FormControl('', [Validators.required]);
  }
  private createForm(): void {
    this.form = new FormGroup({
      selectedContact: this.selectedContact
    });
  }
}
