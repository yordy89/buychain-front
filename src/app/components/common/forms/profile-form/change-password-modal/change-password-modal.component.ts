import { Component, Inject } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Environment } from '@services/app-layer/app-layer.environment';
import { CompaniesService } from '@services/app-layer/companies/companies.service';
import { UserService } from '@services/app-layer/user/user.service';
import { NotificationHelperService } from '@services/helpers/notification-helper/notification-helper.service';
import { PasswordMatchValidator } from '@validators/password-match/password-match.validator';
import { passwordValidator } from '@validators/password/password.validator';

@Component({
  selector: 'app-change-password-modal',
  templateUrl: './change-password-modal.component.html'
})
export class ChangePasswordModalComponent {
  public formGroup: FormGroup;

  public isCurrentUser = true;

  constructor(
    private dialogRef: MatDialogRef<ChangePasswordModalComponent>,
    @Inject(MAT_DIALOG_DATA) private data: { userId },

    private userService: UserService,
    private companyService: CompaniesService,
    private notificationService: NotificationHelperService
  ) {
    this.isCurrentUser = Environment.getCurrentUser()?.id === data.userId;
    this.createForm();
  }

  change() {
    if (this.formGroup.invalid) return;

    this.isCurrentUser ? this.updateCurrentUserPassword() : this.updateCompanyMemberPassword();
  }

  updateCurrentUserPassword() {
    const { currentPassword, newPassword } = this.formGroup.value;
    this.userService.updatePassword(currentPassword, newPassword).subscribe(() => {
      this.notificationService.showSuccess('The password has been changed successfully!');
      this.close();
    });
  }

  updateCompanyMemberPassword() {
    const { newPassword } = this.formGroup.value;
    this.companyService.updateCompanyMemberPassword(this.data.userId, newPassword).subscribe(() => {
      this.notificationService.showSuccess('The password has been changed successfully!');
      this.close();
    });
  }

  close() {
    this.dialogRef.close();
  }

  private createForm(): void {
    const newPassword = new FormControl('', [Validators.required, passwordValidator]);
    const confirmPassword = new FormControl('', [Validators.required]);

    this.formGroup = new FormGroup(
      {
        newPassword,
        confirmPassword
      },
      PasswordMatchValidator('newPassword', 'confirmPassword')
    );

    if (this.isCurrentUser) {
      const currentPassword = new FormControl('', [Validators.required, Validators.maxLength(20)]);
      this.formGroup.addControl('currentPassword', currentPassword);
    }
  }
}
