// This file can be replaced during build by using the `fileReplacements` array.
// `ng build ---prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

const config = {
  prod: {
    api: 'https://base-api.buychain.tech',
    auth_api: 'https://auth-api.buychain.tech',
    media_api: 'https://media-api.buychain.tech',
    search_api: 'https://search-api.buychain.tech',
    documents_api: 'https://documents-api.buychain.tech',
    reports_api: 'https://reports-api.buychain.tech',
    accounting_api: 'https://accounting-api.buychain.tech',
    accounting_attachments_api: 'https://accounting-attachments-api.buychain.tech'
  },
  local: {
    api: 'http://127.0.0.1:3020',
    auth_api: 'http://127.0.0.1:3010',
    media_api: 'http://127.0.0.1:3030',
    search_api: 'http://127.0.0.1:3040',
    accounting_api: 'http://127.0.0.1:3130'
  },
  development: {
    api: 'http://base-api-development.buychain.tech',
    auth_api: 'http://auth-api-development.buychain.tech',
    media_api: 'http://media-api-development.buychain.tech',
    search_api: 'http://search-api-development.buychain.tech',
    documents_api: 'http://documents-api-development.buychain.tech',
    reports_api: 'http://reports-api-development.buychain.tech',
    accounting_api: 'http://accounting-api-development.buychain.tech',
    accounting_attachments_api: 'http://accounting-attachments-api-development.buychain.tech'
  },
  demo: {
    api: 'https://base-api-demo.buychain.tech',
    auth_api: 'https://auth-api-demo.buychain.tech',
    media_api: 'https://media-api-demo.buychain.tech',
    search_api: 'https://search-api-demo.buychain.tech',
    documents_api: 'https://documents-api-demo.buychain.tech',
    reports_api: 'https://reports-api-demo.buychain.tech',
    accounting_api: 'https://accounting-api-demo.buychain.tech',
    accounting_attachments_api: 'http://accounting-attachments-api-demo.buychain.tech'
  }
};

const env = 'local';

export const environment = {
  name: 'DEVELOPMENT',
  production: false,
  apiHost: config[env].api,
  authApiHost: config[env].auth_api,
  mediaApiHost: config[env].media_api,
  //documentsApiHost: config[env].documents_api,
  searchApiHost: config[env].search_api,
  //reportsApiHost: config[env].reports_api,
  accountingApiHost: config[env].accounting_api,
  //accountingAttachmentsApiHost: config[env].accounting_attachments_api,
  clientSecret: 'NXJxaDFkcXZrN3JmdDdpYjZlaDBhbHY1bXUydjRmOkpKdW00NldvV2NNeW5vVTFDV2xraEw=',
  apiVersion: 'v1',
  restUrl() {
    return this.apiVersion;
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

/*
 * In development mode, to ignore zone related error stack frames such as
 * `zone.run`, `zoneDelegate.invokeTask` for easier debugging, you can
 * import the following file, but please comment it out in production mode
 * because it will have performance impact when throw error
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
