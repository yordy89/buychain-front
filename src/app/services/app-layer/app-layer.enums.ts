export enum InventoryManagementSystemEnum {
  FIFO = 'First In First Out',
  AVG_COST = 'Average Cost'
}

export enum FiscalYearStartEnum {
  JAN = 'January',
  FEB = 'February',
  MAR = 'March',
  APR = 'April',
  MAY = 'May',
  JUN = 'June',
  JUL = 'July',
  AUG = 'August',
  SEPT = 'September',
  OCT = 'October',
  NOV = 'November',
  DEC = 'December'
}

export enum RevenueRecognitionMethodEnum {
  BOOKING = 'Booking',
  SHIPPED = 'Shipped',
  CUST_RECEIVED = 'Cost Received',
  INVOICED = 'Invoiced',
  PAID = 'Paid'
}

export enum SelectionCriteriaEnum {
  LOW_COST_BASIS = 'Low Cost Basis',
  HIGH_COST_BASIS = 'High Cost Basis',
  FIFO_PURCHASE_DATE = 'FIFO of Purchase Date',
  LIFO_PURCHASE_DATE = 'LIFO of Purchase Date'
}

export enum AutoInvoiceGenerationEnum {
  NONE = 'None',
  BOOKED = 'Booked',
  SHIPPED = 'Shipped'
}

export enum MessageType {
  log = 'LOG',
  messaging = 'MESSAGING'
}

export enum TransactionStateEnum {
  Draft = 'DRAFT',
  Quote = 'QUOTE',
  Review = 'REVIEW',
  Confirmed = 'CONFIRMED',
  ChangePending = 'CHANGE_PENDING',
  Canceled = 'CANCELED',
  InTransit = 'IN_TRANSIT',
  Complete = 'COMPLETE'
}

export enum TransactionStateUpdateEnum {
  Quote = 'QUOTE',
  Review = 'REVIEW',
  InTransit = 'IN_TRANSIT',
  Complete = 'COMPLETE'
}

export enum TransactionStateReviewUpdateEnum {
  Quote = 'QUOTE',
  Confirmed = 'CONFIRMED'
}

export enum ChangeTransactionTypesEnum {
  ModifyTally = 'MODIFY_TALLY',
  ModifyTransport = 'MODIFY_TRANSPORT'
}

export enum TransactionStateIndexEnum {
  DRAFT = 1,
  QUOTE = 2,
  REVIEW = 3,
  CONFIRMED = 4,
  IN_TRANSIT = 5,
  COMPLETE = 6
}

export enum RoleInTransaction {
  Buyer = 'BUYER',
  Seller = 'SELLER'
}

export enum TransactionTypeEnum {
  Purchase = 'Purchase',
  Sales = 'Sales'
}

export enum CogTypeEnum {
  Duties = 'DUTIES',
  Customs = 'CUSTOMS',
  Insurance = 'INSURANCE',
  OceanFreight = 'OCEAN_FREIGHT',
  Handling = 'HANDLING',
  Brokerage = 'BROKERAGE',
  Commission = 'COMMISSION',
  Other = 'OTHER'
}

export enum MilestoneIconNames {
  airplanemode_active = 'airplanemode_active',
  alarm = 'alarm',
  announcement = 'announcement',
  assignment = 'assignment',
  attach_money = 'attach_money',
  build = 'build',
  calendar_today = 'calendar_today',
  call = 'call',
  desktop_windows = 'desktop_windows',
  directions_boat = 'directions_boat',
  directions_bus = 'directions_bus',
  directions_subway = 'directions_subway',
  home = 'home',
  local_see = 'local_see',
  local_shipping = 'local_shipping',
  location_city = 'location_city',
  notifications_none = 'notifications_none',
  phone_iphone = 'phone_iphone',
  store_mall_directory = 'store_mall_directory',
  sync = 'sync',
  pdf = 'pdf'
}

export enum TransportTermEnum {
  FOB_DEST_PREPAY = 'FOB_DEST_PREPAY',
  FOB_DEST_COLLECT = 'FOB_DEST_COLLECT',
  FOB_DEST_PREPAY_CHARGE = 'FOB_DEST_PREPAY_CHARGE',
  FOB_ORIGIN_PREPAY = 'FOB_ORIGIN_PREPAY',
  FOB_ORIGIN_COLLECT = 'FOB_ORIGIN_COLLECT',
  FOB_ORIGIN_PREPAY_CHARGE = 'FOB_ORIGIN_PREPAY_CHARGE'
}

