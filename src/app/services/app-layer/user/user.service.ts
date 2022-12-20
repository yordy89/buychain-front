import { Injectable, Injector } from '@angular/core';
import { AuthService } from '@services/app-layer/auth/auth.service';
import { PermissionHelper } from '@services/app-layer/permission/permission-helper';
import { NavigationHelperService } from '@services/helpers/navigation-helper/navigation-helper.service';
import { NotificationHelperService } from '@services/helpers/notification-helper/notification-helper.service';
import { of, ReplaySubject, throwError, Observable } from 'rxjs';
import { catchError, first, map, switchMap, tap, withLatestFrom } from 'rxjs/operators';
import { ObjectUtil } from '@services/helpers/utils/object-util';
import { Environment } from '@app/services/app-layer/app-layer.environment';
import { User } from '../entities/user';
import { AccountState, ProfileCompletionState } from '../app-layer.enums';
import { BaseApiService } from '@app/services/data-layer/http-api/base-api/base-api.service';
import { InvitationPayload } from '@services/data-layer/http-api/base-api/extensions/services/users/users.service';

@Injectable({ providedIn: 'root' })
export class UserService {
  private user$: ReplaySubject<User>;

  constructor(
    private baseApi: BaseApiService,
    private notificationHelperService: NotificationHelperService,
    private injector: Injector,
    private navigationHelperService: NavigationHelperService,
    private authService: AuthService
  ) {}

  initUser() {
    return this.getUser().pipe(
      first(),
      tap(user => {
        if (
          user.profileCompletionState === ProfileCompletionState.COMPLETE &&
          (user.accountState === AccountState.HOLD || user.accountState === AccountState.UPDATE_REQUIRED)
        ) {
          this.notificationHelperService.showValidation('Your account is Inactive');
          this.authService.signOut(false);
        } else if (
          !(
            user.accountState === AccountState.APPROVED &&
            user.profileCompletionState === ProfileCompletionState.COMPLETE
          )
        ) {
          this.navigationHelperService.navigateHome();
        }
      })
    );
  }

  public fetchCurrentUser(): Observable<User> {
    this.user$ = this.user$ || new ReplaySubject<User>(1);

    return this.baseApi.users.getCurrentUser().pipe(
      first(),
      map(data => {
        if (data) this.setUser(data);
        return data;
      }),
      catchError(err => {
        if (err.status === 404 || err.status === 401 || err.status === 400) {
          this.authService.signOut(false);
          return of(null);
        }

        return throwError(() => err);
      }),
      switchMap(() => this.user$.asObservable())
    );
  }

  public getUser(): Observable<User> {
    if (!this.user$) return this.fetchCurrentUser();
    return this.user$.asObservable();
  }

  public createUser(username: string, password: string): Observable<any> {
    const url = Environment.linkToApplicationUi() + 'auth/activation';
    return this.baseApi.users.addUser({ username, password, applicationUrl: url }).pipe(first());
  }

  public createUserProfile(data: User): Observable<any> {
    return this.baseApi.users.updateCurrentUser(ObjectUtil.deleteEmptyProperties(data)).pipe(
      first(),
      tap(user => this.setUser(user))
    );
  }

  public updateUser(user: any): Observable<any> {
    return this.baseApi.users.updateCurrentUser(ObjectUtil.deleteEmptyProperties(user)).pipe(
      first(),
      map(data => {
        this.setUser(data);
        return data;
      })
    );
  }

  public updateUserPartial(user: any): Observable<any> {
    return this.baseApi.users.updateCurrentUserPartial(user).pipe(
      first(),
      tap(data => this.setUser(data))
    );
  }

  public updatePassword(currentPassword: string, newPassword: string) {
    return this.baseApi.users.updateCurrentUserPassword({
      passwordCurrent: currentPassword,
      password: newPassword
    });
  }

  updateUserPreferences(key: string, value: any, isBackgroundRequest?: boolean) {
    const payload = { [key]: value };
    isBackgroundRequest = isBackgroundRequest || false;
    return this.baseApi.users.updateCurrentUserPreferences(payload, isBackgroundRequest).pipe(
      first(),
      withLatestFrom(this.user$),
      map(([data, user]) => {
        user.preferences = { ui: data };
        user.normalizedPreferences = this.userNormalizedPreferences(data);
        Environment.setCurrentUser(user);
        this.user$.next(user);
        return data;
      })
    );
  }

  public activateUser(username: string, expiryDate: any, key: string): Observable<any> {
    return this.baseApi.users.addUserActivation({ username, key, expiryDate }).pipe(first());
  }

  public resendUserActivation(username: string): Observable<any> {
    const url = Environment.linkToApplicationUi() + 'auth/activation';
    return this.baseApi.users.addUserResendActivation({ username, applicationUrl: url }).pipe(first());
  }

  public sendInvitationEmail(payload: InvitationPayload): Observable<any> {
    return this.baseApi.users.sendBuyChainInvitation(payload).pipe(first());
  }

  public getUserAccountStatesList(): AccountState[] {
    return [AccountState.APPROVED, AccountState.HOLD, AccountState.UPDATE_REQUIRED];
  }

  /*
   * Password Actions
   * */
  public resetPassword(username: string, password: string, expiryDate: any, key: string): Observable<any> {
    return this.baseApi.users.updateUserPassword({ username, password, key, expiryDate }).pipe(first());
  }
  public sendForgotPasswordEmail(username: string): Observable<any> {
    const url = Environment.linkToApplicationUi() + 'auth/forgot-password';
    return this.baseApi.users.addUserForgotPassword({ username, applicationUrl: url }).pipe(first());
  }

  /*
   * Private helpers
   * */
  private setUser(userData): void {
    Environment.setCurrentUser(this.normalizeFromApi(userData));
    this.user$.next(this.normalizeFromApi(userData));
  }

  private normalizeFromApi(user: any): User {
    return {
      ...user,
      normalizedPreferences: this.userNormalizedPreferences(user.preferences ? user.preferences.ui : {}),
      accessControlProfile: PermissionHelper.getUserAccessControlProfile(user.accessControlRoles),
      normalizedAccessControlRoles: PermissionHelper.normalizeAccessControlsFromApi(user.accessControlRoles)
    };
  }

  private userNormalizedPreferences(preferences): any {
    const normalized = {};
    Object.keys(preferences).forEach(key => {
      const firstKey = key.substring(0, key.indexOf('-'));
      const rest = key.substring(key.indexOf('-') + 1) || '';
      const secondKey = rest.substring(0, rest.indexOf('-')) || rest;
      const thirdKey = rest.indexOf('-') === -1 ? '' : rest.substring(rest.indexOf('-') + 1);
      if (firstKey) {
        normalized[firstKey] = normalized[firstKey] || {};
        if (secondKey) {
          normalized[firstKey][secondKey] = normalized[firstKey][secondKey] || {};
          if (thirdKey) {
            normalized[firstKey][secondKey][thirdKey] = preferences[key];
          } else normalized[firstKey][secondKey] = preferences[key];
        } else normalized[firstKey] = preferences[key];
      }
    });
    return normalized;
  }
}
