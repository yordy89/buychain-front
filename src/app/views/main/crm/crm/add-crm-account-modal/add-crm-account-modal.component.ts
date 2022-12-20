import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { CrmAccountEntity } from '@services/app-layer/entities/crm';
import { Subject } from 'rxjs';
import { FormGroup } from '@angular/forms';
import { FormGroupHelper } from '@services/helpers/utils/form-group-helper';
import { first } from 'rxjs/operators';
import { CrmComponentService } from '@views/main/crm/crm/crm.component.service';
import { TypeCheck } from '@services/helpers/utils/type-check';
import { ObjectUtil } from '@services/helpers/utils/object-util';
import { DialogModalComponent, DialogType } from '@components/common/modals/dialog-modal/dialog-modal.component';
import { NotificationHelperService } from '@services/helpers/notification-helper/notification-helper.service';
import { CrmStateService } from '@views/main/crm/crm/crm-state.service';

@Component({
  selector: 'app-add-crm-account-modal',
  templateUrl: './add-crm-account-modal.component.html'
})
export class AddCrmAccountModalComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  public form: FormGroup;

  constructor(
    private crmComponentService: CrmComponentService,
    private notificationHelperService: NotificationHelperService,
    private crmStateService: CrmStateService,
    private dialog: MatDialog,
    private dialogRef: MatDialogRef<AddCrmAccountModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CrmAccountEntity[]
  ) {}

  ngOnInit() {
    this.createForm();
  }

  public ngOnDestroy(): void {
    this.destroy$.unsubscribe();
  }
  public close(data?: CrmAccountEntity): void {
    this.dialogRef.close(data);
  }

  public createCrmAccount(): void {
    if (this.form.invalid) return FormGroupHelper.markTouchedAndDirty(this.form);

    const existingAccount = this.getAccountByName();
    if (existingAccount) {
      if (existingAccount.archived) this.promptToRestoreAccount(existingAccount);
      else {
        this.notificationHelperService.showValidation(
          'You already have an active account with the specified name. It is opened.' +
            ' Please check it or provide a different name.'
        );
        this.crmStateService.setActiveEntity(existingAccount);
      }
      return;
    }

    this.crmComponentService
      .createAccount(this.normalizeCrmAccountPayload(this.form.value.company))
      .pipe(first())
      .subscribe(account => this.close(account));
  }

  /*
   * private helpers
   * */

  private promptToRestoreAccount(account: CrmAccountEntity): void {
    this.dialog
      .open(DialogModalComponent, {
        width: '450px',
        disableClose: true,
        data: {
          type: DialogType.Confirm,
          title: 'Request To Restore',
          content: 'You already have an archived CRM account with specified name. Do you want to unarchive it?'
        }
      })
      .afterClosed()
      .subscribe((confirmed: boolean) => {
        if (confirmed) {
          this.crmComponentService
            .unArchiveAccount(account)
            .pipe(first())
            .subscribe(() => {
              this.crmStateService.setArchiveStatusAccount(account, false);
              this.crmStateService.setActiveEntity(account);
              this.close();
            });
        }
      });
  }

  private getAccountByName(): CrmAccountEntity {
    return this.data.find(account => account.name === this.form.value?.company?.name);
  }

  private createForm(): void {
    this.form = new FormGroup({});
  }

  private normalizeCrmAccountPayload(account: any): any {
    return ObjectUtil.deleteEmptyProperties({
      name: account.name,
      logoUrl: account.logoUrl,
      website: account.website,
      streetAddress: account.streetAddress,
      city: TypeCheck.isObject(account.city) ? account.city.name : account.city,
      state: TypeCheck.isObject(account.state) ? account.state.name : account.state,
      country: TypeCheck.isObject(account.country) ? account.country.name : account.country,
      zipCode: account.zipCode
    });
  }
}
