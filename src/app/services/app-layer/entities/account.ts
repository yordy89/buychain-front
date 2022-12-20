import { AccountingNaturalBalanceEnum, AccountingTypeEnum } from '@services/app-layer/app-layer.enums';

export class AccountEntity {
  id?: string;
  name: string;
  number: number;
  naturalBalance: AccountingNaturalBalanceEnum;
  type?: AccountingTypeEnum;
  subtype: string;
  group?: string;
  groupName: string;
  description: string;
  archived: boolean;
  inactiveString: string;
  system: boolean;
  systemString: string;

  numberName: string;
  numberAndName: string;

  init(dto) {
    Object.assign(this, dto);
    this.group = dto.group;
    if (!this.group) this.groupName = 'Global';
    this.description = dto.description;
    this.subtype = dto.subtype;
    this.inactiveString = this.archived ? 'Yes' : 'No';
    this.systemString = this.system ? 'Yes' : 'No';
    this.numberName = `${this.number} - ${this.name}`;
    this.numberAndName = this.getNumberAndName();
    return this;
  }

  private getNumberAndName() {
    return [this.number, this.name].join(' ');
  }
}
