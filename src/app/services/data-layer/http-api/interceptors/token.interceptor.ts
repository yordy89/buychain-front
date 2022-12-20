import { Injectable, Injector } from '@angular/core';
import {
  HttpRequest, HttpHandler, HttpInterceptor, HttpErrorResponse
} from '@angular/common/http';
import { TokenHelper } from '@services/helpers/utils/token-helper';
import { concatMap, Observable, Subject, throwError } from 'rxjs';
import { AuthService } from '@app/services/app-layer/auth/auth.service';
import { catchError, switchMap, tap } from 'rxjs/operators';


@Injectable()
export class TokenInterceptor implements HttpInterceptor {
  private authService: AuthService;
  private refreshTokenInProgress = false;
  private tokenRefreshedSource = new Subject<void>();
  private tokenRefreshed$ = this.tokenRefreshedSource.asObservable();

  constructor(
    private injector: Injector
  ) {
  }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<any> {
    this.authService = this.injector.get(AuthService); // Using manual Inject to get around circular dependency

    const authorizationRequired = this.isAuthorizationRequired(request);

    if (authorizationRequired) {

      if (TokenHelper.isAccessTokenValid) {
        request = this.addToken(request);
      } else if (TokenHelper.isRefreshTokenValid) {
        return this.refreshToken().pipe(
          concatMap(() => {
            request = this.addToken(request);
            return next.handle(request);
          }),
          catchError((err: HttpErrorResponse) => this.handleError(err, request, next))
        );
      } else {
        this.authService.signOut();
        return throwError(() => new Error('Authorization Token not available or expired.'));
      }
    }

    return next
      .handle(request)
      .pipe(
        catchError((err: HttpErrorResponse) => this.handleError(err, request, next))
      );
  }

  private refreshToken(): Observable<any> {
    if (this.refreshTokenInProgress) {
      return new Observable(observer => {
        this.tokenRefreshed$.subscribe(() => {
          observer.next();
          observer.complete();
        });
      });
    } else {

      this.refreshTokenInProgress = true;

      return this.authService.refreshToken().pipe(
        tap(() => {
          this.refreshTokenInProgress = false;
          this.tokenRefreshedSource.next();
        }),
        catchError((error) => {
          this.refreshTokenInProgress = false;
          this.authService.signOut();
          return throwError(() => error);
        })
      );
    }
  }

  private handleError(err: HttpErrorResponse, request?, next?) {

    const hasAuthError = (error: HttpErrorResponse) => {
      return error.status === 401
        || (
          error.status === 404
          && ['The token with access-token', 'The token for'].some(str => err?.error?.message?.startsWith(str))
        );
    };

    if (hasAuthError(err) && TokenHelper.hasValidToken) {
      return this.refreshToken().pipe(
        switchMap(() => {
          request = this.addToken(request);
          return next.handle(request);
        }),
        catchError(error => {
          if (!hasAuthError(error)) {
            return this.handleError(error);
          } else {
            this.authService.signOut();
          }
          return throwError(() => error);
        })
      );
    }

    return throwError(() => err);
  }

  private addToken(request: HttpRequest<any>): HttpRequest<any> {
    const accessToken = TokenHelper.getAccessToken;
    return request.clone({setHeaders: {Authorization: `Bearer ${accessToken}`}});
  }

  private isAuthorizationRequired(request): boolean {
    return !request.url.includes('/oauth2/token')
      && !request.url.includes('/users/forgot-password')
      && !request.url.includes('/users/resend-activation')
      && !request.url.includes('/users/activation')
      && !(request.url.includes('/users') && request.method === 'POST')
      && !(request.url.includes('/users/password') && request.method === 'PUT')
      && !request.url.includes('s3.amazonaws.com');
  }

}
