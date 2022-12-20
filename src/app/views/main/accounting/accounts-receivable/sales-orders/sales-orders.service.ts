import { Injectable } from '@angular/core';
import { Environment } from '@services/app-layer/app-layer.environment';
import { CompaniesService } from '@services/app-layer/companies/companies.service';
import { CrmService } from '@services/app-layer/crm/crm.service';
import { DimensionsService } from '@services/app-layer/dimensions/dimensions.service';
import { GroupsService } from '@services/app-layer/groups/groups.service';
import { AccessControlScope } from '@services/app-layer/permission/permission.interface';
import { SalesOrdersApiService } from '@services/app-layer/sales-orders/sales-orders-api.service';
import { SearchService } from '@services/app-layer/search/search.service';
import { TransactionsService } from '@services/app-layer/transactions/transactions.service';
import { getPalette } from 'devextreme/viz/palette';
import { map } from 'rxjs/operators';
import { ObjectUtil } from '@services/helpers/utils/object-util';
import { Observable, of } from 'rxjs';
import { ARSalesOrdersFilters } from '@views/main/accounting/accounts-receivable/sales-orders/components/sales-orders-filters/sales-orders-filters.component';
import { FilterBuilderHelper } from '@services/helpers/utils/filter-builder-helper';
import { InvoicesApiService } from '@services/app-layer/invoices/invoices-api.services';
import { ARInvoice, ARSalesOrder } from '@services/app-layer/entities/accounts-receivable';

