import { Injectable } from '@angular/core';
import { Resolve } from '@angular/router';
import { CompaniesService } from '@services/app-layer/companies/companies.service';
import { UserService } from '@services/app-layer/user/user.service';
import { SpinnerHelperService } from '@services/helpers/spinner-helper/spinner-helper.service';
import { mergeMap, Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class MainResolverService implements Resolve<any> {
  constructor(
    private spinnerHelperService: SpinnerHelperService,
    private companyService: CompaniesService,
    private userService: UserService
  ) {}

  resolve(): Observable<any> {
    this.spinnerHelperService.setStatus(true);

    return this.userService.initUser().pipe(
      mergeMap(() => this.companyService.getUserCompany()),
      finalize(() => this.spinnerHelperService.setStatus(false))
    );
  }
}
