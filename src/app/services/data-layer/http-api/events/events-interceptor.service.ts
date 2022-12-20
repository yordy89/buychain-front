import { Injectable } from '@angular/core';
import { HttpEvent, HttpRequest, HttpHandler, HttpInterceptor, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, finalize, tap } from 'rxjs/operators';
import { EventGeneralHandlerService } from '@services/helpers/event-general-handler/event-general-handler.service';

@Injectable()
export class EventsInterceptor implements HttpInterceptor {

  constructor(private eventHandler: EventGeneralHandlerService) { }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

    if (request.params.get('background-request')) {
      request.params.delete('background-request');
      return next.handle(request).pipe(catchError((error: HttpErrorResponse) => throwError(error)));
    }

    this.eventHandler.addHttpRequestCount();

    return next.handle(request).pipe(
      finalize(() => this.eventHandler.reduceHttpRequestCount()),
    );
  }
}
