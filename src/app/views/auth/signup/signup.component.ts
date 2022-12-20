import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { UserService } from '@app/services/app-layer/user/user.service';
import { FormGroupHelper } from '@services/helpers/utils/form-group-helper';
import { PasswordMatchValidator } from '@validators/password-match/password-match.validator';
import { passwordValidator } from '@validators/password/password.validator';
import { EMPTY, Subject } from 'rxjs';
import { catchError, finalize, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SignupComponent implements OnInit, OnDestroy {
  public title = 'BuyChain';
  public form: FormGroup;
  public username: FormControl;
  public password: FormControl;
  public confirmPass: FormControl;

  public apiErrorMessage: string;
  public submitAttempted = false;
  public success = false;

  private destroy$ = new Subject<void>();

  constructor(private dialog: MatDialog, private userService: UserService, private cd: ChangeDetectorRef) {}

  ngOnInit() {
    this.createFormControls();
    this.createForm();

    this.form.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.apiErrorMessage = '';
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  public signUp() {
    this.submitAttempted = true;
    this.apiErrorMessage = '';

    if (this.form.invalid) {
      FormGroupHelper.markTouchedAndDirty(this.form);
      return;
    }

    this.userService
      .createUser(this.username.value, this.password.value)
      .pipe(
        catchError(({ error }) => {
          if (error?.status === 400) {
            this.apiErrorMessage = "The email address you've entered is already assigned to an existing account.";
          } else {
            this.apiErrorMessage = error?.message || '';
          }
          return EMPTY;
        }),
        finalize(() => this.cd.markForCheck()),
        takeUntil(this.destroy$)
      )
      .subscribe(() => (this.success = true));
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
    this.confirmPass = new FormControl('', [Validators.required]);
  }

  private createForm(): void {
    this.form = new FormGroup(
      {
        username: this.username,
        password: this.password,
        confirmPass: this.confirmPass
      },
      PasswordMatchValidator('password', 'confirmPass')
    );
  }
}
