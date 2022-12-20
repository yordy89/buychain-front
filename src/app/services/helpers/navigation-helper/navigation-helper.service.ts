import { Injectable } from '@angular/core';
import { Params, Router } from '@angular/router';
import { Environment } from '@services/app-layer/app-layer.environment';
import { Layout } from '@services/helpers/layout-helper/layout-helper.service';
import { TransactionEntity } from '@app/services/app-layer/entities/transaction';
import { OrderEntity } from '@app/services/app-layer/entities/order';
import { InventoryViewEnum } from '@services/app-layer/app-layer.enums';

export enum CompanySettingsExpandableSection {
  Company = 'COMPANY',
  Facilities = 'FACILITIES',
  RateTables = 'RATE_TABLES',
  UserManagement = 'USER_MANAGEMENT',
  LabelManagement = 'LABEL_MANAGEMENT',
  Finance = 'FINANCE',
  Groups = 'GROUPS'
}

@Injectable({ providedIn: 'root' })
export class NavigationHelperService {
  private tempRedirectUrl = null;

  constructor(private router: Router) {}

  navigateHome(params?: any): Promise<boolean> {
    return this.router.navigate(['home'], { queryParams: params ? { username: params.username } : {} });
  }

  navigateSignIn(): void {
    this.router.navigate(['auth/signin']);
  }

  navigateSignUp(): void {
    this.router.navigate(['auth/signup']);
  }

  goToMainLayout(layout: Layout): void {
    this.router.navigate([layout]);
  }
  // Before calling this method make sure tempRedirectUrl exists.
  goToTempRedirectUrl(): void {
    const url = this.getTempRedirectUrl();
    this.removeTempRedirectUrl();
    this.router.navigateByUrl(url);
  }

  navigateUserHome(): void {
    this.router.navigate([`dashboard`]);
  }
  navigateUserProfile(): void {
    const user = Environment.getCurrentUser();
    this.router.navigate([`profile/${user.id}/details`]);
  }

  /*
   * Company
   * */
  navigateCompanySettings(expanded: string = CompanySettingsExpandableSection.Company): void {
    this.router.navigate([`company/settings`], { queryParams: { expanded } });
  }

  navigateCompanyRateTableDetails(rateTableId: string): void {
    if (!rateTableId) console.error('Rate table id should be defined');
    this.router.navigate([`company/settings/rate-tables/${rateTableId}`]);
  }
  navigateCompanyFacilityDetails(facilityId: string): void {
    if (!facilityId) console.error('Facility id should be defined');
    this.router.navigate([`company/settings/facilities/${facilityId}`]);
  }
  navigateCompanyGroupDetails(groupId: string): void {
    if (!groupId) console.error('Group id should be defined');
    this.router.navigate([`company/settings/groups/${groupId}`]);
  }
  navigateCompanyMemberDetails(memberId: string): void {
    if (!memberId) console.error('Member id should be defined');
    this.router.navigate([`company/settings/members/${memberId}`]);
  }

  /*
   * Inventory
   * */

  navigateToInventoryLotDetails(lotId: string): void {
    if (!lotId) console.error('Lot id should be defined');
    this.router.navigate([`inventory/inventory-overview/${lotId}`]);
  }

  navigateToInventoryMasterView(): void {
    const queryParams: Params = { view: InventoryViewEnum.MasterView };
    this.router.navigate([`inventory/inventory-overview`], { queryParams: queryParams });
  }

  /*
   * Order
   * */
  navigateNewOrder(): void {
    this.router.navigate([`order/new`]);
  }

  navigateToTheOrder(orderData: OrderEntity, transaction?: TransactionEntity): void {
    this.router.navigate([`order/${orderData.id}`], {
      queryParams: transaction ? { transactionId: transaction.id } : {}
    });
  }

  navigateToOrdersOverview(): void {
    this.router.navigate([`order/overview`]);
  }

  navigateToTransaction(transaction: TransactionEntity): void {
    this.router.navigate([`order/transaction/${transaction.id}`]);
  }

  navigateToTransactionById(transactionId: string): void {
    this.router.navigate([`order/transaction/${transactionId}`]);
  }

  getLinkToTransaction(transactionId: string): string {
    return `order/transaction/${transactionId}`;
  }

  /*
   * CRM
   * */

  navigateToCrm() {
    this.router.navigate([`crm`]);
  }

  navigateToCrmEntity(id: string) {
    this.router.navigate([`crm/${id}`]);
  }

  getCurrentRouteUrl() {
    return location.href.replace(location.origin, '');
  }

  /*
   * Redirect Url Helpers
   * */

  getTempRedirectUrl(): string {
    return this.tempRedirectUrl;
  }

  setTempRedirectUrl(url: string): void {
    if (!this.tempRedirectUrl && url !== '/auth/signin') this.tempRedirectUrl = url;
  }

  removeTempRedirectUrl(): void {
    this.tempRedirectUrl = null;
  }

  isTempRedirectUrlSet(): boolean {
    return !!this.tempRedirectUrl;
  }
}
