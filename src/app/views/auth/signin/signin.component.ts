import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '@app/services/app-layer/auth/auth.service';
import { UserService } from '@app/services/app-layer/user/user.service';
import { Layout } from '@services/helpers/layout-helper/layout-helper.service';
import { NavigationHelperService } from '@services/helpers/navigation-helper/navigation-helper.service';
import { FormGroupHelper } from '@services/helpers/utils/form-group-helper';
import { EMPTY, Subject } from 'rxjs';
import { catchError, map, mergeMap, takeUntil } from 'rxjs/operators';
import { User } from '@services/app-layer/entities/user';

@Component({
  selector: 'app-signin',
  templateUrl: './signin.component.html',
  styleUrls: ['./signin.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SigninComponent implements OnInit, OnDestroy {
  form: FormGroup;
  username: FormControl;
  password: FormControl;

  apiErrorMessage: string;
  submitAttempted = false;

  tempRedirectUrl: string;

  private destroy$ = new Subject<void>();

  constructor(
    private dialog: MatDialog,
    private navigationHelperService: NavigationHelperService,
    private authService: AuthService,
    private userService: UserService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.createFormControls();
    this.createForm();
    this.tempRedirectUrl = this.navigationHelperService.getTempRedirectUrl();

    this.form.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.apiErrorMessage = '';
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  signIn() {
    this.submitAttempted = true;
    this.apiErrorMessage = '';

    if (this.form.invalid) {
      FormGroupHelper.markTouchedAndDirty(this.form);
      return;
    }

    this.authService
      .signIn(this.form.value)
      .pipe(
        mergeMap(() =>
          this.userService.fetchCurrentUser().pipe(
            map((user: User) => {
              if (!user) {
                return;
              }

              if (this.navigationHelperService.isTempRedirectUrlSet()) {
                this.navigationHelperService.goToTempRedirectUrl();
              } else {
                this.navigationHelperService.goToMainLayout(Layout.Dashboard);
              }
            })
          )
        ),
        catchError(({ error }) => {
          this.apiErrorMessage = error?.message || '';
          this.cd.markForCheck();
          return EMPTY;
        }),
        takeUntil(this.destroy$)
      )
      .subscribe();
  }

  isInvalidField(control: FormControl) {
    return FormGroupHelper.isInvalidField(control);
  }

  /*
   * Private Methods
   */
  private createFormControls(): void {
    this.username = new FormControl('', [Validators.required, Validators.email]);
    this.password = new FormControl('', [Validators.required]);
  }

  private createForm(): void {
    this.form = new FormGroup({
      username: this.username,
      password: this.password
    });
  }
}
