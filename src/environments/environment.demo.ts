export const environment = {
  name: 'DEMO',
  production: true,
  apiHost: 'https://base-api-demo.buychain.tech',
  authApiHost: 'https://auth-api-demo.buychain.tech',
  mediaApiHost: 'https://media-api-demo.buychain.tech',
  documentsApiHost: 'https://documents-api-demo.buychain.tech',
  searchApiHost: 'https://search-api-demo.buychain.tech',
  reportsApiHost: 'https://reports-api-demo.buychain.tech',
  accountingApiHost: 'https://accounting-api-demo.buychain.tech',
  accountingAttachmentsApiHost: 'https://accounting-attachments-api-demo.buychain.tech',
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
