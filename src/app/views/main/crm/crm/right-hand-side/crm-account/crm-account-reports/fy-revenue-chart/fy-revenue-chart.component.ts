import { Component, Input, OnInit } from '@angular/core';
import { TransactionEntity } from '@services/app-layer/entities/transaction';
import { CrmAccountEntity } from '@services/app-layer/entities/crm';
import { TransactionStateEnum } from '@services/app-layer/app-layer.enums';
import { Environment } from '@services/app-layer/app-layer.environment';
import { MemberEntity } from '@services/app-layer/entities/member';

export interface RevenuePerMonth {
  month: string;
  currentYear: number;
  lastYear: number;
}

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];

@Component({
  selector: 'app-fy-revenue-chart',
  templateUrl: './fy-revenue-chart.component.html'
})
export class FYRevenueChartComponent implements OnInit {
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
      if (this.crmConfirmedTransactions) this.normalizedChartData(this.crmConfirmedTransactions);
    }
  }
  @Input() crmAccountData: CrmAccountEntity;

  public action: { onTraderSelect: (transactions: TransactionEntity[]) => void };

  public fiscalYear: number;
  public fiscalYearChartData: RevenuePerMonth[];
  public chartTitle: string;

  constructor() {
    this.action = { onTraderSelect: (transactions: TransactionEntity[]) => this.normalizedChartData(transactions) };
  }

  ngOnInit() {
    this.setChartTitle();
  }

  private setChartTitle(): void {
    const currentMonth = new Date().getMonth();
    const fiscalYearMonth = monthNames.findIndex(
      m => m.toLowerCase() === Environment.getCurrentCompany()?.accountingPractices?.fiscalYearStart?.toLowerCase()
    );
    const fiscalYearLag = fiscalYearMonth - currentMonth > 0 ? 1 : 0;
    this.fiscalYear = new Date().getFullYear() - fiscalYearLag;
    this.chartTitle = `FY ${this.fiscalYear} and FY ${this.fiscalYear - 1}`;
  }

  private normalizedChartData(transactions: TransactionEntity[]): void {
    const fiscalYearStart = Environment.getCurrentCompany()?.accountingPractices?.fiscalYearStart;
    const fiscalYearMonth = monthNames.findIndex(m => m.toLowerCase() === fiscalYearStart.toLowerCase());
    let chartData = Array.from(Array(12).keys()).map(val => ({ month: val, currentYear: 0, lastYear: 0 }));

    transactions.forEach(transaction => this.setYearToChartData(transaction, chartData, fiscalYearMonth));
    if (fiscalYearMonth) chartData = chartData.slice(fiscalYearMonth).concat(chartData.slice(0, fiscalYearMonth));
    this.fiscalYearChartData = chartData.map(item => ({ ...item, month: monthNames[item.month] }));
  }

  private setYearToChartData(transaction, chartData, fiscalYearMonth) {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const txCreationMonth = transaction.draftDate.getMonth();
    const txCreationYear = transaction.draftDate.getFullYear();

    if (txCreationYear === currentYear) {
      chartData[txCreationMonth].currentYear += transaction.totalPrice;
    }

    if (currentMonth >= fiscalYearMonth && txCreationYear === currentYear - 1) {
      chartData[txCreationMonth].lastYear += transaction.totalPrice;
    } else {
      if (txCreationYear === currentYear - 1) {
        txCreationMonth >= fiscalYearMonth
          ? (chartData[txCreationMonth].currentYear += transaction.totalPrice)
          : (chartData[txCreationMonth].lastYear += transaction.totalPrice);
      }

      if (txCreationYear === currentYear - 2 && txCreationMonth >= fiscalYearMonth) {
        chartData[txCreationMonth].lastYear += transaction.totalPrice;
      }
    }
  }
}
