import { formatCurrency } from '@angular/common';
import { ChangeDetectionStrategy, Component, Inject, Input, LOCALE_ID } from '@angular/core';
import { AccountingJournalTypeEnum } from '@services/app-layer/app-layer.enums';
import { AccountEntity } from '@services/app-layer/entities/account';
import { CrmAccountEntity } from '@services/app-layer/entities/crm';
import { DimensionEntity } from '@services/app-layer/entities/dimension';
import { GroupEntity } from '@services/app-layer/entities/group';
import { JournalEntryEntity, JournalLine } from '@services/app-layer/entities/journal-entries';
import { MemberEntity } from '@services/app-layer/entities/member';
import { ListUtilHelper } from '@services/helpers/utils/list-util.helper';

@Component({
  selector: 'app-view-journal-entry',
  templateUrl: 'view-journal-entry.component.html',
  styleUrls: ['./view-journal-entry.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ViewJournalEntryComponent {
  @Input() data: JournalEntryEntity;
  @Input() crmAccounts: CrmAccountEntity[] = [];
  @Input() groups: GroupEntity[] = [];
  @Input() accounts: AccountEntity[] = [];
  @Input() dimensions: DimensionEntity[] = [];
  @Input() members: MemberEntity[] = [];

  readonly journalEntryUrl = location.href;

  readonly typesEnum = AccountingJournalTypeEnum;

  constructor(@Inject(LOCALE_ID) private localeId: string) {}

  calculateDisplayGroupValue = (rowData: JournalEntryEntity) =>
    ListUtilHelper.getDisplayValueFromList(rowData.group, this.groups);

  calculateDisplayDimensionsValue = (rowData: JournalEntryEntity) =>
    rowData.dimensions.map(item => ListUtilHelper.getDisplayValueFromList(item, this.dimensions)).join(' | ');

  calculateDisplayAccountNumberValue = (rowData: JournalLine) =>
    ListUtilHelper.getDisplayValueFromList(rowData.account, this.accounts, 'id', 'numberAndName');

  formatAmountCurrency = e => formatCurrency(e.value, this.localeId, '$');

  get isVisible4thColumn() {
    return this.data && !this.data.isManual;
  }
}
