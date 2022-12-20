import { Injectable } from '@angular/core';
import { Environment } from '@services/app-layer/app-layer.environment';
import { AccessControlScope } from '@services/app-layer/permission/permission.interface';
import { InvoicesApiService } from '@services/app-layer/invoices/invoices-api.services';
import { CrmService } from '@services/app-layer/crm/crm.service';

@Injectable({
  providedIn: 'root'
})
export class CreditMemosService {
  constructor(private invoicesApiService: InvoicesApiService, private crmService: CrmService) {}

  getPermissions() {
    const normalizedRoles = Environment.getCurrentUser().normalizedAccessControlRoles;
    const readSalesOrderPermissions = normalizedRoles?.SALES_ORDER.readSalesOrderSection.sectionGroup;
    // const creditMemoPermissions = normalizedRoles?.CREDIT_MEMO.creditMemoSection.sectionGroup;

    const canReadSalesOrders = readSalesOrderPermissions.read.value === AccessControlScope.Company;
    // const canReadCreditMemos = creditMemoPermissions.read.value === AccessControlScope.Company;
    const canReadCreditMemos = true;

    return {
      canRead: canReadCreditMemos && canReadSalesOrders,
      canCreate: true,
      canUpdate: true,
      canDelete: true,
      canReview: true,
      canApply: true
    };
  }

  getDataRequestsArray() {
    const limit = 1000;
    const offset = 0;
    return [this.crmService.getAccounts(true), this.invoicesApiService.getInvoices(limit, offset, {})];
  }
}
