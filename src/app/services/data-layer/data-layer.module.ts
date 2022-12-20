import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { environment } from '@env/environment';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { ErrorsInterceptor } from '@services/data-layer/http-api/interceptors/errors.interceptor';
import { TokenInterceptor } from '@services/data-layer/http-api/interceptors/token.interceptor';
import { CacheInterceptor } from './http-api/cache/cache-interceptor.service';
import { ApiModule as BaseApiModule, Configuration } from './http-api/base-api/swagger-gen';
import { EventsInterceptor } from '@app/services/data-layer/http-api/events/events-interceptor.service';

export function baseApiConfigurationFactory() {
  return new Configuration({
    basePath: `${environment.baseUrl()}`,
    apiKeys: {
      authorization: ''
    }
  });
}

@NgModule({
  declarations: [
  ],
  imports: [
    CommonModule,
    BaseApiModule.forRoot(baseApiConfigurationFactory),
  ],
  providers: [
    {provide: HTTP_INTERCEPTORS, useClass: ErrorsInterceptor, multi: true},
    {provide: HTTP_INTERCEPTORS, useClass: TokenInterceptor, multi: true},
    { provide: HTTP_INTERCEPTORS, useClass: CacheInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: EventsInterceptor, multi: true },
  ]
})
export class DataLayerModule { }
