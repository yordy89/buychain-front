import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class EventGeneralHandlerService {
  private httpRequestCount$: BehaviorSubject<{ count: number }> = new BehaviorSubject<{ count: number }>({ count: 0 });
  private httpRequests = { count: 0 };

  public getHttpRequestCount(): Observable<{ count: number }> {
    return this.httpRequestCount$.asObservable();
  }

  public addHttpRequestCount(): void {
    this.httpRequests.count++;
    this.httpRequestCount$.next(this.httpRequests);
  }
  public reduceHttpRequestCount(): void {
    this.httpRequests.count--;
    this.httpRequestCount$.next(this.httpRequests);
  }
}
