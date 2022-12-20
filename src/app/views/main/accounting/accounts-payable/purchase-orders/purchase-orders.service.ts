import { Injectable } from '@angular/core';
import { Environment } from '@services/app-layer/app-layer.environment';
import { CompaniesService } from '@services/app-layer/companies/companies.service';
import { CrmService } from '@services/app-layer/crm/crm.service';
import { DimensionsService } from '@services/app-layer/dimensions/dimensions.service';
import { GroupsService } from '@services/app-layer/groups/groups.service';
import { AccessControlScope } from '@services/app-layer/permission/permission.interface';
import { SearchService } from '@services/app-layer/search/search.service';
import { TransactionsService } from '@services/app-layer/transactions/transactions.service';
import { map } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { FilterBuilderHelper } from '@services/helpers/utils/filter-builder-helper';
import { PurchaseOrdersApiService } from '@services/app-layer/purchase-orders/purchase-orders-api.service';
import { APPurchaseOrdersFilters } from '@views/main/accounting/accounts-payable/purchase-orders/component/purchase-orders-filters/purchase-orders-filters.component';
import { APBill, APPurchaseOrder } from '@services/app-layer/entities/accounts-payable';
import { BillsApiService } from '@services/app-layer/bills/bills-api.services';
import { FacilitiesService } from '@services/app-layer/facilities/facilities.service';

@Injectable({
  providedIn: 'root'
})
export class PurchaseOrdersService {
  constructor(
    private dimensionsService: DimensionsService,
    private purchaseOrdersApiService: PurchaseOrdersApiService,
    private billsApiService: BillsApiService,
    private companiesService: CompaniesService,
    private crmService: CrmService,
    private groupsService: GroupsService,
    private searchService: SearchService,
    private transactionsService: TransactionsService,
    private facilitiesService: FacilitiesService
  ) {}

  getPurchaseOrders(limit: number, offset: number, filters: APPurchaseOrdersFilters) {
    const advancedFilters: APPurchaseOrdersFilters = {
      ...filters,
      dateFrom: FilterBuilderHelper.getDateForRange(filters.dateFrom)?.toISOString(),
      dateTo: FilterBuilderHelper.getDateForRange(filters.dateTo, true)?.toISOString()
    };
    return this.purchaseOrdersApiService.getPurchaseOrders(limit, offset, advancedFilters);
  }

  getCompanyGroups() {
    return this.groupsService.getCompanyGroups().pipe(
      map(groups => {
        groups = groups.sort((a, b) => {
          const aName = (a?.name || '').trim();
          const bName = (b?.name || '').trim();
          return aName.localeCompare(bName);
        });
        return [].concat({ id: null, name: 'Global', parentTree: [] }).concat(groups);
      })
    );
  }

  getDataRequestsArray() {
    const limit = 1000;
    const offset = 0;
    return [
      this.dimensionsService.getDimensions(limit, offset),
      this.getCompanyGroups(),
      this.crmService.getAccounts(true),
      this.companiesService.getCompanyCompleteMembers().pipe(map(items => items.filter(m => m.firstName)))
    ];
  }

  getFacilities() {
    return this.facilitiesService
      .getCompanyFacilitiesAll(Environment.getCurrentUser().companyId)
      .pipe(map(items => items.filter(f => !f.archived)));
  }

  getTransactions(ids: string[]) {
    const payload = {
      filters: {
        children: {
          logicalOperator: 'or',
          items: ids.map(id => ({ value: { comparisonOperator: 'eq', field: 'id', fieldValue: id } }))
        }
      }
    };
    return this.searchService.fetchTransactionData(payload);
  }

  getTransactionById(id: string) {
    if (id) {
      return this.transactionsService.loadTransactionById(id);
    }

    return of(null);
  }

  getCrmLocations(includeArchived) {
    return this.crmService.getLocations(includeArchived);
  }

  getCrmContacts(includeArchived) {
    return this.crmService.getContacts(includeArchived);
  }

  getCrmCreditInfo(accountId: string) {
    return this.crmService.getAccountCreditInfo(accountId);
  }

  getCrmPaymentInfo(accountId: string) {
    return this.crmService.getAccountPaymentInfo(accountId);
  }

