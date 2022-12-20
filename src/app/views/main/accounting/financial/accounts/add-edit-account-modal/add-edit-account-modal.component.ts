import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { AccountsService } from '@services/app-layer/accounts/accounts.service';
import { AccountingNaturalBalanceEnum, AccountingTypeEnum } from '@services/app-layer/app-layer.enums';
import { AccountEntity } from '@services/app-layer/entities/account';
import { FormGroupHelper } from '@services/helpers/utils/form-group-helper';
import { ObjectUtil } from '@services/helpers/utils/object-util';
import { catchError } from 'rxjs/operators';
import { NotificationHelperService } from '@services/helpers/notification-helper/notification-helper.service';

@Component({
  selector: 'app-add-edit-account-modal',
  templateUrl: './add-edit-account-modal.component.html'
})
export class AddEditAccountModalComponent implements OnInit {
  public formGroup: FormGroup;
  public name: FormControl;
  public number: FormControl;
  public naturalBalance: FormControl;
  public type: FormControl;
  public subtype: FormControl;
  public description: FormControl;
  public archived: FormControl;
  public isEditMode = false;

  public accountTypes = ObjectUtil.enumToArray(AccountingTypeEnum);
  public naturalBalances = ObjectUtil.enumToArray(AccountingNaturalBalanceEnum);

  constructor(
    @Inject(MAT_DIALOG_DATA) public account: AccountEntity,
    private dialogRef: MatDialogRef<AddEditAccountModalComponent>,
    private accountsService: AccountsService,
    private notificationHelperService: NotificationHelperService
  ) {}

  ngOnInit(): void {
    this.isEditMode = !!this.account;
    this.createFormControls();
    this.createForm();

    if (this.isEditMode) this.setInitialData();
  }

  public submit(): void {
    if (this.account) this.editAccount();
    else this.addAccount();
  }

  public addAccount(): void {
    const payload = ObjectUtil.deleteEmptyProperties(this.formGroup.value);
    payload.name = payload.name.trim();

    this.accountsService
      .addAccount(payload)
      .pipe(
        catchError(({ error }) => {
          const message =
            error.message === 'Duplicate entry.'
              ? 'The provided name or number has already been used. Please provide another.'
              : error.message;
          this.notificationHelperService.showValidation(message);
          throw error;
        })
      )
      .subscribe(data => this.close(data));
  }
  public editAccount(): void {
    const payload = FormGroupHelper.getDirtyValues(this.formGroup);
    if (payload.name) payload.name = payload.name.trim();

    if (ObjectUtil.isEmptyObject(payload)) {
      return this.close();
    }

    if (this.subtype.dirty) payload.subtype = payload.subtype || null;
    if (this.description.dirty) payload.description = payload.description || null;
    this.accountsService.editAccount(this.account, payload).subscribe(data => this.close(data));
  }

  public close(account?: AccountEntity): void {
    this.dialogRef.close(account);
  }

  onChangeActive(checked) {
    this.archived.setValue(!checked);
    this.archived.markAsDirty();
  }

  /*
   * private helpers
   * */

  private createFormControls(): void {
    this.name = new FormControl('', [Validators.required, Validators.maxLength(150)]);
    this.number = new FormControl('', [Validators.required, Validators.min(0), Validators.max(100000)]);
    this.naturalBalance = new FormControl({ value: '', disabled: this.isEditMode }, [Validators.required]);
    this.type = new FormControl({ value: '', disabled: this.isEditMode }, [Validators.required]);
    this.subtype = new FormControl('', [Validators.maxLength(200)]);
    this.description = new FormControl('', [Validators.maxLength(500)]);
    this.archived = new FormControl(false);
  }

  private createForm(): void {
    this.formGroup = new FormGroup({
      name: this.name,
      number: this.number,
      naturalBalance: this.naturalBalance,
      type: this.type,
      subtype: this.subtype,
      description: this.description,
      archived: this.archived
    });
  }

  private setInitialData(): void {
    this.formGroup.patchValue(this.account);
  }
}