export interface ChartSeriesItem {
  name: string;
  valueField: string;
  visible?: boolean;
  color?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SalesOrdersService {
  palette = getPalette('Soft Pastel').simpleSet;
  stackedBarChartsColors = {
    'profit/billed': this.palette[5],
    loss: '#e23b3e',
    revenue: this.palette[0],
    expense: this.palette[1],
    'total-billing': this.palette[4],
    unbilled: this.palette[6]
  };

  profitItemsList: ChartSeriesItem[] = [
    { name: 'Revenue', valueField: 'revenue', visible: false, color: this.stackedBarChartsColors.revenue },
    { name: 'Expense', valueField: 'expense', visible: true, color: this.stackedBarChartsColors.expense },
    { name: 'Profit/(Loss)', valueField: 'profit', visible: true, color: this.stackedBarChartsColors['profit/billed'] }
  ];

  statusItemsList: ChartSeriesItem[] = [
    { name: 'Line Items Unbilled', valueField: 'unbilled', visible: true, color: this.stackedBarChartsColors.unbilled },
    {
      name: 'Line Items Billed',
      valueField: 'billed',
      visible: true,
      color: this.stackedBarChartsColors['profit/billed']
    },
    { name: 'Total Billing', valueField: 'total', visible: false, color: this.stackedBarChartsColors['total-billing'] }
  ];

  constructor(
    private dimensionsService: DimensionsService,
    private salesOrdersApiService: SalesOrdersApiService,
    private invoicesApiService: InvoicesApiService,
    private companiesService: CompaniesService,
    private crmService: CrmService,
    private groupsService: GroupsService,
    private searchService: SearchService,
    private transactionsService: TransactionsService
  ) {}

  getSalesOrders(limit: number, offset: number, filters: ARSalesOrdersFilters) {
    const advancedFilters: ARSalesOrdersFilters = {
      ...filters,
      dateFrom: FilterBuilderHelper.getDateForRange(filters.dateFrom)?.toISOString(),
      dateTo: FilterBuilderHelper.getDateForRange(filters.dateTo, true)?.toISOString()
    };
    return this.salesOrdersApiService.getSalesOrders(limit, offset, advancedFilters);
  }

  getSalesOrder(id: string) {
    return this.salesOrdersApiService.getSalesOrderById(id);
  }

  addSalesOrder(payload) {
    return this.salesOrdersApiService.addSalesOrder(payload);
  }

  editSalesOrder(id: string, payload) {
    return this.salesOrdersApiService.editSalesOrder(id, payload);
  }

  deleteSalesOrder(id: string) {
    return this.salesOrdersApiService.deleteSalesOrder(id);
  }

  getLineItem(salesOrderId: string, lineItemId: string, invoiceId: string) {
    if (invoiceId) {
      return this.invoicesApiService.getInvoiceLineItem(invoiceId, lineItemId);
    }
    return this.salesOrdersApiService.getSalesOrderOpenLineItem(salesOrderId, lineItemId);
  }

  closeSalesOrder(id: string) {
    return this.salesOrdersApiService.closeSalesOrder(id);
  }

  addSalesOrderOpenLineItem(salesOrderId: string, paylaod) {
    return this.salesOrdersApiService.addSalesOrderOpenLineItem(salesOrderId, paylaod);
  }

  editLineItem(
    salesOrderId: string,
    lineItemId: string,
    payload,
    invoiceId: string
  ): Observable<ARSalesOrder | ARInvoice> {
    if (invoiceId) {
      return this.invoicesApiService.editInvoiceLineItem(invoiceId, lineItemId, payload);
    }
    return this.salesOrdersApiService.editSalesOrderOpenLineItem(salesOrderId, lineItemId, payload);
  }

  deleteLineItem(salesOrderId: string, lineItemId: string, invoiceId: string) {
    if (invoiceId) {
      return this.invoicesApiService.deleteInvoiceLineItem(invoiceId, lineItemId);
    }
    return this.salesOrdersApiService.deleteSalesOrderOpenLineItem(salesOrderId, lineItemId);
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

  deleteInvoice(id: string) {
    return this.invoicesApiService.deleteInvoice(id);
  }

  addInvoiceLineItemFromSalesOrder(invoiceId: string, paylaod) {
    return this.invoicesApiService.addInvoiceLineItemFromSalesOrder(invoiceId, paylaod);
  }

  getSalesOrderPermissions() {
    const normalizedRoles = Environment.getCurrentUser().normalizedAccessControlRoles;
    const accountPermissions = normalizedRoles?.ACCOUNT?.accountSection?.sectionGroup;
    const dimensionPermissions = normalizedRoles?.DIMENSION?.dimensionSection?.sectionGroup;
    const groupPermissions = normalizedRoles?.GROUP?.groupSection?.sectionGroup;
    const crmAccountsPermissions = normalizedRoles?.CRM_ACCOUNT?.CRMSection?.sectionGroup;
    const transactionPermissions = normalizedRoles?.TRANSACTION.transactionSection.sectionGroup;
    const readSalesOrderPermissions = normalizedRoles?.SALES_ORDER.readSalesOrderSection.sectionGroup;
    const salesOrderPermissions = normalizedRoles?.SALES_ORDER.salesOrderSection.sectionGroup;

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
    const canReadSalesOrders = readSalesOrderPermissions.read.value === AccessControlScope.Company;

    const canRead =
      canReadCrmAccountsPaymentInfo &&
      canReadDimensions &&
      canReadGroups &&
      canReadCrmAccounts &&
      canReadTransactions &&
      canReadAccounts &&
      canReadSalesOrders;

    return {
      canRead,
      canCreate: salesOrderPermissions.create.value === AccessControlScope.Company,
      canUpdate: salesOrderPermissions.update.value === AccessControlScope.Company,
      canDelete: salesOrderPermissions.delete.value === AccessControlScope.Company,
      canClose: salesOrderPermissions.close.value === AccessControlScope.Company
    };
  }

  getOpenLineItemPermissions() {
    const normalizedRoles = Environment.getCurrentUser().normalizedAccessControlRoles;
    const salesOrderLineItemPermissions = normalizedRoles?.SALES_ORDER.salesOrderLineItemSection.sectionGroup;

    return {
      canCreateOpenLineItem: salesOrderLineItemPermissions.create.value === AccessControlScope.Company,
      canUpdateOpenLineItem: salesOrderLineItemPermissions.update.value === AccessControlScope.Company,
      canDeleteOpenLineItem: salesOrderLineItemPermissions.delete.value === AccessControlScope.Company
    };
  }

  getInvoicePermissions() {
    const normalizedRoles = Environment.getCurrentUser().normalizedAccessControlRoles;
    const readInvoicePermissions = normalizedRoles?.INVOICE.readInvoiceSection.sectionGroup;
    const invoicePermissions = normalizedRoles?.INVOICE.invoiceSection.sectionGroup;
    const accountPermissions = normalizedRoles?.ACCOUNT?.accountSection?.sectionGroup;

    const canReadAccounts = accountPermissions?.read.value === AccessControlScope.Company;
    const canReadInvoices = readInvoicePermissions.read.value === AccessControlScope.Company;

    return {
      canReadInvoice: canReadInvoices && canReadAccounts,
      canCreateInvoice: invoicePermissions.create.value === AccessControlScope.Company,
      canUpdateInvoice: invoicePermissions.update.value === AccessControlScope.Company,
      canDeleteInvoice: invoicePermissions.delete.value === AccessControlScope.Company
    };
  }

  generateProfitLegendsList(chart, profitData) {
    if (!chart) {
      return;
    }

    const [data] = profitData;

    if (data.profit < 0) {
      this.profitItemsList[2].color = this.stackedBarChartsColors.loss;
    }

    return this.profitItemsList.map(({ color, name, valueField }) => ({
      color,
      key: name,
      total: data[valueField]
    }));
  }

  generateStatusLegendsList(chart, statusData) {
    if (!chart) {
      return;
    }
    return this.statusItemsList.map(({ valueField, name, color }) => ({
      color,
      key: name,
      total: statusData[0][valueField]
    }));
  }

  getRearrangedProfitItemsList(profitData) {
    const [{ profit }] = profitData;
    const profitItemsList = ObjectUtil.getDeepCopy(this.profitItemsList);
    if (profit < 0) {
      const temp = profitItemsList[1];
      profitItemsList[1] = profitItemsList[2];
      profitItemsList[2] = temp;
    }
    return profitItemsList;
  }
}
