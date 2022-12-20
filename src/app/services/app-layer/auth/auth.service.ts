import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { AuthTokenData } from '@app/models';
import { TokenHelper } from '@services/helpers/utils/token-helper';
import { first, map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { environment as config } from '@env/environment';
import { NavigationHelperService } from '@app/services/helpers/navigation-helper/navigation-helper.service';
import { Environment } from '@app/services/app-layer/app-layer.environment';
import { HttpUrlEncodingCodec } from '@services/app-layer/auth/httpUrlEncoding.service';
import { MatDialog } from '@angular/material/dialog';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private authUrl = config.baseAuthUrl();

  private signInHeaders = new HttpHeaders({
    'Content-Type': 'application/x-www-form-urlencoded',
    Authorization: `Basic ${config.clientSecret}`
  });

  constructor(
    private http: HttpClient,
    private navigationService: NavigationHelperService,
    private dialog: MatDialog
  ) {}

  signIn({ username, password }): Observable<AuthTokenData> {
    const body = new HttpParams({ encoder: new HttpUrlEncodingCodec() })
      .set('grant_type', 'password')
      .set('username', username)
      .set('password', password)
      .toString();
    const headers = { headers: this.signInHeaders };

    return this.http.post(this.authUrl + '/oauth2/token', body, headers).pipe(
      first(),
      map((data: AuthTokenData) => {
        TokenHelper.setTokenData(data);
        return data;
      })
    );
  }

  refreshToken(): Observable<AuthTokenData> {
    const body = new HttpParams({ encoder: new HttpUrlEncodingCodec() })
      .set('grant_type', 'refresh_token')
      .set('refreshToken', TokenHelper.getRefreshToken)
      .toString();
    const headers = { headers: this.signInHeaders };

    return this.http.post(this.authUrl + '/oauth2/token', body, headers).pipe(
      first(),
      map((data: AuthTokenData) => {
        TokenHelper.setTokenData(data);
        return data;
      })
    );
  }

  signOut(redirectToCurrentUrlAfterSignIn = true): void {
    TokenHelper.removeTokenData();
    Environment.setLogoUrl(null);
    if (redirectToCurrentUrlAfterSignIn) {
      this.navigationService.setTempRedirectUrl(this.navigationService.getCurrentRouteUrl());
    }
    this.dialog.closeAll();
    this.navigationService.navigateSignIn();
  }
}
