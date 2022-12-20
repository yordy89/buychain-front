import { AuthTokenData } from '@app/models';
import { isPast } from 'date-fns';

export class TokenHelper {
  static get getTokenData(): AuthTokenData {
    return JSON.parse(localStorage.getItem('buyChain'));
  }

  static setTokenData(token: AuthTokenData): void {
    localStorage.setItem('buyChain', JSON.stringify(token));
  }

  static removeTokenData() {
    localStorage.removeItem('buyChain');
  }

  static get getAccessToken(): string {
    return TokenHelper.getTokenData?.access_token || '';
  }

  static get isAccessTokenValid(): boolean {
    return !!TokenHelper.getAccessToken.length && !TokenHelper.isAccessTokenExpired;
  }

  static get isAccessTokenExpired(): boolean {
    const data = TokenHelper.getTokenData;

    if (data?.accessTokenExpiresAt) {
      return isPast(new Date(data.accessTokenExpiresAt));
    }

    throw new Error('Token not available to perform expiration check.');
  }

  static get getRefreshToken(): string {
    return TokenHelper.getTokenData?.refreshToken || '';
  }

  static get isRefreshTokenValid(): boolean {
    return !!TokenHelper.getRefreshToken.length && !TokenHelper.isRefreshTokenExpired;
  }

  static get isRefreshTokenExpired(): boolean {
    const data = TokenHelper.getTokenData;

    if (data?.refreshTokenExpiresAt) {
      return isPast(new Date(data.refreshTokenExpiresAt));
    }

    throw new Error('Token not available to perform expiration check.');
  }

  static get hasValidToken(): boolean {
    return TokenHelper.isAccessTokenValid || TokenHelper.isRefreshTokenValid;
  }
}
