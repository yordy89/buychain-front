import { Component, OnDestroy, OnInit } from '@angular/core';
import { catchError, finalize, takeUntil } from 'rxjs/operators';
import { EMPTY, Subject } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { UserService } from '@app/services/app-layer/user/user.service';
import { NavigationHelperService } from '@services/helpers/navigation-helper/navigation-helper.service';
import { NotificationHelperService } from '@app/services/helpers/notification-helper/notification-helper.service';

@Component({
  selector: 'app-activation',
  template: ''
})
export class ActivationComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private userService: UserService,
    private navigationHelperService: NavigationHelperService,
    private notificationService: NotificationHelperService
  ) {}

  ngOnInit() {
    const { username, expiryDate, key } = this.route.snapshot.queryParams;
    this.userService
      .activateUser(username, expiryDate, key)
      .pipe(
        catchError(({ error }) => {
          this.notificationService.showValidation(error.message);
          return EMPTY;
        }),
        finalize(() => this.navigationHelperService.navigateSignIn()),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.notificationService.showSuccess('Your e-mail is successfully verified.');
      });
  }

  public ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.unsubscribe();
  }
}
