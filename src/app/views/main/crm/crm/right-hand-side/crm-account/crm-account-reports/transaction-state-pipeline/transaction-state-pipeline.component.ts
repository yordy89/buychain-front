import { Component, Input } from '@angular/core';
import { TransactionEntity } from '@services/app-layer/entities/transaction';
import { CrmAccountEntity } from '@services/app-layer/entities/crm';
import { TransactionStateEnum } from '@services/app-layer/app-layer.enums';
import { MemberEntity } from '@services/app-layer/entities/member';
import { ObjectUtil } from '@services/helpers/utils/object-util';
import { TransformHelper } from '@services/helpers/utils/transform-helper';

export interface FunnelChartDataFormat {
  state: string;
  label: string;
  count: number;
}

@Component({
  selector: 'app-transaction-state-pipeline',
  templateUrl: './transaction-state-pipeline.component.html'
})
export class TransactionStatePipelineComponent {
  @Input() crmSellersList: MemberEntity[];
  public _crmTransactions: TransactionEntity[];
  @Input() get crmTransactions(): TransactionEntity[] {
    return this._crmTransactions;
  }
  set crmTransactions(txs: TransactionEntity[]) {
    if (!txs) return;
    this._crmTransactions = txs;
    this.normalizeFunnelChartData(txs);
  }

  @Input() crmAccountData: CrmAccountEntity;

  public action: { onTraderSelect: (transactions: TransactionEntity[]) => void };

  public transactionCountStates: FunnelChartDataFormat[];

  constructor() {
    this.action = {
      onTraderSelect: (transactions: TransactionEntity[]) => this.normalizeFunnelChartData(transactions)
    };
  }

  public customizeText(arg: any) {
    return `${arg.argument}: ${arg.value} - ${arg.percentText}`;
  }

  private normalizeFunnelChartData(transactions: TransactionEntity[]): void {
    const transactionCountStates = ObjectUtil.enumToArray(TransactionStateEnum)
      .filter(x => x !== TransactionStateEnum.Canceled)
      .map(key => ({
        state: key,
        label: TransformHelper.stringUnderscoreToSpaceTitleCase(key),
        count: 0
      }));
    transactions.forEach(transaction => {
      const index = transactionCountStates.findIndex(item => item.state === transaction.state);
      if (index !== -1) transactionCountStates[index].count++;
    });
    this.transactionCountStates = transactionCountStates;
  }
}
