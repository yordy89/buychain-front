import { Component, Input } from '@angular/core';
import { TransactionEntity } from '@services/app-layer/entities/transaction';
import { CrmAccountEntity } from '@services/app-layer/entities/crm';
import { TransactionStateEnum } from '@services/app-layer/app-layer.enums';
import { MemberEntity } from '@services/app-layer/entities/member';
import { GridHelperService } from '@services/helpers/grid-helper/grid-helper.service';

@Component({
  selector: 'app-top-spec-table',
  templateUrl: './top-spec-table.component.html'
})
export class TopSpecTableComponent {
  public crmConfirmedTransactions: TransactionEntity[];
  @Input() crmSellersList: MemberEntity[];
  public _crmTransactions: TransactionEntity[];
  @Input() get crmTransactions(): TransactionEntity[] {
    return this._crmTransactions;
  }
  set crmTransactions(txs: TransactionEntity[]) {
    if (txs) {
      this.crmConfirmedTransactions = txs.filter(
        tx => tx.passedTheState(TransactionStateEnum.Review) && tx.state !== TransactionStateEnum.Canceled
      );
      if (this.crmConfirmedTransactions) this.setTop5LotsList(this.crmConfirmedTransactions);
    }
  }

  @Input() crmAccountData: CrmAccountEntity;

  public action: { onTraderSelect: (transactions: TransactionEntity[]) => void };

  public topTallySpecsList: any[] = [];

  constructor(private gridHelperService: GridHelperService) {
    this.action = { onTraderSelect: (transactions: TransactionEntity[]) => this.setTop5LotsList(transactions) };
  }

  onExporting(e) {
    this.gridHelperService.exportToExcel(e, 'MarketProductLots');
  }

  private setTop5LotsList(transactions: TransactionEntity[]): void {
    this.topTallySpecsList = this.getTop5SoldProductLots(transactions);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private getTop5SoldProductLots(transactions: TransactionEntity[]) {
    const result: {
      lotId;
      specShorthand;
      priceOfMerit;
      shipFromFacility;
      count;
    }[] = [];
    //
    // transactions.forEach(tx => {
    //   tx.costData.soldTally.forEach(tallyItem => {
    //     const exist = result.find(x => x.lotId === tallyItem.lineItem.id);
    //     if (exist) {
    //       exist.count += tallyItem.qty;
    //     } else {
    //       result.push({
    //         lotId: tallyItem.lineItem.id,
    //         specShorthand: tallyItem.specShorthand,
    //         priceOfMerit: tallyItem.priceOfMerit,
    //         shipFromFacility: tallyItem.lineItem.onlineData.shipFromShortName,
    //         count: tallyItem.qty
    //       });
    //     }
    //   });
    // });

    if (!result?.length) {
      return [];
    }

    return result.sort((a, b) => b.count - a.count).slice(0, 5);
  }
}
