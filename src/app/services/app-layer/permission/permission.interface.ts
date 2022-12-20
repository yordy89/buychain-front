export interface AccessControlSystem {
  ACCOUNT: AccountingAccountAccessControlSection;
  BILL: AccountingBillAccessControlSection;
  COMPANY: CompanyAccessControlsSection;
  CRM_ACCOUNT: CRMAccessControlsSection;
  DIMENSION: AccountingDimensionAccessControlSection;
  FACILITY: FacilityAccessControlsSection;
  GROUP: GroupAccessControlSection;
  INVOICE: AccountingInvoiceAccessControlSection;
  JOURNAL_ENTRY: AccountingJournalEntryAccessControlSection;
  LABEL: LabelAccessControlSection;
  PRODUCT: ProductAccessControlsSection;
  PURCHASE_ORDER: AccountingPurchaseOrderAccessControlSection;
  RATE_TABLE: RateTableAccessControlsSection;
  SALES_ORDER: AccountingSalesOrderAccessControlSection;
  TRANSACTION: TransactionAccessControlsSection;
}

export interface CompanyAccessControlsSection {
  companySection: AccessControlSection;
  readCompanySection: AccessControlSection;
  readUsersSection: AccessControlSection;
  userSection: AccessControlSection;
}
export interface FacilityAccessControlsSection {
  facilitySection: AccessControlSection;
}
export interface RateTableAccessControlsSection {
  readRateTableSection: AccessControlSection;
  rateTableSection: AccessControlSection;
}
export interface LabelAccessControlSection {
  labelSection: AccessControlSection;
}
export interface GroupAccessControlSection {
  groupSection: AccessControlSection;
}
export interface ProductAccessControlsSection {
  createSection: AccessControlSection;
  searchSection: AccessControlSection;
  updateSection: AccessControlSection;
}
export interface TransactionAccessControlsSection {
  transactionSection: AccessControlSection;
}
export interface CRMAccessControlsSection {
  createCRMSection: AccessControlSection;
  CRMSection: AccessControlSection;
}
export interface SearchAccessControlSection {
  searchSection: AccessControlSection;
}
export interface AccountingAccountAccessControlSection {
  accountSection: AccessControlSection;
}
export interface AccountingDimensionAccessControlSection {
  dimensionSection: AccessControlSection;
}

export interface AccountingJournalEntryAccessControlSection {
  journalEntrySection: AccessControlSection;
}

export interface AccountingInvoiceAccessControlSection {
  readInvoiceSection: AccessControlSection;
  invoiceSection: AccessControlSection;
  invoiceLineItemSection: AccessControlSection;
  invoicePaymentSection: AccessControlSection;
}

export interface AccountingSalesOrderAccessControlSection {
  readSalesOrderSection: AccessControlSection;
  salesOrderSection: AccessControlSection;
  salesOrderLineItemSection: AccessControlSection;
}

export interface AccountingPurchaseOrderAccessControlSection {
  readPurchaseOrderSection: AccessControlSection;
  purchaseOrderSection: AccessControlSection;
  purchaseOrderLineItemSection: AccessControlSection;
}

export interface AccountingBillAccessControlSection {
  readBillSection: AccessControlSection;
  billSection: AccessControlSection;
  billLineItemSection: AccessControlSection;
  billPaymentSection: AccessControlSection;
}

export interface AccessControlSection {
  sectionName: string;
  sectionAllowedValues: { value: AccessControlScope; order: number }[];
  sectionGroup: any;
}
export interface AccessControlGroup {
  groupName: string;
  groupUnits: string[];
  description: string;
  value: AccessControlScope;
  orderNumber: number;
}

/*
 * Enums
 * */

export enum AccessControlScope {
  Owner = 'OWNER',
  Company = 'COMPANY',
  None = 'NONE'
}

// Profiles
export enum AccessControlProfile {
  Default = 'DEFAULT',
  Trader = 'TRADER',
  BackOffice = 'BACK_OFFICE',
  Finance = 'FINANCE',
  Manager = 'MANAGER',
  Logistics = 'LOGISTICS',
  Custom = 'CUSTOM',
  All = 'ALL'
}
export interface AccessControlData {
  label: AccessControlProfile;
  name: string;
  description: string;
  profile: AccessControlSystem | any;
}
