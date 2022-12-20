import { ErrorHandler, Injectable, NgZone } from '@angular/core';
import { captureException, init, Integrations } from '@sentry/browser';
import { TypeCheck } from '@services/helpers/utils/type-check';
import { NotificationHelperService } from '@services/helpers/notification-helper/notification-helper.service';
import { SpinnerHelperService } from '@services/helpers/spinner-helper/spinner-helper.service';
import { HttpErrorResponse } from '@angular/common/http';
import { environment } from '@env/environment';
import { Environment } from '@app/services/app-layer/app-layer.environment';

const errorMessage = 'Authorization Token not available or expired';

const beforeSend = (event, hint) => {
  try {
    if (hint?.originalException?.toString().includes(errorMessage)) return null;
    return event;
  } catch (e) {
    return e;
  }
};

const sentryDev = {
  dsn: 'https://c21ab93749774db4ae92855765062dff@o417698.ingest.sentry.io/5323627',
  release: `buy-chain-spa@${Environment.currentVersion}`,
  environment: environment.name,
  integrations: [
    new Integrations.TryCatch({
      XMLHttpRequest: false
    })
  ],
  beforeSend: (event, hint) => beforeSend(event, hint)
};

const sentryDemo = {
  dsn: 'https://2604e067610f4f3f800f8fd8a43ef0d8@o417698.ingest.sentry.io/5553223',
  release: `buy-chain-spa@${Environment.currentVersion}`,
  environment: environment.name,
  integrations: [
    new Integrations.TryCatch({
      XMLHttpRequest: false
    })
  ],
  beforeSend: (event, hint) => beforeSend(event, hint)
};

// = new Sentry.init(
const sentryProd = {
  dsn: 'https://7de7fbf9c3244582804a38727ee561b4@o417698.ingest.sentry.io/5553265',
  release: `buy-chain-spa@${Environment.currentVersion}`,
  environment: environment.name,
  integrations: [
    new Integrations.TryCatch({
      XMLHttpRequest: false
    })
  ],
  beforeSend: (event, hint) => beforeSend(event, hint)
};

const errorMsgNetwork = 'Please, check your network connectivity\n. It seems there is no internet connection.';
const errorMsgGeneral = 'Something went wrong, please try later.';
const errorMsgServer = 'Server Error, please try later.';

@Injectable()
export class ErrorHandlerService implements ErrorHandler {
  constructor(
    public notificationHelperService: NotificationHelperService,
    private zone: NgZone,
    private spinnerHelperService: SpinnerHelperService
  ) {}

  public handleError(error: any): void {
    let errorMsg = errorMsgGeneral;
    const httpStatusCode = error.status;

    const knownHandledError = error.toString().includes(errorMessage);

    if (environment.name === 'PRODUCTION') init(sentryProd);
    if (environment.name === 'DEMO') init(sentryDemo);
    if (environment.name === 'DEVELOPMENT') init(sentryDev);
    if (!knownHandledError) {
      console.error(error);
      const extractedError = this.extractErrorForSentry(error) || JSON.stringify(error);
      captureException(extractedError);
    }

    // IF no httpStatusCode then it's a client side typeError.Do not show popup
    if (!httpStatusCode) return;

    // Handle network issues.
    this.hideSpinnerIfExists();

    if (httpStatusCode === 0 && (error.statusText === '' || error.statusText === 'Unknown Error'))
      errorMsg = errorMsgNetwork;
    else if (httpStatusCode < 400) return;
    /* Do nothing it's something unexpected. Errors shouldn't be smaller then 400 */ else if (
      httpStatusCode >= 400 &&
      httpStatusCode < 500
    ) {
      errorMsg = error.error?.message ? error.error.message : error.error;
    } else if (/^5[0-9]{2}$/.test(httpStatusCode)) errorMsg = errorMsgServer;

    this.parseAndShowErrors(errorMsg);
  }

  /*
   * Private Helpers
   */
  private parseAndShowErrors(err: any): void {
    if (TypeCheck.isString(err)) return this.showError(err);

    if (TypeCheck.isArray(err)) {
      err.map(el => this.parseAndShowErrors(el));
    } else if (TypeCheck.isObject(err)) {
      Object.keys(err).forEach(key => {
        if (key === 'error' || key === 'errors') {
          this.parseAndShowErrors(err[key]);
        } else {
          this.showError(`${key}: ${err[key]}`);
        }
      });
    }
  }

  private showError(text: string): void {
    // Have to wrap into Zone run to make sure changes are detected by angular.
    this.zone.run(() => this.notificationHelperService.showValidation(text));
  }

  private hideSpinnerIfExists(): void {
    // Have to wrap into Zone run to make sure changes are detected by angular.
    this.zone.run(() => this.spinnerHelperService.setStatus(false));
  }

  private extractErrorForSentry(error) {
    if (error && error.ngOriginalError) {
      error = error.ngOriginalError;
    }

    // We can handle messages and Error objects directly.
    if (typeof error === 'string' || error instanceof Error) {
      return error;
    }

    if (error instanceof HttpErrorResponse) {
      // The `error` property of http exception can be either an `Error` object, which we can use directly...
      if (error.error instanceof Error) {
        return error.error;
      }

      // ... or an`ErrorEvent`, which can provide us with the message but no stack...
      if (error.error instanceof ErrorEvent) {
        return error.error.message;
      }

      // ...or the request body itself, which we can use as a message instead.
      if (typeof error.error === 'string') {
        return `Server returned code ${error.status} with body "${error.error}"`;
      }

      // If we don't have any detailed information, fallback to the request message itself.
      return error.message;
    }

    // Skip if there's no error, and let user decide what to do with it.
    return null;
  }
}
