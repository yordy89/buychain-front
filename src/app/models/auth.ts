export interface AuthTokenData {
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
  scope: string;
  client: {
    id: string;
  };
  user: {
    id: string;
    companyId: string;
  };
  access_token: string;
}