export enum ProductStateEnum {
  ON_ORDER = 'ON_ORDER',
  IN_TRANSIT = 'IN_TRANSIT',
  ON_HAND = 'ON_HAND',
  SOLD = 'SOLD' // ONLY frontend usage
}

export enum ProductLotPermissionEnum {
  PRIVATE = 'PRIVATE',
  INTERNAL = 'INTERNAL',
  EXTERNAL = 'EXTERNAL'
}

export enum CrmTypeEnum {
  ACCOUNT = 'ACCOUNT',
  CONTACT = 'CONTACT',
  LOCATION = 'LOCATION'
}

export enum LabelKey {
  Categories = 'categories',
  Industry = 'industry',
  Tags = 'tags',
  RoleTags = 'roleTags'
}

export enum CrmLinkStatusEnum {
  LINKED = '1 Linked',
  CAN_BE_LINKED = '2 Not Linked',
  CAN_NOT_BE_LINKED = '3 Account Not Linked'
}

export enum TooltipTextEnum {
  SALES_PRACTICE_SELECTION_CRITERIA = 'This policy determines which individual units from a product lot will be allocated to a transaction. For example if a transaction calls for two units from a product lot contains 10 units, how will the system select.',
  ALLOW_LISTING = 'Setting this value to true allows other companies to find your organization in BuyChain. This is required if you wish to have others conduct online transactions and be able to view your external inventory in the market browser.',
  INVENTORY_MANAGEMENT_SYSTEM = 'Choose an accounting practice for inventory management. FIFO/Actual will record the cost basis of each individual unit acquired. Average Cost will readjust cost basis of all items in a product lot as new units are acquired or added to the product lot.',
  FISCAL_YEAR_START = 'Reports and calculations will assume a fiscal year start on the 1st of the month you select.',
  REVENUE_RECOGNITION_METHOD = 'Reports and summaries will include/ignore transactions based on this setting.',
  AUTO_INVOICE_GENERATION = 'Invoices will be automatically generated at this phase of the transaction pipeline'
}

export enum AccountState {
  NOT_ACTIVE = 'NOT_ACTIVE',
  WAIT_APPROVAL = 'WAIT_APPROVAL',
  APPROVED = 'APPROVED',
  HOLD = 'HOLD',
  UPDATE_REQUIRED = 'UPDATE_REQUIRED'
}

export enum ProfileCompletionState {
  INITIAL = 'INITIAL',
  PENDING_COMPANY = 'PENDING_COMPANY',
  MEMBER = 'MEMBER',
  PROFILE = 'PROFILE',
  COMPLETE = 'COMPLETE'
}

export enum SystemRoles {
  COMPANY_ADMIN = 'COMPANY_ADMIN',
  BILLING_ADMIN = 'BILLING_ADMIN',
  ANALYTIC_TEST_USER = 'ANALYTIC_TEST_USER'
}

export interface ProductsOfInterest {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
}

export interface PrivacySettings {
  allowListing: boolean;
}

export enum OrderStateEnum {
  Open = 'OPEN',
  Closed = 'CLOSED'
}
export enum StockSubTypeEnum {
  SalesOrder = 'SALES',
  PurchaseOrder = 'PURCHASE'
}

export enum OrderTypeEnum {
  Stock = 'STOCK',
  Production = 'PRODUCTION',
  Reman = 'REMAN',
  Transload = 'TRANSLOAD',
  Consignment = 'CONSIGNMENT',
  VMIAMI = 'VMI/AMI',
  BackToBack = 'BACK_TO_BACK'
}

export enum LabelSet {
  AccountIndustryType = 'ACCOUNT_INDUSTRY_TYPE',
  AccountCategoryTag = 'ACCOUNT_CATEGORY_TAG',
  AccountTag = 'ACCOUNT_TAG',
  LocationTag = 'LOCATION_TAG',
  ContactRoleTag = 'CONTACT_ROLE_TAG',
  ContactTag = 'CONTACT_TAG'
}

export enum LabelGroupName {
  accountIndustryTags = 'accountIndustryTags',
  accountCategoryTags = 'accountCategoryTags',
  accountTags = 'accountTags',
  locationTags = 'locationTags',
  contactRoleTags = 'contactRoleTags',
  contactTags = 'contactTags'
}

