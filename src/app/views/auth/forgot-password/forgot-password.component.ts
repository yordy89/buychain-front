import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { passwordValidator } from '@validators/password/password.validator';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { UserService } from '@app/services/app-layer/user/user.service';
import { NotificationHelperService } from '@app/services/helpers/notification-helper/notification-helper.service';
import { PasswordMatchValidator } from '@app/validators/password-match/password-match.validator';
import { NavigationHelperService } from '@services/helpers/navigation-helper/navigation-helper.service';
import { FormGroupHelper } from '@services/helpers/utils/form-group-helper';
import { EMPTY, Subject } from 'rxjs';
import { catchError, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ForgotPasswordComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  public form: FormGroup;
  public username: FormControl;
  public password: FormControl;
  public confirmPassword: FormControl;

  public apiErrorMessage: string;
  public submitAttempted = false;

  private expireDate: string;
  private key: string;

  constructor(
    private userService: UserService,
    private route: ActivatedRoute,
    private navigationHelperService: NavigationHelperService,
    private notificationService: NotificationHelperService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.createFormControls();
    this.createForm();

    const { expiryDate, key, username } = this.route.snapshot.queryParams;
    this.expireDate = expiryDate;
    this.key = key;
    this.username.setValue(username);

    this.form.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.apiErrorMessage = '';
    });
  }

  public ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.unsubscribe();
  }

  public reset() {
    this.submitAttempted = true;
    this.apiErrorMessage = '';

    if (this.form.invalid) {
      FormGroupHelper.markTouchedAndDirty(this.form);
      return;
    }

    this.userService
      .resetPassword(this.username.value, this.password.value, this.expireDate, this.key)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          this.apiErrorMessage = error.error?.message || '';
          this.cd.markForCheck();
          return EMPTY;
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.notificationService.showSuccess('Successfully updated, use the new password to sign in.');
        this.navigationHelperService.navigateSignIn();
      });
  }

  isInvalidField(control: FormControl) {
    return FormGroupHelper.isInvalidField(control);
  }

  /*
   * Private Methods
   */
  private createFormControls(): void {
    this.username = new FormControl('', [Validators.required, Validators.email]);
    this.password = new FormControl('', [Validators.required, passwordValidator]);
    this.confirmPassword = new FormControl('', [Validators.required]);
  }

  private createForm(): void {
    this.form = new FormGroup(
      {
        username: this.username,
        password: this.password,
        confirmPassword: this.confirmPassword
      },
      PasswordMatchValidator('password', 'confirmPassword')
    );
  }
}
