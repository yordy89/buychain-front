import { Badge } from '@app/constants';
import { BaseLog } from '@app/models';
import {
  ARCreditMemoLogEvent,
  ARCreditMemoOriginEnum,
  ARCreditMemoReviewStateEnum,
  ARCreditMemoStateEnum,
  ARCreditMemoTypeEnum,
  ARInvoiceLogEvent,
  ARInvoicePaymentLogEvent,
  ARInvoicePaymentStateEnum,
  ARInvoicePaymentTypeEnum,
  ARInvoiceReviewStateEnum,
  ARInvoiceStateEnum,
  ARInvoiceStatusEnum,
  ARLineItemsOriginEnum,
  ARLineItemTypeEnum,
  ARSalesOrderLogEvent,
  ARSalesOrderStateEnum
} from '@services/app-layer/app-layer.enums';
import { differenceInDays } from 'date-fns';
import { CrmLocationEntity } from '@services/app-layer/entities/crm';
import { AccountingAttachment } from '@services/app-layer/accounting-attachments/accounting-attachments.service';
import { MilestoneEntity } from '@services/app-layer/entities/transaction';

export class SalesOrderCustomerInfo {
  company: string;
  billToLocation: string;
  billToContact: string;
  shipToLocation: string;
  shipToContact: string;
}

export class ARLineItem {
  id: string;
  type: ARLineItemTypeEnum;
  quantity: number;
  units: string;
  description: string;
  txLineRef: string;
  receivable: {
    revenueAccount: string;
    wipAccount: string;
    currency: string;
    amount: number;
  };
  costOfSale: {
    cogAccount: string;
    valueAccount: string;
    currency: string;
    amount: number;
  };
  origin: ARLineItemsOriginEnum;
  poRef: {
    description: string;
    APItem: any; // todo add type
  };
  invoice?: ARInvoice;
  salesPrice: number;
  revenue: number;
  perUnitAmount: number;
  expense: number;
  profit: number;

  init(dto, invoice?: ARInvoice) {
    Object.assign(this, dto);

    if (invoice) {
      this.invoice = invoice;
    }

    this.salesPrice = this.getSalesPrice();
    this.revenue = this.getRevenue();
    this.perUnitAmount = this.getPerUnitAmount();
    this.expense = this.getExpense();
    this.profit = this.getProfit();

    return this;
  }

  private getSalesPrice() {
    return (this.receivable?.amount || 0) / this.quantity;
  }

  private getRevenue() {
    return this.receivable?.amount || 0;
  }

  private getExpense() {
    return this.type !== ARLineItemTypeEnum.CUSTOMER_PAID_EXPENSE ? this.costOfSale?.amount || 0 : 0;
  }

  private getProfit() {
    return this.revenue - this.expense;
  }

  private getPerUnitAmount() {
    return (this.costOfSale?.amount || 0) / this.quantity;
  }
}

export class ARSalesOrderLog extends BaseLog {
  event: ARSalesOrderLogEvent;
}

export class ARSalesOrder {
  id?: string;
  number?: number;
  state: ARSalesOrderStateEnum;
  transaction: string;
  customer: SalesOrderCustomerInfo;
  owner: string;
  group: string;
  dimension: string;
  costCenter: string;
  openLineItems: ARLineItem[];
  currency: string;
  invoices: ARInvoice[];
  description: string;
  notes: string;
  attachments: AccountingAttachment[];
  terms: string;
  createdBy: string;
  createdAt: string;
  modifiedBy: string;
  modifiedAt: string;
  SONumber: string;
  log: ARSalesOrderLog[];
  allLines: ARLineItem[];
  unbilled: number;
  billed: number;
  unpaid: number;
  paid: number;
  total: number;
  revenue: number;
  expense: number;
  profit: number;
  isClosed: boolean;
  isEditAllowed: boolean;
  isDeleteAllowed: boolean;

  init(dto) {
    const { invoices, openLineItems, ...data } = dto;

    Object.assign(this, data);

    this.invoices = (invoices || []).map(item => new ARInvoice().init(item));
    this.openLineItems = (openLineItems || []).map(item => new ARLineItem().init(item));
    this.allLines = this.getAllLines();

    this.unbilled = this.getUnbilled();
    this.billed = this.getBilled();
    this.unpaid = this.getUnpaid();
    this.paid = this.getPaid();
    this.total = this.getTotal();
    this.revenue = this.getRevenue();
    this.expense = this.getExpense();
    this.profit = this.getProfit();
    this.isClosed = this.state === ARSalesOrderStateEnum.CLOSED;
    this.isEditAllowed = this.checkIfIsEditAllowed();
    this.isDeleteAllowed = this.checkIfIsDeleteAllowed();

    return this;
  }

