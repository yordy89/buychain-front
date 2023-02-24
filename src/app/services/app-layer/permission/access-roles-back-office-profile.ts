import { AccessControlScope } from '@services/app-layer/permission/permission.interface';

export const accessRolesBackOfficeProfile = {
  COMPANY: {
    ADD_COMPANY_PENDING_MEMBER_ACTIVATION: AccessControlScope.None,
    GET_COMPANY: AccessControlScope.Company,
    GET_COMPANY_MEMBER: AccessControlScope.None,
    LIST_COMPANY_MEMBERS: AccessControlScope.Company,
    LIST_COMPANY_PENDING_MEMBERS: AccessControlScope.None,
    UPDATE_COMPANY: AccessControlScope.None,
    UPDATE_COMPANY_ACCOUNTING_PRACTICES: AccessControlScope.None,
    UPDATE_COMPANY_ACCOUNTING_PRACTICES_DEFAULT_ACCOUNTS: AccessControlScope.None,
    UPDATE_COMPANY_MEMBER_GROUP: AccessControlScope.None,
    UPDATE_COMPANY_PRIVACY_SETTINGS: AccessControlScope.None,
    UPDATE_COMPANY_SALES_PRACTICES: AccessControlScope.None,
    UPDATE_COMPANY_MEMBER_PRIVACY_SETTINGS: AccessControlScope.None,
    UPDATE_COMPANY_MEMBER: AccessControlScope.None,
    UPDATE_COMPANY_MEMBER_ACCESS_CONTROL_ROLES: AccessControlScope.None,
    UPDATE_COMPANY_MEMBER_ACCOUNT_STATE: AccessControlScope.None
  },
  FACILITY: {
    ADD_FACILITY: AccessControlScope.None,
    ADD_FACILITY_PERSONNEL: AccessControlScope.Company,
    ADD_FACILITY_TRANSPORT_METHOD: AccessControlScope.Company,
    DELETE_FACILITY_PERSONNEL: AccessControlScope.None,
    DELETE_FACILITY_TRANSPORT_METHOD: AccessControlScope.None,
    GET_FACILITY: AccessControlScope.Company,
    LIST_FACILITIES: AccessControlScope.Company,
    UPDATE_FACILITY: AccessControlScope.Company
  },
  RATE_TABLE: {
    ADD_RATE_TABLE: AccessControlScope.Company,
    ADD_RATE_TABLE_CLONE: AccessControlScope.Company,
    ADD_RATE_TABLE_ENTRY: AccessControlScope.Company,
    ADD_RATE_TABLE_ENTRIES: AccessControlScope.Company,
    DELETE_RATE_TABLE: AccessControlScope.Company,
    DELETE_RATE_TABLE_ENTRY: AccessControlScope.Company,
    UPDATE_RATE_TABLE: AccessControlScope.Company,
    UPDATE_RATE_TABLE_ENTRY: AccessControlScope.Company
  },
  LABEL: {
    ADD_LABEL: AccessControlScope.Company,
    DELETE_LABEL: AccessControlScope.Company,
    LIST_LABELS: AccessControlScope.Company,
    UPDATE_LABEL: AccessControlScope.Company
  },
  GROUP: {
    ADD_GROUP: AccessControlScope.None,
    DELETE_GROUP: AccessControlScope.None,
    GET_GROUP: AccessControlScope.Company,
    LIST_GROUPS: AccessControlScope.Company,
    UPDATE_GROUP: AccessControlScope.None,
    UPDATE_GROUP_ACCOUNTING_INFO: AccessControlScope.None
  },
  PRODUCT: {
    ADD_PRODUCTS: AccessControlScope.Company,
    SEARCH_PRODUCTS: AccessControlScope.Company,
    UPDATE_PRODUCTS_OWNER: AccessControlScope.Company,
    UPDATE_PRODUCTS_PERMISSION: AccessControlScope.Company,
    UPDATE_PRODUCTS_SALES_DATA_PRICE_OF_MERIT: AccessControlScope.Company,
    UPDATE_PRODUCTS_SALES_DATA_SHIP_WEEK_ESTIMATE: AccessControlScope.Company,
    UPDATE_PRODUCTS_SALES_NOTES: AccessControlScope.Company,
    UPDATE_PRODUCT_LOT: AccessControlScope.Company,
    UPDATE_PRODUCT_CONTRACT: AccessControlScope.Company,
    UPDATE_PRODUCT_SPEC_LENGTH_UNITS: AccessControlScope.None
  },
  TRANSACTION: {
    ADD_TRANSACTION: AccessControlScope.None,
    ADD_TRANSACTION_TALLY_UNIT: AccessControlScope.None,
    ADD_TRANSACTION_MILESTONE: AccessControlScope.Company,
    ADD_TRANSACTION_TRANSACTIONAL_JOURNAL: AccessControlScope.None,
    ADD_TRANSACTION_COST_DATA_COGS: AccessControlScope.None,
    ADD_TRANSACTION_COST_DATA_COGP: AccessControlScope.None,
    DELETE_TRANSACTION: AccessControlScope.None,
    DELETE_TRANSACTION_TALLY_UNIT: AccessControlScope.None,
    GET_TRANSACTION_COST_DATA: AccessControlScope.Company,
    GET_TRANSACTION_TALLY: AccessControlScope.Company,
    GET_TRANSACTION_TRACKING_DATA: AccessControlScope.Company,
    GET_TRANSACTION_TRACKING_DATA_PRIVATE_DATA: AccessControlScope.Company,
    GET_TRANSACTION_TRANSACTIONAL_JOURNAL: AccessControlScope.Company,
    SEARCH_TRANSACTIONS: AccessControlScope.Company,
    LIST_TRANSACTION_MILESTONES: AccessControlScope.Company,
    UPDATE_TRANSACTION_COST_DATA: AccessControlScope.None,
    UPDATE_TRANSACTION_COST_DATA_COGS: AccessControlScope.None,
    UPDATE_TRANSACTION_COST_DATA_COGP: AccessControlScope.None,
    UPDATE_TRANSACTION_STATE: AccessControlScope.None,
    UPDATE_TRANSACTION_STATE_REVIEW: AccessControlScope.None,
    UPDATE_TRANSACTION_TALLY: AccessControlScope.None,
    UPDATE_TRANSACTION_TALLY_UNIT: AccessControlScope.None,
    UPDATE_TRANSACTION_TRACKING_DATA: AccessControlScope.None,
    UPDATE_TRANSACTION_TRACKING_DATA_TRANSPORT_METHOD: AccessControlScope.None,
    UPDATE_TRANSACTION_TRACKING_DATA_BUYER_DATA_ONLINE_DATA: AccessControlScope.None,
    UPDATE_TRANSACTION_TRACKING_DATA_BUYER_DATA_CRM_DATA: AccessControlScope.None,
    UPDATE_TRANSACTION_TRACKING_DATA_PRIVATE_DATA: AccessControlScope.Company,
    UPDATE_TRANSACTION_TRACKING_DATA_SELLER_DATA_CRM_DATA: AccessControlScope.None,
    UPDATE_TRANSACTION_TRACKING_DATA_SELLER_DATA_ONLINE_DATA: AccessControlScope.None
  },
  CRM_ACCOUNT: {
    GET_CRM_ACCOUNT_CONTACT_SALES_INFO: AccessControlScope.None,
    GET_CRM_ACCOUNT_CREDIT_INFO: AccessControlScope.None,
    GET_CRM_ACCOUNT_LOCATION_SALES_INFO: AccessControlScope.None,
    GET_CRM_ACCOUNT_SALES_INFO: AccessControlScope.None,
    GET_CRM_ACCOUNT_PAYMENT_INFO: AccessControlScope.None,
    UPDATE_CRM_ACCOUNT: AccessControlScope.None,
    LIST_CRM_ACCOUNTS: AccessControlScope.Company,
    LIST_CRM_CONTACTS: AccessControlScope.Company,
    LIST_CRM_LOCATIONS: AccessControlScope.Company,
    ADD_CRM_ACCOUNT: AccessControlScope.Company,
    ADD_CRM_ACCOUNT_CONTACT: AccessControlScope.Company,
    ADD_CRM_ACCOUNT_LOCATION: AccessControlScope.Company,
    UPDATE_CRM_ACCOUNT_CONTACT_SALES_INFO: AccessControlScope.None,
    UPDATE_CRM_ACCOUNT_LOCATION_SALES_INFO: AccessControlScope.None,
    UPDATE_CRM_ACCOUNT_CONTACT: AccessControlScope.None,
    UPDATE_CRM_ACCOUNT_CREDIT_INFO: AccessControlScope.None,
    UPDATE_CRM_ACCOUNT_LOCATION: AccessControlScope.None,
    UPDATE_CRM_ACCOUNT_SALES_INFO: AccessControlScope.None,
    UPDATE_CRM_ACCOUNT_LABELS: AccessControlScope.None,
    UPDATE_CRM_ACCOUNT_CONTACT_LABELS: AccessControlScope.None,
    UPDATE_CRM_ACCOUNT_LOCATION_LABELS: AccessControlScope.None,
    UPDATE_CRM_ACCOUNT_PAYMENT_INFO: AccessControlScope.None
  },
  ACCOUNT: {
    LIST_ACCOUNTS: AccessControlScope.Company,
    GET_ACCOUNT: AccessControlScope.Company,
    ADD_ACCOUNT: AccessControlScope.None,
    UPDATE_ACCOUNT: AccessControlScope.None,
    DELETE_ACCOUNT: AccessControlScope.None
  },
  DIMENSION: {
    LIST_DIMENSIONS: AccessControlScope.Company,
    ADD_DIMENSION: AccessControlScope.None,
    UPDATE_DIMENSION: AccessControlScope.None,
    DELETE_DIMENSION: AccessControlScope.None
  },
  JOURNAL_ENTRY: {
    SEARCH_JOURNAL_ENTRIES: AccessControlScope.None,
    GET_JOURNAL_ENTRY: AccessControlScope.None,
    ADD_JOURNAL_ENTRY: AccessControlScope.None,
    UPDATE_JOURNAL_ENTRY: AccessControlScope.None,
    UPDATE_JOURNAL_ENTRY_STATE: AccessControlScope.None,
    DELETE_JOURNAL_ENTRY: AccessControlScope.None
  },
  INVOICE: {
    LIST_INVOICES: AccessControlScope.None,
    ADD_INVOICE: AccessControlScope.None,
    GET_INVOICE: AccessControlScope.None,
    UPDATE_INVOICE: AccessControlScope.None,
    UPDATE_INVOICE_STATE_REVIEW: AccessControlScope.None,
    DELETE_INVOICE: AccessControlScope.None,
    ADD_INVOICE_LINE_ITEM: AccessControlScope.None,
    GET_INVOICE_LINE_ITEM: AccessControlScope.None,
    UPDATE_INVOICE_LINE_ITEM: AccessControlScope.None,
    DELETE_INVOICE_LINE_ITEM: AccessControlScope.None,
    ADD_INVOICE_PAYMENT: AccessControlScope.None,
    GET_INVOICE_PAYMENT: AccessControlScope.None,
    UPDATE_INVOICE_PAYMENT: AccessControlScope.None,
    DELETE_INVOICE_PAYMENT: AccessControlScope.None
  },
  SALES_ORDER: {
    LIST_SALES_ORDERS: AccessControlScope.None,
    ADD_SALES_ORDER: AccessControlScope.None,
    GET_SALES_ORDER: AccessControlScope.None,
    UPDATE_SALES_ORDER: AccessControlScope.None,
    CLOSE_SALES_ORDER: AccessControlScope.None,
    DELETE_SALES_ORDER: AccessControlScope.None,
    ADD_SALES_ORDER_OPEN_LINE_ITEM: AccessControlScope.None,
    GET_SALES_ORDER_OPEN_LINE_ITEM: AccessControlScope.None,
    UPDATE_SALES_ORDER_OPEN_LINE_ITEM: AccessControlScope.None,
    DELETE_SALES_ORDER_OPEN_LINE_ITEM: AccessControlScope.None
  },
  BILL: {
    LIST_BILLS: AccessControlScope.None,
    ADD_BILL: AccessControlScope.None,
    GET_BILL: AccessControlScope.None,
    UPDATE_BILL: AccessControlScope.None,
    DELETE_BILL: AccessControlScope.None,
    ADD_BILL_LINE_ITEM: AccessControlScope.None,
    GET_BILL_LINE_ITEM: AccessControlScope.None,
    UPDATE_BILL_LINE_ITEM: AccessControlScope.None,
    DELETE_BILL_LINE_ITEM: AccessControlScope.None,
    ADD_BILL_PAYMENT: AccessControlScope.None,
    GET_BILL_PAYMENT: AccessControlScope.None,
    UPDATE_BILL_PAYMENT: AccessControlScope.None,
    DELETE_BILL_PAYMENT: AccessControlScope.None,
    UPDATE_BILL_STATE_REVIEW: AccessControlScope.None
  },
  PURCHASE_ORDER: {
    LIST_PURCHASE_ORDERS: AccessControlScope.None,
    ADD_PURCHASE_ORDER: AccessControlScope.None,
    GET_PURCHASE_ORDER: AccessControlScope.None,
    UPDATE_PURCHASE_ORDER: AccessControlScope.None,
    CLOSE_PURCHASE_ORDER: AccessControlScope.None,
    DELETE_PURCHASE_ORDER: AccessControlScope.None,
    ADD_PURCHASE_ORDER_OPEN_LINE_ITEM: AccessControlScope.None,
    GET_PURCHASE_ORDER_OPEN_LINE_ITEM: AccessControlScope.None,
    UPDATE_PURCHASE_ORDER_OPEN_LINE_ITEM: AccessControlScope.None,
    DELETE_PURCHASE_ORDER_OPEN_LINE_ITEM: AccessControlScope.None
  }
};