import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { EventGeneralHandlerService } from '@services/helpers/event-general-handler/event-general-handler.service';

@Injectable({
  providedIn: 'root'
})
export class SpinnerHelperService {
  private status$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  private isHttpRequest = true;

  constructor(private eventGeneralHandlerService: EventGeneralHandlerService) {
    this.eventGeneralHandlerService.getHttpRequestCount().subscribe(httpRequests => {
      if (httpRequests.count > 0) this.setStatus(true, true);
      if (httpRequests.count === 0) {
        setTimeout(() => {
          if (httpRequests.count === 0) this.setStatus(false, true);
        }, 100);
      }
    });
  }

  public isActive(): Observable<boolean> {
    return this.status$.asObservable();
  }

  public setStatus(data: boolean, isHttp?: boolean): void {
    if (!isHttp) this.isHttpRequest = !data;
    if (!this.isHttpRequest && !data) return;
    if (data !== this.status$.getValue()) this.status$.next(data);
  }
}
