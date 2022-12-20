import { Injectable } from '@angular/core';
import { CanActivate } from '@angular/router';
import { NavigationHelperService } from '@services/helpers/navigation-helper/navigation-helper.service';
import { TokenHelper } from '@services/helpers/utils/token-helper';

@Injectable({ providedIn: 'root' })
export class NoAuthGuard implements CanActivate {
  constructor(private navigationHelperService: NavigationHelperService) {}

  canActivate(): boolean | Promise<boolean> {
    if (!TokenHelper.hasValidToken) {
      return true;
    }

    return this.navigationHelperService.navigateHome().then(() => false);
  }
}