export enum RateTableUom {
  USD_Board_Feet = 'BOARD_FEET',
  USD_Linear_Feet = 'LINEAR_FEET',
  USD_Square_Feet = 'SQUARE_FEET',
  USD_Cubic_Feet = 'CUBIC_FEET',
  USD_Count = 'COUNT',
  USD_Weight = 'WEIGHT_LBS'
}

export enum PriceSystem {
  USD_Board_Feet = 'USD/M-BOARD-FEET',
  USD_Linear_Feet = 'USD/LINEAR-FEET',
  USD_Square_Feet = 'USD/SQUARE-FEET',
  USD_Cubic_Feet = 'USD/CUBIC-FEET',
  USD_Count = 'USD/COUNT',
  USD_Weight = 'USD/WEIGHT'
}

export enum CompanyContractTypeEnum {
  Free = 'FREE',
  BP_Only = 'BP_ONLY'
}

export enum EnvironmentEnum {
  Production = 'PRODUCTION',
  Demo = 'DEMO',
  Development = 'DEVELOPMENT'
}

// Reporting Sales performance enums
export enum SalesTimeSeriesEnum {
  Daily = 'Daily',
  Weekly = 'Weekly',
  Monthly = 'Monthly',
  Quarterly = 'Quarterly',
  PerUserDay = 'Per User Day',
  PerUserWeek = 'Per User Week',
  PerUserMonth = 'Per User Month',
  PerUserQuarter = 'Per User Quarter',
  PerUserYearToDate = 'Per User Year To Date',
  PerCustomerDay = 'Per Customer Day',
  PerCustomerWeek = 'Per Customer Week',
  PerCustomerMonth = 'Per Customer Month',
  PerCustomerQuarter = 'Per Customer Quarter',
  PerCustomerYearToDate = 'Per Customer Year To Date'
}
export enum SalesFiguresOfMeritEnum {
  numberOfTransactions = 'Number Of Transactions',
  revenue = 'Revenue',
  margin = 'Margin',
  avgMargin = 'Avg Margin (%)',
  volume = 'Volume'
}

// Reporting Inventory Performance enums

export enum InventoryTimeSeriesEnum {
  DailyPurchased = 'Daily Purchase Date',
  DailyLanded = 'Daily Landed Date',
  DailyCustody = 'Daily Custody Date',
  DailySold = 'Daily Sold Date',
  WeeklyPurchased = 'Weekly Purchase Date',
  WeeklyLanded = 'Weekly Landed Date',
  WeeklyCustody = 'Weekly Custody Date',
  WeeklySold = 'Weekly Sold Date',
  MonthlyPurchased = 'Monthly Purchase Date',
  MonthlyLanded = 'Monthly Landed Date',
  MonthlyCustody = 'Monthly Custody Date',
  MonthlySold = 'Monthly Sold Date',
  QuarterlyPurchased = 'Quarterly Purchase Date',
  QuarterlyLanded = 'Quarterly Landed Date',
  QuarterlyCustody = 'Quarterly Custody Date',
  QuarterlySold = 'Quarterly Sold Date'
}
export enum InventoryFiguresOfMeritEnum {
  sumOfMeasure = 'Sum of Measure',
  sumOfUnits = 'Sum of Units',
  sumOfCostBasis = 'Sum of Cost Basis',
  avgTurnTime = 'Avg Turn Time'
}

export enum AccountingNaturalBalanceEnum {
  Debit = 'DEBIT',
  Credit = 'CREDIT'
}

export enum AccountingTypeEnum {
  Asset = 'ASSET',
  Liability = 'LIABILITY',
  Equity = 'EQUITY',
  Revenue = 'REVENUE',
  Expense = 'EXPENSE'
}

export enum AccountingJournalStateEnum {
  DRAFT = 'DRAFT',
  APPROVED = 'APPROVED'
}

export enum AccountingJournalTypeEnum {
  STANDARD = 'STANDARD',
  REVERSING = 'REVERSING'
}

export enum AccountingJournalLineTypeEnum {
  STANDARD = 'STANDARD',
  REVERSING = 'REVERSING',
  INTERCOMPANY = 'INTERCOMPANY'
}

export enum AccountingJournalEntryLogEvent {
  ADD_JOURNAL_ENTRY = 'ADD_JOURNAL_ENTRY',
  UPDATE_JOURNAL_ENTRY = 'UPDATE_JOURNAL_ENTRY',
  UPDATE_JOURNAL_ENTRY_STATE = 'UPDATE_JOURNAL_ENTRY_STATE',
  UPDATE_JOURNAL_ENTRY_LINES = 'UPDATE_JOURNAL_ENTRY_LINES'
}