  get isPendingClose() {
    return this.state === ARSalesOrderStateEnum.PENDING_CLOSE;
  }

  get badgeClass() {
    switch (this.state) {
      case ARSalesOrderStateEnum.OPEN:
        return Badge.primary;
      case ARSalesOrderStateEnum.PENDING_CLOSE:
        return Badge.warning;
      case ARSalesOrderStateEnum.CLOSED:
        return Badge.success;
    }
  }

  private getUnbilled(): number {
    return this.openLineItems.reduce((acc, curr) => acc + (curr.receivable?.amount || 0), 0);
  }

  private getBilled() {
    return this.invoices.reduce((sum, curr) => sum + (curr?.total || 0), 0);
  }

  private getUnpaid() {
    return this.invoices.reduce((acc, curr) => acc + curr.unpaid, 0);
  }

  private getPaid() {
    return this.invoices.reduce((acc, curr) => acc + curr.paid, 0);
  }

  private getTotal() {
    return this.invoices.reduce((acc, curr) => acc + curr.total, 0);
  }

  private getRevenue() {
    return this.allLines.reduce((acc, curr) => acc + (curr.receivable?.amount || 0), 0);
  }

  private getExpense() {
    return this.allLines
      .filter(item => item.type !== ARLineItemTypeEnum.CUSTOMER_PAID_EXPENSE)
      .reduce((acc, curr) => acc + curr.costOfSale?.amount || 0, 0);
  }

  private getProfit() {
    return this.revenue - this.expense;
  }

  private checkIfIsEditAllowed() {
    return !this.isClosed;
  }

  private checkIfIsDeleteAllowed() {
    const isOpen = this.state === ARSalesOrderStateEnum.OPEN;
    const hasNoLineItems = !this.allLines || this.allLines.length === 0;
    const hasNoInvoices = !this.invoices || this.invoices.length === 0;
    return isOpen && hasNoLineItems && hasNoInvoices;
  }

  private getAllLines(): ARLineItem[] {
    let lines = [].concat(this.openLineItems);
    this.invoices.forEach(item => {
      lines = lines.concat(item.lineItems);
    });

    return lines;
  }
}

export class ARInvoicePaymentLog extends BaseLog {
  event: ARInvoicePaymentLogEvent;
}

export class ARInvoicePayment {
  id: string;
  type: ARInvoicePaymentTypeEnum;
  state: ARInvoicePaymentStateEnum;
  cashAccount: string;
  recvDate: string;
  amount: number;
  currency: string;
  description: string;
  notes: string;
  attachments: AccountingAttachment[];
  journalEntry: string;
  voidedJournalEntry: string;
  bankObject: any; // todo add proper type
  createdBy: string;
  createdAt: string;
  modifiedBy: string;
  modifiedAt: string;
  log: ARInvoicePaymentLog[];
  stateBadgeClass: string;
  isVoided: boolean;
  isEditDeleteAllowed: boolean;

  init(dto) {
    Object.assign(this, dto);

    this.stateBadgeClass = this.getStateBadgeClass();
    this.isVoided = this.state === ARInvoicePaymentStateEnum.VOIDED;
    this.isEditDeleteAllowed = this.checkIfIsEditDeleteAllowed();

    return this;
  }

  private getStateBadgeClass() {
    switch (this.state) {
      case ARInvoicePaymentStateEnum.DEPOSITED:
      case ARInvoicePaymentStateEnum.SETTLED:
        return Badge.success;
      case ARInvoicePaymentStateEnum.RECEIVED:
        return Badge.warning;
      case ARInvoicePaymentStateEnum.VOIDED:
        return Badge.secondary;
    }
  }

  private checkIfIsEditDeleteAllowed() {
    return this.state === ARInvoicePaymentStateEnum.RECEIVED || this.state === ARInvoicePaymentStateEnum.DEPOSITED;
  }
}

export class ARInvoiceLog extends BaseLog {
  event: ARInvoiceLogEvent;
}

