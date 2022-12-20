import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { UserService } from '@app/services/app-layer/user/user.service';
import { FormGroupHelper } from '@services/helpers/utils/form-group-helper';
import { EMPTY, Subject } from 'rxjs';
import { catchError, finalize, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-request-confirmation-email',
  templateUrl: './request-confirmation-email.component.html',
  styleUrls: ['./request-confirmation-email.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RequestConfirmationEmailComponent implements OnInit, OnDestroy {
  public form: FormGroup;
  public username: FormControl;

  public apiErrorMessage: string;
  public submitAttempted = false;
  public success = false;

  private destroy$ = new Subject<void>();

  constructor(private userService: UserService, private cd: ChangeDetectorRef) {}

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

  public request(): void {
    this.submitAttempted = true;
    this.apiErrorMessage = '';

    if (this.form.invalid) {
      FormGroupHelper.markTouchedAndDirty(this.form);
      return;
    }

    this.userService
      .resendUserActivation(this.username.value)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          if (error.status === 404) {
            this.apiErrorMessage =
              'Can’t find a user that matches to entered email address. Please check the email and try again.';
          } else {
            this.apiErrorMessage = error.error?.message || '';
          }
          return EMPTY;
        }),
        finalize(() => this.cd.markForCheck()),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.success = true;
      });
  }

  isInvalidField(control: FormControl) {
    return FormGroupHelper.isInvalidField(control);
  }

  private createFormControls(): void {
    this.username = new FormControl('', [
      Validators.required,
      Validators.email,
      Validators.pattern('^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$')
    ]);
  }

  private createForm(): void {
    this.form = new FormGroup({
      username: this.username
    });
  }
}
