import { Badge } from '@app/constants';
import { BaseLog } from '@app/models';
import {
  APBillLogEvent,
  APBillPaymentLogEvent,
  APBillPaymentStateEnum,
  APBillPaymentTypeEnum,
  APBillStateEnum,
  APBillStatusEnum,
  APPurchaseOrderLogEvent,
  APPurchaseOrderStateEnum
} from '@services/app-layer/app-layer.enums';
import { differenceInDays } from 'date-fns';
import { AccountingAttachment } from '@services/app-layer/accounting-attachments/accounting-attachments.service';

export class PurchaseOrderVendorInfo {
  company: string;
  billToLocation: string;
  billToContact: string;
  shipToLocation: string;
  shipToContact: string;
}

export class APLineItem {
  id: string;
  amount: number;
  quantity: number;
  description: string;
  account: string;
  productRef: Array<string>;
  poLineRef: Array<string>;
  crossRefNumber: string;
  createdBy: string;
  lastModifiedBy: string;
  createdAt: string;
  updatedAt: string;
  bill?: APBill;

  init(dto, bill?: APBill) {
    Object.assign(this, dto);

    if (bill) {
      this.bill = bill;
    }

    return this;
  }
}

export class APPurchaseOrderLog extends BaseLog {
  event: APPurchaseOrderLogEvent;
}

export class APPurchaseOrder {
  id?: string;
  number?: number;
  state: APPurchaseOrderStateEnum;
  transaction: string;
  vendor: PurchaseOrderVendorInfo;
  owner: string;
  group: string;
  dimension: string;
  costCenter: string;
  openLineItems: APLineItem[];
  currency: string;
  bills: APBill[];
  description: string;
  notes: string;
  attachments: AccountingAttachment[];
  terms: string;
  createdBy: string;
  createdAt: string;
  modifiedBy: string;
  modifiedAt: string;
  PONumber: string;
  log: APPurchaseOrderLog[];
  allLines: APLineItem[];
  badgeClass: string;
  totalAmount: number;
  isClosed: boolean;
  isPendingClose: boolean;
  isEditAllowed: boolean;
  remaining: number;
  paid: number;
  isDeleteAllowed: boolean;

  init(dto) {
    const { bills, openLineItems, ...data } = dto;

    Object.assign(this, data);

    this.bills = (bills || []).map(item => new APBill().init(item));
    this.openLineItems = (openLineItems || []).map(item => new APLineItem().init(item));
    this.allLines = this.getAllLines();
    this.badgeClass = this.getBadgeClass();
    this.totalAmount = this.getTotalAmount();
    this.isClosed = this.state === APPurchaseOrderStateEnum.CLOSED;
    this.isPendingClose = this.state === APPurchaseOrderStateEnum.PENDING_CLOSE;
    this.isEditAllowed = this.checkIfIsEditAllowed();
    this.remaining = this.getRemaining();
    this.paid = this.getPaid();
    this.isDeleteAllowed = this.checkIfIsDeleteAllowed();

    return this;
  }

  private getBadgeClass() {
    switch (this.state) {
      case APPurchaseOrderStateEnum.CLOSED:
        return Badge.success;
      case APPurchaseOrderStateEnum.OPEN:
        return Badge.primary;
      case APPurchaseOrderStateEnum.PENDING_CLOSE:
        return Badge.warning;
    }
  }

  private getTotalAmount(): number {
    return this.allLines.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  }

  private getRemaining() {
    const billsUnpaidAmount = this.bills.reduce((acc, curr) => acc + curr.unpaid, 0);
    const openLineItemsAmount = this.openLineItems.reduce((acc, curr) => acc + (curr.amount || 0), 0);
    return billsUnpaidAmount + openLineItemsAmount;
  }

  private getPaid() {
    return this.bills.reduce((acc, curr) => acc + curr.paid, 0);
  }

  private checkIfIsEditAllowed() {
    return !this.isClosed;
  }

  private checkIfIsDeleteAllowed() {
    const isOpen = this.state === APPurchaseOrderStateEnum.OPEN;
    const hasNoLineItems = !this.allLines || this.allLines.length === 0;
    const hasNoBills = !this.bills || this.bills.length === 0;
    return isOpen && hasNoLineItems && hasNoBills;
  }

  private getAllLines(): APLineItem[] {
    let lines = [].concat(this.openLineItems);
    this.bills.forEach(item => {
      lines = lines.concat(item.billLineItems);
    });

    return lines;
  }
}

export class APBillPaymentLog extends BaseLog {
  event: APBillPaymentLogEvent;
}

export class APBillPayment {
  id: string;
  type: APBillPaymentTypeEnum;
  currency: string;
  amount: number;
  paymentAccount: string;
  paymentDate: string;
  memo: string;
  checkNumber: string;
  notes: string;
  number: string;
  state: APBillPaymentStateEnum;
  postedDate: string;
  settlementObject: {
    paymentDate: string;
    postDate: string;
    amount: number;
    type: APBillPaymentTypeEnum;
  };
  attachments: AccountingAttachment[];
  journalEntry: string;
  voidedJournalEntry: string;
  createdBy: string;
  createdAt: string;
  modifiedBy: string;
  modifiedAt: string;
  log: APBillPaymentLog[];
  stateBadgeClass: string;
  isVoid: boolean;
  isDraft: boolean;

