import { Injectable } from '@angular/core';
import { CanActivate } from '@angular/router';
import { AuthService } from '@services/app-layer/auth/auth.service';
import { TokenHelper } from '@services/helpers/utils/token-helper';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService) {}

  canActivate(): boolean {
    if (TokenHelper.hasValidToken) {
      return true;
    }

    this.authService.signOut();
    return false;
  }
}
