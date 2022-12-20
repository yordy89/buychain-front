import { Injectable } from '@angular/core';
import { FilterBuilderHelper } from '@services/helpers/utils/filter-builder-helper';
import { APBillsFilters } from '@views/main/accounting/accounts-payable/bills/components/bills-filters/bills-filters.component';
import { AccountsService } from '@services/app-layer/accounts/accounts.service';
import { first, map } from 'rxjs/operators';
import { CrmService } from '@services/app-layer/crm/crm.service';
import { CompaniesService } from '@services/app-layer/companies/companies.service';
import { Environment } from '@services/app-layer/app-layer.environment';
import { AccessControlScope } from '@services/app-layer/permission/permission.interface';
import { AccountingAttachmentsService } from '@services/app-layer/accounting-attachments/accounting-attachments.service';
import { BillsApiService } from '@services/app-layer/bills/bills-api.services';
import { PurchaseOrdersApiService } from '@services/app-layer/purchase-orders/purchase-orders-api.service';
import { GroupsService } from '@services/app-layer/groups/groups.service';

@Injectable({
  providedIn: 'root'
})
export class BillsService {
  constructor(
    private billsApiService: BillsApiService,
    private accountsService: AccountsService,
    private purchaseOrdersApiService: PurchaseOrdersApiService,
    private attachmentsService: AccountingAttachmentsService,
    private crmService: CrmService,
    private companiesService: CompaniesService,
    private groupsService: GroupsService
  ) {}

  getBillPermissions() {
    const normalizedRoles = Environment.getCurrentUser().normalizedAccessControlRoles;
    const accountPermissions = normalizedRoles?.ACCOUNT?.accountSection?.sectionGroup;
    const crmAccountsPermissions = normalizedRoles?.CRM_ACCOUNT?.CRMSection?.sectionGroup;
    const readBillPermissions = normalizedRoles?.BILL.readBillSection.sectionGroup;
    const billPermissions = normalizedRoles?.BILL.billSection.sectionGroup;

    const canReadAccounts = accountPermissions?.read.value === AccessControlScope.Company;
    const canReadCrmAccounts =
      crmAccountsPermissions.readEntry.value === AccessControlScope.Company ||
      crmAccountsPermissions.readEntry.value === AccessControlScope.Owner;
    const canReadBills = readBillPermissions.read.value === AccessControlScope.Company;

    return {
      canRead: canReadBills && canReadCrmAccounts && canReadAccounts,
      canCreate: billPermissions.create.value === AccessControlScope.Company,
      canUpdate: billPermissions.update.value === AccessControlScope.Company,
      canDelete: billPermissions.delete.value === AccessControlScope.Company
    };
  }

  getLineItemPermissions() {
    const normalizedRoles = Environment.getCurrentUser().normalizedAccessControlRoles;
    const billLineItemPermissions = normalizedRoles?.BILL.billLineItemSection.sectionGroup;

    return {
      canCreateLineItem: billLineItemPermissions.create.value === AccessControlScope.Company,
      canUpdateLineItem: billLineItemPermissions.update.value === AccessControlScope.Company,
      canDeleteLineItem: billLineItemPermissions.delete.value === AccessControlScope.Company
    };
  }

  getPaymentPermissions() {
    const normalizedRoles = Environment.getCurrentUser().normalizedAccessControlRoles;
    const billPaymentPermissions = normalizedRoles?.BILL.billPaymentSection.sectionGroup;

    return {
      canCreatePayment: billPaymentPermissions.create.value === AccessControlScope.Company,
      canUpdatePayment: billPaymentPermissions.update.value === AccessControlScope.Company,
      canDeletePayment: billPaymentPermissions.delete.value === AccessControlScope.Company
    };
  }

  getBills(limit: number, offset: number, filters: APBillsFilters) {
    const advancedFilters: APBillsFilters = {
      ...filters,
      dueDate: FilterBuilderHelper.getDateForRange(filters.dueDate)?.toISOString()
    };
    return this.billsApiService.getBills(limit, offset, advancedFilters);
  }

  getBillFromPurchaseOrder(billId: string) {
    return this.purchaseOrdersApiService.getPurchaseOrders(1000, 0, { billsIds: [billId] }).pipe(
      first(),
      map(purchaseOrders => {
        const purchaseOrder = purchaseOrders[0];
        const bill = purchaseOrder.bills.find(entry => entry.id === billId);
        return { bill, purchaseOrder };
      })
    );
  }

  getPurchaseOrder(purchaseOrderId: string) {
    return this.purchaseOrdersApiService.getPurchaseOrder(purchaseOrderId);
  }

  getAccounts() {
    const limit = 1000;
    const offset = 0;
    return this.accountsService.getAccounts(limit, offset);
  }

  getMembers() {
    return this.companiesService.getCompanyCompleteMembers().pipe(map(items => items.filter(m => m.firstName)));
  }

  getCompanyGroups() {
    return this.groupsService.getCompanyGroups().pipe(
      map(groups => {
        groups = groups.sort((a, b) => {
          const aName = (a?.name || '').trim();
          const bName = (b?.name || '').trim();
          return aName.localeCompare(bName);
        });
        return [].concat(groups);
      })
    );
  }
}
