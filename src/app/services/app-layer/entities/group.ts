export class GroupEntity {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  parent?: string;
  parentTree?: string[];
  manager?: string;
  accountingContact?: string;
  companyId?: string;
  archived?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  accountingInfo?: AccountingInfoEntity;

  init?(dto) {
    Object.assign(this, dto);
    this.accountingInfo = new AccountingInfoEntity().init(dto.accountingInfo);
    this.createdAt = new Date(dto.createdAt);
    this.updatedAt = new Date(dto.updatedAt);
    return this;
  }
}

export class AccountingInfoEntity {
  EIN: number;
  currency: string; // currency
  paymentDetails: string;
  REAccountId: string;

  init(dto) {
    Object.assign(this, dto);
    return this;
  }
}
