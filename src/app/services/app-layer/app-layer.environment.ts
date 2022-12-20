import { Skin } from './entities/skin';
import { CompanyDetails } from '../data-layer/http-api/base-api/swagger-gen';
import { User } from './entities/user';
import { environment } from '@env/environment';
import { EnvironmentEnum } from './app-layer.enums';
import { EventEmitter } from '@angular/core';
import { minutesToMilliseconds } from 'date-fns';

export class Environment {
  public static currentVersion = '0.28.4';

  // release 2107
  private static currentUser: User;
  static currentUserUpdated = new EventEmitter<User>();
  static currentCompany: CompanyDetails;

  static skin: Skin;
  static logoUrl = 'assets/images/buyChain-logo.png';

  static readonly cachedDataResetTime = minutesToMilliseconds(5);

  static readonly maxSafeNumber = 999999999999999;
  static readonly maxIntegerSafeNumber = 2147483647;

  static readonly randomLengthCutType = 'Random Length Unit';

  private static uiProducts;

  static setCurrentUser(user: User) {
    this.currentUser = user;
    this.currentUserUpdated.emit(this.currentUser);
  }

  static getCurrentUser(): User {
    return this.currentUser;
  }

  static setCurrentCompany(company) {
    this.currentCompany = company;
    this.setLogoUrl(company.logoUrl);
  }

  static getCurrentCompany() {
    return this.currentCompany;
  }

  static getCompanyFeatures() {
    return this.currentCompany ? this.currentCompany.features : {};
  }

  static isOnlyOffline(): boolean {
    return !this.getCompanyFeatures().marketData || !this.getCompanyFeatures().onlineTransactions;
  }

  static isContractsSupported(): boolean {
    return this.getCompanyFeatures().contractInventory;
  }

  static isAccountingSupported(): boolean {
    return this.getCompanyFeatures().accounting;
  }

  static setUiProducts(data) {
    this.uiProducts = data;
  }

  static getUiProducts() {
    return this.uiProducts;
  }

  static setLogoUrl(url) {
    this.logoUrl = url ? url : 'assets/images/buyChain-logo.png';
  }

  static get environment(): EnvironmentEnum {
    return <EnvironmentEnum>environment.name;
  }

  static get isProduction() {
    return this.environment === EnvironmentEnum.Production;
  }

  static get isDemo() {
    return this.environment === EnvironmentEnum.Demo;
  }

  static get isDevelopment() {
    return this.environment === EnvironmentEnum.Development;
  }

  static linkToAdminUi(): string {
    if (this.isDevelopment) return 'http://admin-dev.buychain.tech/companies';
    if (this.isDemo) return 'http://admin-demo.buychain.tech/companies';
    if (this.isProduction) return 'http://admin-app.buychain.co/companies';
  }
  static linkToApplicationUi(): string {
    if (this.isDevelopment) return 'http://dev.buychain.tech/';
    if (this.isDemo) return 'https://demo.buychain.tech/';
    if (this.isProduction) return 'https://app.buychain.co/';
  }

  static get isCustomDomain() {
    const knownHosts = ['localhost', 'dev.buychain.tech', 'demo.buychain.tech', 'app.buychain.co'];

    const currentHost = location.hostname;

    return !knownHosts.includes(currentHost);
  }
}
