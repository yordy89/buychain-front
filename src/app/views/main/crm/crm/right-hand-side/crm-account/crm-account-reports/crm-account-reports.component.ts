import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, combineLatest, Subject } from 'rxjs';
import { first, map, takeUntil } from 'rxjs/operators';
import { TransactionEntity } from '@services/app-layer/entities/transaction';
import { CompaniesService } from '@services/app-layer/companies/companies.service';
import { MemberEntity } from '@services/app-layer/entities/member';
import { CrmAccountEntity } from '@services/app-layer/entities/crm';
import { SearchService } from '@services/app-layer/search/search.service';
import { Environment } from '@services/app-layer/app-layer.environment';
import { CompanyDetails } from '@services/data-layer/http-api/base-api/swagger-gen';
import { TransactionStateEnum } from '@services/app-layer/app-layer.enums';
import { Utils } from '@services/helpers/utils/utils';

@Component({
  selector: 'app-crm-account-reports',
  templateUrl: './crm-account-reports.component.html',
  styleUrls: ['./crm-account-reports.component.scss']
})
export class CrmAccountReportsComponent implements OnInit, OnDestroy {
  private _crmAccountData: CrmAccountEntity;
  @Input() get crmAccountData(): CrmAccountEntity {
    return this._crmAccountData;
  }
  set crmAccountData(value: CrmAccountEntity) {
    if (!value) return;
    this._crmAccountData = value;
    this.setAccountReports();
  }

  @Input() isLeftPartVisible$: BehaviorSubject<boolean>;
  public crmSellersList: MemberEntity[];

  public companyData: CompanyDetails;

  public crmTransactions: TransactionEntity[];
  public crmFYAllTransactions: TransactionEntity[];
  public crmFYConfirmedTransactions: TransactionEntity[];

  public totalTransactionsNumberYTD: number;
  public totalRevenueYTD: number;
  public totalMarginYTD: number;
  public allTimeRevenue: number;

  public averageTransactionsMonthYTD: number;
  public averageRevenueTransactionYTD: number;
  public averageMarginTransactionYTD: number;

  private destroy$ = new Subject<void>();

  constructor(private companiesService: CompaniesService, private searchService: SearchService) {}

  ngOnInit() {
    this.companyData = Environment.getCurrentCompany();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setAccountReports(): void {
    combineLatest([
      this.searchService.fetchTransactionData(this.getSearchTxPayload()).pipe(
        first(),
        map(txs => txs.map(t => new TransactionEntity().init(t)))
      ),
      this.companiesService.getCompanyCompleteMembers().pipe(first())
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([transactions, membersList]) => {
        this.crmSellersList = membersList.filter(member =>
          this.crmAccountData.salesTeam.some(sellerId => member.id === sellerId)
        );
        this.crmTransactions = transactions;
        this.crmFYAllTransactions = this.filterFiscalYearAllTransactions(this.crmTransactions);
        this.crmFYConfirmedTransactions = this.filterFiscalYearConfirmedTransactions(this.crmTransactions);

        this.calculateSummaryData(this.crmTransactions);
      });
  }

  private calculateSummaryData(transactions: TransactionEntity[]): void {
    const confirmedTxs = transactions.filter(
      tx => tx.passedTheState(TransactionStateEnum.Review) && tx.state !== TransactionStateEnum.Canceled
    );

    const transactionsYTD = confirmedTxs.filter(
      transaction => new Date(transaction.confirmedDate).getFullYear() === new Date().getFullYear()
    );

    this.totalTransactionsNumberYTD = transactionsYTD.length;
    this.totalRevenueYTD = transactionsYTD.reduce((acc, current) => acc + current.totalPrice, 0);
    this.totalMarginYTD = transactionsYTD.reduce((acc, current) => acc + current.tallyTotalOfferedPrice, 0);

    this.allTimeRevenue = confirmedTxs.reduce((acc, current) => acc + current.totalPrice, 0);

    this.averageTransactionsMonthYTD = this.totalTransactionsNumberYTD / (new Date().getMonth() + 1);
    this.averageRevenueTransactionYTD = this.totalTransactionsNumberYTD
      ? this.totalRevenueYTD / this.totalTransactionsNumberYTD
      : 0;
    this.averageMarginTransactionYTD = this.totalTransactionsNumberYTD
      ? this.totalMarginYTD / this.totalTransactionsNumberYTD
      : 0;
  }

  // checks if any of tx dates is in current fiscal year
  private filterFiscalYearAllTransactions(transactions: TransactionEntity[]): TransactionEntity[] {
    return transactions.filter(tx =>
      Object.keys(tx.register).every(key => this.checkTransactionIsInFiscalYear(tx[key]))
    );
  }

  // checks if tx confirmed or higher state is in current fiscal year
  private filterFiscalYearConfirmedTransactions(transactions: TransactionEntity[]): TransactionEntity[] {
    return transactions.filter(tx =>
      ['confirmedDate', 'inTransitDate', 'completeDate', 'changePending'].every(
        key => tx[key] && this.checkTransactionIsInFiscalYear(tx[key])
      )
    );
  }

  private checkTransactionIsInFiscalYear(txData: Date): boolean {
    if (!txData) return false;
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
    const fiscalYearStart = Environment.getCurrentCompany()?.accountingPractices?.fiscalYearStart;
    const fiscalYearMonth = monthNames.findIndex(m => m.toLowerCase() === fiscalYearStart.toLowerCase());
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    return (
      txData.getFullYear() === currentYear ||
      (txData.getFullYear() === currentYear - 1 &&
        currentMonth < fiscalYearMonth &&
        txData.getMonth() >= fiscalYearMonth)
    );
  }

  private getSearchTxPayload(): any {
    const vendorPayload = {
      value: { field: 'vendorOnline', comparisonOperator: 'eq', fieldValue: Environment.getCurrentUser()?.companyId }
    };
    const customerPayload = {
      value: { field: 'customerCrm', comparisonOperator: 'eq', fieldValue: this.crmAccountData.id }
    };
    return {
      filters: {
        children: {
          logicalOperator: 'and',
          items: [
            vendorPayload,
            customerPayload,
            Utils.getSearchTxCancelStateExcludePayload(),
            Utils.getSearchTxExcludeArchivedPayload()
          ]
        }
      },
      fields: ['state', 'tally', 'trackingData', 'costData', 'register']
    };
  }
}
