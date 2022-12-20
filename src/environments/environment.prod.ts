export const environment = {
  name: 'PRODUCTION',
  production: true,
  apiHost: 'https://base-api.buychain.tech',
  authApiHost: 'https://auth-api.buychain.tech',
  mediaApiHost: 'https://media-api.buychain.tech',
  documentsApiHost: 'https://documents-api.buychain.tech',
  searchApiHost: 'https://search-api.buychain.tech',
  reportsApiHost: 'https://reports-api.buychain.tech',
  accountingApiHost: 'https://accounting-api.buychain.tech',
  accountingAttachmentsApiHost: 'https://accounting-attachments-api.buychain.tech',
  apiVersion: 'v1',
  clientSecret: 'NXJxaDFkcXZrN3JmdDdpYjZlaDBhbHY1bXUydjRmOkpKdW00NldvV2NNeW5vVTFDV2xraEw=',
  restUrl() {
    return `${this.apiVersion}`;
  },
  baseUrl() {
    return `${this.apiHost}/${this.restUrl()}`;
  },
  baseMediaUrl() {
    return `${this.mediaApiHost}/${this.restUrl()}`;
  },
  baseDocumentsUrl() {
    return `${this.documentsApiHost}/${this.restUrl()}`;
  },
  baseSearchUrl() {
    return `${this.searchApiHost}/${this.restUrl()}`;
  },
  baseAuthUrl() {
    return `${this.authApiHost}/${this.restUrl()}`;
  },
  baseReportsUrl() {
    return `${this.reportsApiHost}/${this.restUrl()}`;
  },
  baseAccountingUrl() {
    return `${this.accountingApiHost}/${this.restUrl()}`;
  },
  baseAccountingAttachmentsUrl() {
    return `${this.accountingAttachmentsApiHost}/${this.restUrl()}`;
  }
};
