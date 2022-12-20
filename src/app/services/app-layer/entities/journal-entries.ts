import { Badge } from '@app/constants';
import { BaseLog } from '@app/models';
import {
  AccountingJournalEntryLogEvent,
  AccountingJournalLineTypeEnum,
  AccountingJournalReviewStatusEnum,
  AccountingJournalSourceEnum,
  AccountingJournalStateEnum,
  AccountingJournalStatusEnum,
  AccountingJournalTypeEnum
} from '@services/app-layer/app-layer.enums';
import { TransformHelper } from '@services/helpers/utils/transform-helper';
import { TypeCheck } from '@services/helpers/utils/type-check';
import { AccountingAttachment } from '@services/app-layer/accounting-attachments/accounting-attachments.service';

export class JournalInterCompanyLine {
  id?: string;
  amount: number;
  group: string;
  description: string;
  createdAt?: string;
  updatedAt?: string;
}

export class JournalLine {
  id?: string;
  crossReferenceNumber?: string;
  type?: AccountingJournalLineTypeEnum;
  postedDate?: string;
  debit: number;
  credit: number;
  description: string;
  account: string;
  group?: string;
  dimensions?: string[];
  createdAt?: string;
  updatedAt?: string;

  isStandard: boolean;
  isReversing: boolean;
  isIntercompany: boolean;

  constructor(dto) {
    Object.assign(this, dto);
    if (!this.group) this.group = '';
    this.isStandard = this.type === AccountingJournalLineTypeEnum.STANDARD;
    this.isReversing = this.type === AccountingJournalLineTypeEnum.REVERSING;
    this.isIntercompany = this.type === AccountingJournalLineTypeEnum.INTERCOMPANY;
  }
}

export class JournalLog extends BaseLog {
  event: AccountingJournalEntryLogEvent;
}

export class JournalEntryEntity {
  id?: string;
  readonly number?: number;
  type: AccountingJournalTypeEnum;
  state?: AccountingJournalStateEnum;
  source?: AccountingJournalSourceEnum;
  reviewStatus?: AccountingJournalReviewStatusEnum;
  description: string;
  currency?: string;
  reference?: string;
  notes?: string;
  postDate: string;
  reverseDate?: string;
  approvalDate?: string;
  group?: string;
  dimensions: string[];
  approver?: string;
  customer?: string;
  vendor?: string;
  createdBy?: string;
  lastModifiedBy?: string;
  lines: JournalLine[];
  interCompanies?: JournalInterCompanyLine[];
  log?: JournalLog[];
  companyId?: string;
  createdAt?: string;
  updatedAt?: string;
  attachments?: AccountingAttachment[];

  isManual: boolean;
  isValidReferenceUrl: boolean;
  badgeClass: string;
  amount: number;
  hexReferenceId: string;
  displaySource: string;
  isDraft: boolean;
  isDraftManual: boolean;
  status: AccountingJournalStatusEnum;
  isApproved: boolean;
  isRejected: boolean;

  init?(dto): JournalEntryEntity {
    Object.assign(this, dto);

    this.lines = (this.lines || []).map(item => new JournalLine(item));

    if (!this.group) this.group = '';

    this.isManual = this.source === AccountingJournalSourceEnum.MANUAL;
    this.isValidReferenceUrl = TypeCheck.isWebsiteUrl(this.reference);
    this.amount = this.getAmount();
    this.hexReferenceId = this.getHexReferenceId();
    this.displaySource = this.getDisplaySource();
    this.isDraft = this.state === AccountingJournalStateEnum.DRAFT;
    this.isDraftManual = this.isDraft && this.isManual;
    this.status = this.getStatus();
    this.isApproved = this.status === AccountingJournalStatusEnum.APPROVED;
    this.isRejected = this.status === AccountingJournalStatusEnum.REJECTED;
    this.badgeClass = this.getBadgeClass();

    return this;
  }

  private getAmount() {
    return this.lines
      .filter(line => line.isStandard)
      .reduce((acc, curr) => {
        acc += curr.credit || 0;
        return acc;
      }, 0);
  }

  private getDisplaySource() {
    return this.isManual
      ? TransformHelper.stringUnderscoreToSpaceTitleCase(AccountingJournalSourceEnum.MANUAL)
      : this.source;
  }

  private getHexReferenceId() {
    if (!this.reference) {
      return '';
    }
    const index = this.reference.lastIndexOf('/');
    if (index === -1) {
      return '';
    }

    const idString = this.reference.slice(index + 1);
    return TypeCheck.isHex(idString) && idString.length === 24 ? idString : '';
  }

  private getStatus(): AccountingJournalStatusEnum {
    if (this.state === AccountingJournalStateEnum.APPROVED) {
      return AccountingJournalStatusEnum.APPROVED;
    }

    if (this.reviewStatus === AccountingJournalReviewStatusEnum.NONE) {
      return AccountingJournalStatusEnum.DRAFT;
    }

    if (this.reviewStatus === AccountingJournalReviewStatusEnum.REJECT) {
      return AccountingJournalStatusEnum.REJECTED;
    }

    return AccountingJournalStatusEnum.UNDER_REVIEW;
  }

  private getBadgeClass(): string {
    switch (this.status) {
      case AccountingJournalStatusEnum.APPROVED:
        return Badge.success;
      case AccountingJournalStatusEnum.DRAFT:
        return Badge.primary;
      case AccountingJournalStatusEnum.REJECTED:
        return Badge.danger;
      case AccountingJournalStatusEnum.UNDER_REVIEW:
        return Badge.warning;
    }
  }
}
