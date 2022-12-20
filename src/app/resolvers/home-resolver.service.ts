import { Injectable } from '@angular/core';
import { Resolve } from '@angular/router';
import { UserService } from '@services/app-layer/user/user.service';
import { SpinnerHelperService } from '@services/helpers/spinner-helper/spinner-helper.service';
import { Observable } from 'rxjs';
import { finalize, first } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class HomeResolverService implements Resolve<any> {
  constructor(private spinnerHelperService: SpinnerHelperService, private userService: UserService) {}

  resolve(): Observable<any> {
    this.spinnerHelperService.setStatus(true);

    return this.userService.getUser().pipe(
      first(),
      finalize(() => this.spinnerHelperService.setStatus(false))
    );
  }
}
