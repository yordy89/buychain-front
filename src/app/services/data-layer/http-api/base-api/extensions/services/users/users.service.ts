import {Inject, Injectable, Injector, Optional} from '@angular/core';
import {HttpClient, HttpHeaders, HttpParams} from '@angular/common/http';
import {
  BASE_PATH,
  Configuration, UserPreferencesUi,
  UsersService
} from '@app/services/data-layer/http-api/base-api/swagger-gen';
import {Observable} from 'rxjs';
import {TokenHelper} from '@services/helpers/utils/token-helper';

export interface InvitationPayload {
  applicationUrl: string,
  companyName: string,
  username: string
}

@Injectable({
  providedIn: 'root'
})
export class UsersApiExtendedService extends UsersService {

  constructor(private injector: Injector, @Optional()@Inject(BASE_PATH) basePath: string, @Optional() configuration: Configuration) {
    super(injector.get(HttpClient), null, null);
    if (basePath) {
      this.basePath = basePath;
    }
    if (configuration) {
      this.configuration = configuration;
      this.basePath = basePath || configuration.basePath || this.basePath;
    }
  }

  public updateCurrentUserPreferences(payload?: UserPreferencesUi, isBackgroundRequest = false, observe: any = 'body', reportProgress = false ): Observable<any> {

    let headers = new HttpHeaders();

    if (this.configuration.accessToken) {
      const accessToken = typeof this.configuration.accessToken === 'function'
        ? this.configuration.accessToken()
        : this.configuration.accessToken;
      headers = headers.set('Authorization', 'Bearer ' + accessToken);
    }

    // to determine the Accept header
    const httpHeaderAccepts: string[] = [
      'application/json'
    ];
    const httpHeaderAcceptSelected: string | undefined = this.configuration.selectHeaderAccept(httpHeaderAccepts);
    if (httpHeaderAcceptSelected != undefined) {
      headers = headers.set('Accept', httpHeaderAcceptSelected);
    }

    // to determine the Content-Type header
    const consumes: string[] = [
      'application/json'
    ];
    const httpContentTypeSelected: string | undefined = this.configuration.selectHeaderContentType(consumes);
    if (httpContentTypeSelected != undefined) {
      headers = headers.set('Content-Type', httpContentTypeSelected);
    }

    let params = new HttpParams();
    if (isBackgroundRequest) params = params.set('background-request', 'true');

    return this.httpClient.patch<UserPreferencesUi>(`${this.basePath}/users/current/preferences/ui`,
      payload,
      {
        withCredentials: this.configuration.withCredentials,
        headers: headers,
        observe: observe,
        reportProgress: reportProgress,
        params: params,
      }
    );

  }

  public sendBuyChainInvitation(payload?: InvitationPayload, observe: any = 'body', reportProgress = false ): Observable<any> {

    let headers = new HttpHeaders();

    if (TokenHelper.getAccessToken) {
      headers = headers.set('Authorization', 'Bearer ' + TokenHelper.getAccessToken);
    }

    // to determine the Content-Type header
    const consumes: string[] = [
      'application/json'
    ];
    const httpContentTypeSelected: string | undefined = this.configuration.selectHeaderContentType(consumes);
    if (httpContentTypeSelected != undefined) {
      headers = headers.set('Content-Type', httpContentTypeSelected);
    }

    const params = new HttpParams();

    return this.httpClient.post<any>(`${this.basePath}/users/registration/invitation`,
      payload,
      {
        withCredentials: this.configuration.withCredentials,
        headers: headers,
        observe: observe,
        reportProgress: reportProgress,
        params: params,
      }
    );

  }


}
