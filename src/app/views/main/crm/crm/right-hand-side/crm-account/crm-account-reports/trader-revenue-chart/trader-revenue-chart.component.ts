import { Component, Input } from '@angular/core';
import { TransactionEntity } from '@services/app-layer/entities/transaction';
import { MemberEntity } from '@services/app-layer/entities/member';
import { CrmAccountEntity } from '@services/app-layer/entities/crm';
import { TransactionStateEnum } from '@services/app-layer/app-layer.enums';
import { Environment } from '@services/app-layer/app-layer.environment';

enum ChartOption {
  Revenue = 'REVENUE',
  Margin = 'MARGIN',
  NumberOfTransactions = 'NUMBER_OF_TRANSACTIONS'
}
const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];

@Component({
  selector: 'app-trader-revenue-chart',
  templateUrl: './trader-revenue-chart.component.html',
  styleUrls: ['./trader-revenue-chart.component.scss']
})
export class TraderRevenueChartComponent {
  @Input() crmSellersList: MemberEntity[];
  public _crmTransactions: TransactionEntity[];
  @Input() get crmTransactions(): TransactionEntity[] {
    return this._crmTransactions;
  }
  set crmTransactions(txs: TransactionEntity[]) {
    if (!txs) return;
    this._crmTransactions = txs.filter(
      tx => tx.passedTheState(TransactionStateEnum.Review) && tx.state !== TransactionStateEnum.Canceled
    );
    this.populateChartData();
  }

  private _crmAccountData: CrmAccountEntity;
  @Input() get crmAccountData(): CrmAccountEntity {
    return this._crmAccountData;
  }
  set crmAccountData(value: CrmAccountEntity) {
    if (!value) return;
    this._crmAccountData = value;
    this.populateChartData();
  }

  public chartOptions = Object.keys(ChartOption).map(key => ChartOption[key]);
  public optionState: ChartOption = ChartOption.Revenue;

  public revenueByTraderChartData: any[];

  public onOptionChanged(): void {
    this.populateChartData();
  }

  public populateChartData() {
    const usersObject = { others: 0 };

    if (!this.crmSellersList) return;
    this.crmSellersList.forEach(seller => (usersObject[seller.username] = 0));

    const fiscalYearStart = Environment.getCurrentCompany()?.accountingPractices?.fiscalYearStart;
    const fiscalYearMonth = monthNames.findIndex(m => m.toLowerCase() === fiscalYearStart.toLowerCase());

    let reportByTraderList = Array.from(Array(12).keys()).map(val => ({ month: val, ...usersObject }));

    this.crmTransactions.forEach(transaction => {
      const trader = this.crmSellersList.find(seller => seller.id === transaction.seller.id);
      trader
        ? (reportByTraderList[new Date(transaction.draftDate).getMonth()][trader.username] +=
            this.calculateReportedValueByOption(transaction, this.optionState))
        : (reportByTraderList[new Date(transaction.draftDate).getMonth()].others += this.calculateReportedValueByOption(
            transaction,
            this.optionState
          ));
    });
    if (fiscalYearMonth >= 0)
      reportByTraderList = reportByTraderList
        .slice(fiscalYearMonth)
        .concat(reportByTraderList.slice(0, fiscalYearMonth));

    this.revenueByTraderChartData = reportByTraderList.map(item => ({ ...item, month: monthNames[item.month] }));
  }

  public calculateReportedValueByOption(transaction: TransactionEntity, option: ChartOption): number {
    if (option === ChartOption.Revenue) {
      return transaction.totalPrice;
    }

    if (option === ChartOption.Margin) {
      return transaction.isMarginNotDefined ? 0 : <number>transaction.margin;
    }

    return option === ChartOption.NumberOfTransactions ? 1 : 0;
  }
}