export class ARInvoice {
  id: string;
  number: number;
  state: ARInvoiceStateEnum;
  reviewState: ARInvoiceReviewStateEnum;
  status: ARInvoiceStatusEnum;
  terms: string;
  invoiceDate: string;
  dueDate: string;
  currency: string;
  altBillTo: CrmLocationEntity;
  ARAccount: string;
  lineItems: ARLineItem[];
  description: string;
  customerRefField: string;
  internalNotes: string;
  externalNotes: string;
  attachments: AccountingAttachment[];
  payments: ARInvoicePayment[];
  receivablesJE: string;
  costOfSaleJE: string;
  voidedJournalEntry: string;
  createdBy: string;
  createdAt: string;
  modifiedBy: string;
  modifiedAt: string;
  log: ARInvoiceLog[];
  milestones: MilestoneEntity[];
  isDraft: boolean;
  isVoided: boolean;
  isClosed: boolean;
  isIssued: boolean;
  isClosedWriteOff: boolean;
  isPaid: boolean;
  isApproved: boolean;
  isRejected: boolean;
  isDeleteAllowed: boolean;
  stateBadgeClass: string;
  sinceIssue: number;
  pastDue: number | string;
  age: string;
  receivableAmountSum: number;
  paymentAmountSum: number;
  revenue: number;
  expense: number;
  profit: number;
  unbilled: number;
  unpaid: number;
  paid: number;
  total: number;

  init(dto) {
    const { lineItems, payments, ...data } = dto;

    Object.assign(this, data);

    this.payments = (payments || []).map(item => new ARInvoicePayment().init(item));
    this.lineItems = (lineItems || []).map(item => new ARLineItem().init(item, this));

    this.isDraft = this.state === ARInvoiceStateEnum.DRAFT;
    this.isVoided = this.state === ARInvoiceStateEnum.VOIDED;
    this.isClosed = this.state === ARInvoiceStateEnum.CLOSED;
    this.isIssued = this.state === ARInvoiceStateEnum.ISSUED;
    this.isClosedWriteOff = this.state === ARInvoiceStateEnum['CLOSED_WRITE_OFF'];
    this.isPaid = this.status === ARInvoiceStatusEnum.PAID;
    this.isApproved = this.reviewState === ARInvoiceReviewStateEnum.APPROVED;
    this.isRejected = this.reviewState === ARInvoiceReviewStateEnum.REJECT;
    this.isDeleteAllowed = this.checkIfIsDeleteAllowed();
    this.stateBadgeClass = this.getStateBadgeClass();
    this.sinceIssue = this.getSinceIssue();
    this.pastDue = this.getPastDue();
    this.age = this.getAge();
    this.receivableAmountSum = this.getReceivableAmountSum();
    this.paymentAmountSum = this.getPaymentAmountSum();
    this.revenue = this.getRevenue();
    this.expense = this.getExpense();
    this.profit = this.getProfit();
    this.unbilled = this.getUnbilled();
    this.unpaid = this.getUnpaid();
    this.paid = this.getPaid();
    this.total = this.getTotal();

    return this;
  }

  private getStateBadgeClass() {
    switch (this.state) {
      case ARInvoiceStateEnum.DRAFT:
        return Badge.primary;
      case ARInvoiceStateEnum.CLOSED:
        return Badge.success;
      case ARInvoiceStateEnum.ISSUED:
        return Badge.warning;
      case ARInvoiceStateEnum['CLOSED_WRITE_OFF']:
        return Badge.danger;
      case ARInvoiceStateEnum.VOIDED:
        return Badge.secondary;
    }
  }

  private getSinceIssue() {
    return differenceInDays(new Date(), new Date(this.createdAt));
  }

  private getPastDue() {
    const diff = differenceInDays(new Date(), new Date(this.dueDate));
    return diff > 0 ? diff : '';
  }

  private getAge() {
    if (this.pastDue >= 91) {
      return ARInvoiceAgeEnum['91_DAYS'];
    } else if (this.pastDue >= 61 && this.pastDue <= 90) {
      return ARInvoiceAgeEnum['61_90_DAYS'];
    } else if (this.pastDue >= 31 && this.pastDue <= 60) {
      return ARInvoiceAgeEnum['31_60_DAYS'];
    } else if (this.pastDue >= 1 && this.pastDue <= 30) {
      return ARInvoiceAgeEnum['1_30_DAYS'];
    }
    return ARInvoiceAgeEnum.CURRENT;
  }

  private getReceivableAmountSum() {
    return this.lineItems.reduce((acc, curr) => acc + (curr.receivable?.amount || 0), 0);
  }