export enum AccountingJournalSourceEnum {
  MANUAL = 'MANUAL',
  AR = 'AR',
  AP = 'AP'
}

export enum AccountingJournalReviewStatusEnum {
  NONE = 'NONE',
  REQUEST = 'REQUEST',
  REJECT = 'REJECT'
}

export enum AccountingJournalStatusEnum {
  DRAFT = 'DRAFT',
  UNDER_REVIEW = 'UNDER REVIEW',
  REJECTED = 'REJECTED',
  APPROVED = 'APPROVED'
}

export enum ARSalesOrderStateEnum {
  OPEN = 'OPEN',
  PENDING_CLOSE = 'PENDING_CLOSE',
  CLOSED = 'CLOSED'
}

export enum ARInvoiceStateEnum {
  DRAFT = 'DRAFT',
  ISSUED = 'ISSUED',
  CLOSED = 'CLOSED',
  'CLOSED_WRITE_OFF' = 'CLOSED_WRITE_OFF',
  VOIDED = 'VOIDED'
}

export enum ARInvoiceReviewStateEnum {
  NONE = 'NONE',
  REVIEW = 'REVIEW',
  REJECT = 'REJECT',
  APPROVED = 'APPROVED'
}

export enum ARCreditMemoStateEnum {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  CREDITED = 'CREDITED',
  APPLIED = 'APPLIED',
  PARTIAL_APPLIED = 'PARTIAL_APPLIED'
}

export enum ARCreditMemoReviewStateEnum {
  DRAFT = 'DRAFT',
  REVIEW = 'REVIEW',
  APPROVED = 'APPROVED',
  REJECT = 'REJECT'
}

export enum ARCreditMemoOriginEnum {
  CRM = 'CRM',
  ACCOUNTING = 'ACCOUNTING'
}

export enum ARInvoiceStatusEnum {
  UNPAID = 'UNPAID',
  PARTIAL_PAYMENT = 'PARTIAL_PAYMENT',
  PAID = 'PAID'
}

export enum ARLineItemTypeEnum {
  INVENTORY = 'INVENTORY',
  SERVICE = 'SERVICE',
  CUSTOMER_PAID_EXPENSE = 'CUSTOMER_PAID_EXPENSE',
  INTERNAL_EXPENSE = 'INTERNAL_EXPENSE'
}

export enum ARSalesOrderLogEvent {
  SALES_ORDER_CREATED = 'SALES_ORDER_CREATED',
  SALES_ORDER_ADD_INVOICE = 'SALES_ORDER_ADD_INVOICE',
  SALES_ORDER_ADD_LINE = 'SALES_ORDER_ADD_LINE',
  SALES_ORDER_ASSIGN_LINE = 'SALES_ORDER_ASSIGN_LINE',
  SALES_ORDER_CHANGE_STATE = 'SALES_ORDER_CHANGE_STATE'
}

export enum ARInvoicePaymentLogEvent {
  INVOICE_PAYMENT_CREATED = 'INVOICE_PAYMENT_CREATED',
  INVOICE_PAYMENT_STATE_CHANGE = 'INVOICE_PAYMENT_STATE_CHANGE',
  INVOICE_PAYMENT_SETTLED = 'INVOICE_PAYMENT_SETTLED'
}

export enum ARInvoiceLogEvent {
  INVOICE_CREATE = 'INVOICE_CREATE',
  INVOICE_CREATE_LINEITEM = 'INVOICE_CREATE_LINEITEM',
  INVOICE_MODIFY = 'INVOICE_MODIFY',
  INVOICE_MODIFY_LINE = 'INVOICE_MODIFY_LINE',
  INVOICE_STATE_APPROVED = 'INVOICE_STATE_APPROVED',
  INVOICE_STATE_VOIDED = 'INVOICE_STATE_VOIDED'
}

export enum ARCreditMemoLogEvent {
  CREDIT_MEMO_CREATE = 'CREDIT_MEMO_CREATE',
  CREDIT_MEMO_MODIFY = 'CREDIT_MEMO_MODIFY',
  CREDIT_MEMO_STATE_APPROVED = 'CREDIT_MEMO_STATE_APPROVED'
}

export enum ARInvoicePaymentTypeEnum {
  MANUAL = 'MANUAL',
  WIRE = 'WIRE',
  CHECK = 'CHECK',
  CUSTOMER_CREDIT = 'CUSTOMER_CREDIT',
  WRITE_OFF = 'WRITE_OFF',
  CREDIT_MEMO = 'CREDIT_MEMO'
}

