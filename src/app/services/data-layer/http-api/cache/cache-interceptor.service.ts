import { Injectable } from '@angular/core';
import { HttpEvent, HttpRequest, HttpHandler, HttpInterceptor, HttpResponse, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CacheService } from './cache.service';
import { Environment } from '@app/services/app-layer/app-layer.environment';

@Injectable()
export class CacheInterceptor implements HttpInterceptor {

  constructor(private cache: CacheService) { }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

    const currentUserId = this.getCurrentUserId();
    const deny = request.params.has('cache') && request.params.get('cache') === 'false';
    const force = request.params.has('cache') && request.params.get('cache') === 'true';
    const reset = request.method !== 'GET' && !force && !deny;
    const cache = currentUserId && (force || (!deny && request.method === 'GET'));

    let params = new HttpParams();
    request.params.keys().filter(x => x !== 'cache').forEach(key => {
      const values = request.params.getAll(key);
      values.forEach(value => params = values.length > 1 ? params.append(key, value) : params.set(key, value));
    });

    const originalRequest = request.clone({ params });

    if (reset) {
      this.cache.purge();
    }

    if (reset || deny) {
      return next.handle(originalRequest);
    }

    const cacheKey = currentUserId + originalRequest.urlWithParams + JSON.stringify(originalRequest.body);
    if (cache) {
      const cachedResponse = this.cache.get(cacheKey);
      if (cachedResponse) {
        // console.log(`Cached response returned for ${cacheKey}`);
        return of(cachedResponse);
      }
    }

    return next.handle(originalRequest).pipe(
      tap(event => {
        if (event instanceof HttpResponse) {
          if (cache && event.status === 200) this.cache.put(cacheKey, event);
        }
      })
    );
  }

  getCurrentUserId(): string {
    return Environment.getCurrentUser() ? Environment.getCurrentUser().id : null;
  }
}