  getPurchaseOrderPermissions() {
    const normalizedRoles = Environment.getCurrentUser().normalizedAccessControlRoles;
    const accountPermissions = normalizedRoles?.ACCOUNT?.accountSection?.sectionGroup;
    const dimensionPermissions = normalizedRoles?.DIMENSION?.dimensionSection?.sectionGroup;
    const groupPermissions = normalizedRoles?.GROUP?.groupSection?.sectionGroup;
    const crmAccountsPermissions = normalizedRoles?.CRM_ACCOUNT?.CRMSection?.sectionGroup;
    const transactionPermissions = normalizedRoles?.TRANSACTION.transactionSection.sectionGroup;
    const readPurchaseOrderPermissions = normalizedRoles?.PURCHASE_ORDER.readPurchaseOrderSection.sectionGroup;
    const purchaseOrderPermissions = normalizedRoles?.PURCHASE_ORDER.purchaseOrderSection.sectionGroup;

    const canReadDimensions = dimensionPermissions?.read.value === AccessControlScope.Company;
    const canReadAccounts = accountPermissions?.read.value === AccessControlScope.Company;
    const canReadGroups = groupPermissions?.read.value === AccessControlScope.Company;
    const canReadCrmAccounts =
      crmAccountsPermissions.readEntry.value === AccessControlScope.Company ||
      crmAccountsPermissions.readEntry.value === AccessControlScope.Owner;
    const canReadCrmAccountsPaymentInfo =
      crmAccountsPermissions.readPaymentInfo.value === AccessControlScope.Company ||
      crmAccountsPermissions.readPaymentInfo.value === AccessControlScope.Owner;
    const canReadTransactions =
      transactionPermissions.readList.value === AccessControlScope.Company ||
      transactionPermissions.readList.value === AccessControlScope.Owner;
    const canReadPurchaseOrders = readPurchaseOrderPermissions.read.value === AccessControlScope.Company;

    const canRead =
      canReadCrmAccountsPaymentInfo &&
      canReadDimensions &&
      canReadGroups &&
      canReadCrmAccounts &&
      canReadTransactions &&
      canReadAccounts &&
      canReadPurchaseOrders;

    return {
      canRead,
      canCreate: purchaseOrderPermissions.create.value === AccessControlScope.Company,
      canUpdate: purchaseOrderPermissions.update.value === AccessControlScope.Company,
      canDelete: purchaseOrderPermissions.delete.value === AccessControlScope.Company,
      canClose: purchaseOrderPermissions.close.value === AccessControlScope.Company
    };
  }

  getOpenLineItemPermissions() {
    const normalizedRoles = Environment.getCurrentUser().normalizedAccessControlRoles;
    const purchaseOrderLineItemPermissions = normalizedRoles?.PURCHASE_ORDER.purchaseOrderLineItemSection.sectionGroup;

    return {
      canCreateOpenLineItem: purchaseOrderLineItemPermissions.create.value === AccessControlScope.Company,
      canUpdateOpenLineItem: purchaseOrderLineItemPermissions.update.value === AccessControlScope.Company,
      canDeleteOpenLineItem: purchaseOrderLineItemPermissions.delete.value === AccessControlScope.Company
    };
  }

  getBillPermissions() {
    const normalizedRoles = Environment.getCurrentUser().normalizedAccessControlRoles;
    const readBillPermissions = normalizedRoles?.BILL.readBillSection.sectionGroup;
    const billPermissions = normalizedRoles?.BILL.billSection.sectionGroup;
    const accountPermissions = normalizedRoles?.ACCOUNT?.accountSection?.sectionGroup;

    const canReadAccounts = accountPermissions?.read.value === AccessControlScope.Company;
    const canReadBills = readBillPermissions.read.value === AccessControlScope.Company;

    return {
      canReadBill: canReadBills && canReadAccounts,
      canCreateBill: billPermissions.create.value === AccessControlScope.Company,
      canUpdateBill: billPermissions.update.value === AccessControlScope.Company,
      canDeleteBill: billPermissions.delete.value === AccessControlScope.Company
    };
  }

  getLineItem(purchaseOrderId: string, lineItemId: string, billId: string) {
    if (billId) {
      return this.billsApiService.getBillLineItem(billId, lineItemId);
    }
    return this.purchaseOrdersApiService.getPurchaseOrderOpenLineItem(purchaseOrderId, lineItemId);
  }

  editLineItem(
    purchaseOrderId: string,
    lineItemId: string,
    payload,
    billId: string
  ): Observable<APPurchaseOrder | APBill> {
    if (billId) {
      return this.billsApiService.editBillLineItem(billId, lineItemId, payload);
    }
    return this.purchaseOrdersApiService.editPurchaseOrderOpenLineItem(purchaseOrderId, lineItemId, payload);
  }

  deleteLineItem(purchaseOrderId: string, lineItemId: string, billId: string) {
    if (billId) {
      return this.billsApiService.deleteBillLineItem(billId, lineItemId);
    }
    return this.purchaseOrdersApiService.deletePurchaseOrderOpenLineItem(purchaseOrderId, lineItemId);
  }
}
