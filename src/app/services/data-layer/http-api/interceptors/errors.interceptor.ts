import { Injectable } from '@angular/core';
import { HttpEvent, HttpRequest, HttpHandler, HttpInterceptor, HttpErrorResponse } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { DialogModalComponent, DialogType } from '@components/common/modals/dialog-modal/dialog-modal.component';
import { EMPTY, mergeMap, Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class ErrorsInterceptor implements HttpInterceptor {
  private isServerErrorModalOpened = false;

  constructor(
    private dialog: MatDialog
  ) { }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 0) {
          return this.handleNoResponseError()
        }
        return throwError(() => error);
      })
    );
  }

  private handleNoResponseError() {
    if (this.isServerErrorModalOpened) {
      return EMPTY;
    }

    this.isServerErrorModalOpened = true;

    return this.dialog.open(DialogModalComponent, {
      width: '450px',
      disableClose: true,
      data: {
        type: DialogType.Alert,
        title: 'Sorry for the Inconvenience.',
        content: 'We were not able to reach our servers at this time. Please try again shortly, if you continue to have problems please submit an error report to our customer service <a class="link-btn" href="mailto:support@buychain.co">support@buychain.co.</a> <br><br> Thank You'
      }
    }).afterClosed().pipe(
      mergeMap(() => {
        this.isServerErrorModalOpened = false;
        return EMPTY;
      })
    )
  }
}
