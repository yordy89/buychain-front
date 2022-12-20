import { Component, Input, OnInit } from '@angular/core';
import { TransactionEntity } from '@services/app-layer/entities/transaction';
import { MemberEntity } from '@services/app-layer/entities/member';
import { CrmAccountEntity } from '@services/app-layer/entities/crm';

@Component({
  selector: 'app-seller-summary',
  templateUrl: './seller-summary.component.html',
  styleUrls: ['./seller-summary.component.scss']
})
export class SellerSummaryComponent implements OnInit {
  @Input() accountTransactions: TransactionEntity[];
  @Input() seller: MemberEntity;
  @Input() crmAccountData: CrmAccountEntity;

  public sellerTransactions: TransactionEntity[];

  public sellerTransactionsNumberYTD: number;
  public sellerRevenueYTD: number;
  public sellerMarginYTD: number;
  public sellerAllTimeRevenue: number;
  public averageTransactionsMonthYTD: number;
  public averageRevenueTransactionYTD: number;
  public averageMarginTransactionYTD: number;

  ngOnInit() {
    this.setSellerSummary();
  }

  /*
   * private helpers
   * */

  private setSellerSummary(): void {
    this.seller
      ? (this.sellerTransactions = this.accountTransactions.filter(
          transaction => transaction.seller.id === this.seller.id
        ))
      : (this.sellerTransactions = this.accountTransactions.filter(
          transaction => !this.crmAccountData.salesTeam.some(traderId => traderId === transaction.seller.id)
        ));
    this.calculateSellerSummaryData(this.sellerTransactions);
  }

  private calculateSellerSummaryData(transactions: TransactionEntity[]): void {
    // TODO filter transactions to have state complete in parent
    const transactionsYTD = transactions.filter(
      transaction => new Date(transaction.draftDate).getFullYear() === new Date().getFullYear()
    );

    this.sellerTransactionsNumberYTD = transactionsYTD.length;
    this.sellerRevenueYTD = transactionsYTD.reduce((acc, current) => acc + current.totalPrice, 0);
    this.sellerMarginYTD = transactionsYTD.reduce((acc, current) => acc + current.tallyTotalOfferedPrice, 0);
    this.sellerAllTimeRevenue = transactions.reduce((acc, current) => acc + current.totalPrice, 0);

    this.averageTransactionsMonthYTD = this.sellerTransactionsNumberYTD / new Date().getMonth();
    this.averageRevenueTransactionYTD = this.sellerTransactionsNumberYTD
      ? this.sellerRevenueYTD / this.sellerTransactionsNumberYTD
      : 0;
    this.averageMarginTransactionYTD = this.sellerTransactionsNumberYTD
      ? this.sellerMarginYTD / this.sellerTransactionsNumberYTD
      : 0;
  }
}
