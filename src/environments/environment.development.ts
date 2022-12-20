export const environment = {
  name: 'DEVELOPMENT',
  production: true,
  apiHost: 'http://base-api-development.buychain.tech',
  authApiHost: 'http://auth-api-development.buychain.tech',
  mediaApiHost: 'http://media-api-development.buychain.tech',
  documentsApiHost: 'http://documents-api-development.buychain.tech',
  searchApiHost: 'http://search-api-development.buychain.tech',
  reportsApiHost: 'http://reports-api-development.buychain.tech',
  accountingApiHost: 'http://accounting-api-development.buychain.tech',
  accountingAttachmentsApiHost: 'http://accounting-attachments-api-development.buychain.tech',
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