  private getPaymentAmountSum() {
    return this.payments.reduce((acc, curr) => {
      if (curr.state === ARInvoicePaymentStateEnum.VOIDED) {
        return acc;
      }

      return acc + curr.amount;
    }, 0);
  }

  private getUnbilled(): number {
    if (this.isDraft || this.isClosedWriteOff) {
      return this.receivableAmountSum;
    }
    return 0;
  }

  private getUnpaid() {
    if (this.isDraft || this.isClosed || this.paymentAmountSum > this.receivableAmountSum) {
      return 0;
    }
    return this.receivableAmountSum - this.paymentAmountSum;
  }

  private getPaid() {
    if (this.isDraft || this.isVoided) {
      return 0;
    }
    return this.paymentAmountSum;
  }

  private getTotal() {
    return this.unbilled + this.unpaid + this.paid;
  }

  private checkIfIsDeleteAllowed() {
    const isDraft = this.state === ARInvoiceStateEnum.DRAFT;
    const hasNoLineItems = !this.lineItems || this.lineItems.length === 0;
    return isDraft && hasNoLineItems;
  }

  private getRevenue() {
    return this.lineItems.reduce((acc, curr) => acc + curr.receivable?.amount || 0, 0);
  }

  private getExpense() {
    return this.lineItems
      .filter(item => item.type !== ARLineItemTypeEnum.CUSTOMER_PAID_EXPENSE)
      .reduce((acc, curr) => acc + curr.costOfSale?.amount || 0, 0);
  }

  private getProfit() {
    return this.revenue - this.expense;
  }
}

export class ARCreditMemoLog extends BaseLog {
  event: ARCreditMemoLogEvent;
}

export class ARCreditMemo {
  id: string;
  number: number;
  state: ARCreditMemoStateEnum;
  reviewState: ARCreditMemoReviewStateEnum;
  dueDate: string;
  currency: string;
  customer: any;
  revenueAccount: any;
  amount: number;
  relatedTo: string | ARInvoice;
  appliedTo: string[];
  description: string;
  internalNotes: string;
  attachments: AccountingAttachment[];
  createdBy: string;
  modifiedBy: string;
  createdAt: string;
  updatedAt: string;
  companyId: string;
  origin: ARCreditMemoOriginEnum;
  type: ARCreditMemoTypeEnum;
  log: ARCreditMemoLog[];
  stateBadgeClass: string;
  reviewStateBadgeClass: string;
  isApproved: boolean;
  isCredited: boolean;
  isEditDeleteAllowed: boolean;
  isDraft: boolean;
  isSubmitted: boolean;

  init(dto) {
    Object.assign(this, dto);

    this.stateBadgeClass = this.getStateBadgeClass();
    this.reviewStateBadgeClass = this.getReviewStateBadgeClass();
    this.isApproved = this.reviewState === ARCreditMemoReviewStateEnum.APPROVED;
    this.isCredited = this.state === ARCreditMemoStateEnum.CREDITED;
    this.isEditDeleteAllowed = !this.isApproved && !this.isCredited;
    this.isDraft = this.state === ARCreditMemoStateEnum.DRAFT;
    this.isSubmitted = this.state === ARCreditMemoStateEnum.SUBMITTED;

    return this;
  }

  private getStateBadgeClass() {
    switch (this.state) {
      case ARCreditMemoStateEnum.DRAFT:
        return Badge.primary;
      case ARCreditMemoStateEnum.CREDITED:
      case ARCreditMemoStateEnum.APPLIED:
      case ARCreditMemoStateEnum.PARTIAL_APPLIED:
        return Badge.success;
      case ARCreditMemoStateEnum.SUBMITTED:
        return Badge.warning;
    }
  }

  private getReviewStateBadgeClass() {
    switch (this.reviewState) {
      case ARCreditMemoReviewStateEnum.DRAFT:
        return Badge.primary;
      case ARCreditMemoReviewStateEnum.APPROVED:
        return Badge.success;
      case ARCreditMemoReviewStateEnum.REVIEW:
        return Badge.warning;
      case ARCreditMemoReviewStateEnum.REJECT:
        return Badge.danger;
    }
  }
}

export enum ARInvoiceAgeEnum {
  CURRENT = 'Current',
  '1_30_DAYS' = '1 - 30 Days',
  '31_60_DAYS' = '31 - 60 Days',
  '61_90_DAYS' = '61 - 90 Days',
  '91_DAYS' = '91 + Days'
}