export enum ARInvoicePaymentStateEnum {
  RECEIVED = 'RECEIVED',
  DEPOSITED = 'DEPOSITED',
  SETTLED = 'SETTLED',
  VOIDED = 'VOIDED'
}

export enum ARLineItemsOriginEnum {
  ORDERS_MODULE = 'ORDERS_MODULE',
  AR_MODULE = 'AR_MODULE',
  AP_MODULE = 'AP_MODULE'
}

export enum ARCreditMemoTypeEnum {
  CUSTOMER_ENTERED_INCORRECTLY = 'CUSTOMER ENTERED INCORRECTLY',
  WAREHOUSE_ERROR = 'WAREHOUSE ERROR',
  CUSTOMER_GOODWILL_ADJUSTMENT = 'CUSTOMER GOODWILL ADJUSTMENT',
  CUSTOMER_NOT_SATISFIED_WITH_MATERIAL = 'CUSTOMER_NOT_SATISFIED_WITH_MATERIAL',
  SALESPERSON_ENTERED_INCORRECTLY = 'SALESPERSON ENTERED INCORRECTLY',
  CUSTOMER_PRICING_VARIANCE = 'CUSTOMER PRICING VARIANCE',
  MILL_ERROR = 'MILL ERROR',
  DAMAGED = 'DAMAGED',
  OTHER = 'OTHER'
}

export enum APPurchaseOrderStateEnum {
  OPEN = 'OPEN',
  PENDING_CLOSE = 'PENDING_CLOSE',
  CLOSED = 'CLOSED'
}

export enum APBillStateEnum {
  DRAFT = 'DRAFT',
  APPROVED = 'APPROVED',
  VOIDED = 'VOIDED'
}

export enum APBillStatusEnum {
  UNPAID = 'UNPAID',
  PARTIAL_PAYMENT = 'PARTIAL_PAYMENT',
  PAID = 'PAID'
}

export enum APPurchaseOrderLogEvent {
  SALES_ORDER_CREATED = 'SALES_ORDER_CREATED',
  SALES_ORDER_ADD_INVOICE = 'SALES_ORDER_ADD_INVOICE',
  SALES_ORDER_ADD_LINE = 'SALES_ORDER_ADD_LINE',
  SALES_ORDER_ASSIGN_LINE = 'SALES_ORDER_ASSIGN_LINE',
  SALES_ORDER_CHANGE_STATE = 'SALES_ORDER_CHANGE_STATE'
}

export enum APBillPaymentLogEvent {
  INVOICE_PAYMENT_CREATED = 'INVOICE_PAYMENT_CREATED',
  INVOICE_PAYMENT_STATE_CHANGE = 'INVOICE_PAYMENT_STATE_CHANGE',
  INVOICE_PAYMENT_SETTLED = 'INVOICE_PAYMENT_SETTLED'
}

export enum APBillLogEvent {
  INVOICE_CREATE = 'INVOICE_CREATE',
  INVOICE_CREATE_LINEITEM = 'INVOICE_CREATE_LINEITEM',
  INVOICE_MODIFY = 'INVOICE_MODIFY',
  INVOICE_MODIFY_LINE = 'INVOICE_MODIFY_LINE',
  INVOICE_STATE_APPROVED = 'INVOICE_STATE_APPROVED',
  INVOICE_STATE_VOIDED = 'INVOICE_STATE_VOIDED'
}

export enum APBillPaymentTypeEnum {
  MANUAL = 'MANUAL',
  WIRE = 'WIRE',
  CHECK = 'CHECK',
  VENDOR_CREDIT = 'VENDOR_CREDIT'
}

export enum APBillPaymentStateEnum {
  DRAFT = 'DRAFT',
  APPROVED = 'APPROVED',
  ISSUED = 'ISSUED',
  SETTLED = 'SETTLED',
  VOID = 'VOID'
}

export enum ContractStateEnum {
  DRAFT = 'DRAFT',
  OPEN = 'OPEN',
  CLOSED = 'CLOSED'
}

export enum ProductPurchaseMethod {
  CONTRACT = 'CONTRACT',
  CASH = 'CASH',
  MIXED = 'MIXED'
}

export enum InventoryViewEnum {
  MasterView = 'MASTER_VIEW',
  ProductView = 'PRODUCT_VIEW'
}