  init(dto) {
    Object.assign(this, dto);

    this.stateBadgeClass = this.getStateBadgeClass();
    this.isVoid = this.state === APBillPaymentStateEnum.VOID;
    this.isDraft = this.state === APBillPaymentStateEnum.DRAFT;

    return this;
  }

  private getStateBadgeClass() {
    switch (this.state) {
      case APBillPaymentStateEnum.DRAFT:
        return Badge.primary;
      case APBillPaymentStateEnum.APPROVED:
      case APBillPaymentStateEnum.SETTLED:
        return Badge.success;
      case APBillPaymentStateEnum.ISSUED:
        return Badge.warning;
      case APBillPaymentStateEnum.VOID:
        return Badge.secondary;
    }
  }
}

export class APBillLog extends BaseLog {
  event: APBillLogEvent;
}

export class APBill {
  id: string;
  state: APBillStateEnum;
  status: APBillStatusEnum;
  purchaseOrder: string;
  currency: string;
  APAccount: string;
  dueDate: string;
  billLineItems: APLineItem[];
  vendor: {
    company: string;
    location: string;
    contact: string;
  };
  group: string;
  costCenter: string;
  notes: string;
  attachments: AccountingAttachment[];
  payments: APBillPayment[];
  journalEntry: string;
  voidedJournalEntry: string;
  createdBy: string;
  createdAt: string;
  lastModifiedBy: string;
  updatedAt: string;
  log: APBillLog[];
  purchaseOrderId: string;
  stateBadgeClass: string;
  sinceIssue: number;
  pastDue: number | string;
  age: string;
  totalAmount: number;
  paymentAmountSum: number;
  isDraft: boolean;
  isVoided: boolean;
  isPaid: boolean;
  isApproved: boolean;
  unpaid: number;
  paid: number;
  isDeleteAllowed: boolean;

  init(dto) {
    const { billLineItems, payments, ...data } = dto;

    Object.assign(this, data);

    this.payments = (payments || []).map(item => new APBillPayment().init(item));
    this.billLineItems = (billLineItems || []).map(item => new APLineItem().init(item, this));
    this.isDraft = this.state === APBillStateEnum.DRAFT;
    this.isVoided = this.state === APBillStateEnum.VOIDED;
    this.isApproved = this.state === APBillStateEnum.APPROVED;
    this.isPaid = this.status === APBillStatusEnum.PAID;
    this.stateBadgeClass = this.getStateBadgeClass();
    this.sinceIssue = this.getSinceIssue();
    this.pastDue = this.getPastDue();
    this.age = this.getAge();
    this.totalAmount = this.getTotalAmount();
    this.paymentAmountSum = this.getPaymentAmountSum();
    this.unpaid = this.getUnpaid();
    this.paid = this.getPaid();
    this.isDeleteAllowed = this.checkIfIsDeleteAllowed();

    return this;
  }

  private getStateBadgeClass() {
    switch (this.state) {
      case APBillStateEnum.DRAFT:
        return Badge.primary;
      case APBillStateEnum.APPROVED:
        return Badge.success;
      case APBillStateEnum.VOIDED:
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
      return APBillAgeEnum['91_DAYS'];
    } else if (this.pastDue >= 61 && this.pastDue <= 90) {
      return APBillAgeEnum['61_90_DAYS'];
    } else if (this.pastDue >= 31 && this.pastDue <= 60) {
      return APBillAgeEnum['31_60_DAYS'];
    } else if (this.pastDue >= 1 && this.pastDue <= 30) {
      return APBillAgeEnum['1_30_DAYS'];
    }
    return APBillAgeEnum.CURRENT;
  }

  private getTotalAmount() {
    return this.billLineItems.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  }

  private getPaymentAmountSum() {
    return this.payments.reduce((acc, curr) => {
      if (curr.state === APBillPaymentStateEnum.VOID) {
        return acc;
      }

      return acc + curr.amount;
    }, 0);
  }

  private getUnpaid() {
    if (this.isVoided || this.paymentAmountSum > this.totalAmount) {
      return 0;
    }
    return this.totalAmount - this.paymentAmountSum;
  }

  private getPaid() {
    if (this.isDraft || this.isVoided) {
      return 0;
    }
    return this.paymentAmountSum;
  }

  private checkIfIsDeleteAllowed() {
    const isDraft = this.state === APBillStateEnum.DRAFT;
    const hasNoLineItems = !this.billLineItems || this.billLineItems.length === 0;
    return isDraft && hasNoLineItems;
  }
}

export enum APBillAgeEnum {
  CURRENT = 'Current',
  '1_30_DAYS' = '1 - 30 Days',
  '31_60_DAYS' = '31 - 60 Days',
  '61_90_DAYS' = '61 - 90 Days',
  '91_DAYS' = '91 + Days'
}
