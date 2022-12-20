import { BreakpointObserver } from '@angular/cdk/layout';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, share } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ViewportHelperService {
  isTablet$: Observable<boolean>;

  constructor(private breakpointObserver: BreakpointObserver) {
    this.isTablet$ = this.listenViewportMatching('(max-width: 1366px)');
  }

  listenViewportMatching(size) {
    return this.breakpointObserver.observe(size).pipe(
      map(({ matches }) => matches),
      share()
    );
  }

  observeRequestToRotateChange() {
    return this.listenViewportMatching('(max-width: 1366px) and (orientation: portrait)');
  }

  observeSupportedResolution() {
    return this.listenViewportMatching('(min-width: 1021px), (min-height: 1021px)');
  }
}
