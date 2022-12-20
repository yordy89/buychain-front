import { formatPercent } from '@angular/common';
import { Component, Inject, LOCALE_ID, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ObjectUtil } from '@services/helpers/utils/object-util';
import { TransformHelper } from '@services/helpers/utils/transform-helper';
import { first, tap } from 'rxjs/operators';
import { FunnelChartDataFormat } from '@views/main/crm/crm/right-hand-side/crm-account/crm-account-reports/transaction-state-pipeline/transaction-state-pipeline.component';
import { RoleInTransaction, TransactionStateEnum } from '@app/services/app-layer/app-layer.enums';
import { TransactionEntity } from '@services/app-layer/entities/transaction';
import { Environment } from '@services/app-layer/app-layer.environment';
import { AccessControlScope } from '@services/app-layer/permission/permission.interface';
import { CrmAccountCreditInfo } from '@services/data-layer/http-api/base-api/swagger-gen';
import { CrmService } from '@services/app-layer/crm/crm.service';
import { SearchService } from '@services/app-layer/search/search.service';
import { Observable } from 'rxjs';
import { TypeCheck } from '@services/helpers/utils/type-check';
import { Utils } from '@services/helpers/utils/utils';

@Component({
  selector: 'app-supplier-finance-review-modal',
  templateUrl: './supplier-finance-review-modal.component.html',
  styleUrls: ['./supplier-finance-review-modal.component.scss']
})
export class SupplierFinanceReviewModalComponent implements OnInit {
  public supplierTransactions: TransactionEntity[];
  public outstandingTransactions: TransactionEntity[] = [];
  public outstandingSalesTransactions: TransactionEntity[] = [];
  public outstandingPurchaseTransactions: TransactionEntity[] = [];

  public outstandingSalesTotalValue: number;
  public outstandingPurchaseTotalValue: number;

  public averageTransactionValue: number;
  public averageTransactionProfit: number;
  public averageTransactionMargin: number;

  public transactionValue: number;
  public transactionProfit: number;
  public transactionMargin: string;

  public crmCreditInfo: CrmAccountCreditInfo;

  public transactionStateDonutData: FunnelChartDataFormat[];

  public isSeller: boolean;
  public canReadCreditInfo: boolean;
  title = '';

  constructor(
    private searchService: SearchService,
    private dialogRef: MatDialogRef<SupplierFinanceReviewModalComponent>,
    private crmService: CrmService,
    @Inject(MAT_DIALOG_DATA) public data: TransactionEntity,
    @Inject(LOCALE_ID) private localeId: string
  ) {}

  ngOnInit() {
    this.isSeller = this.data.role === RoleInTransaction.Seller;
    this.initTitle();
    this.calculateTransactionSummary();
    this.loadSupplierTransactions().subscribe(() => {
      this.setOutstandingTransactions();
      this.calculateSupplierTotals();
      this.normalizeFunnelChartData(this.supplierTransactions);
      if (this.isSeller) this.getSupplierCreditInfo();
    });
  }
  public close(): void {
    this.dialogRef.close();
  }

  public customizeText(arg: any) {
    return `${arg.argument}: ${arg.value} - ${arg.percentText}`;
  }

  /*
   * private helpers
   * */

  private initTitle() {
    const name =
      this.data.role === RoleInTransaction.Seller ? this.data.buyingCompanyName : this.data.sellerCompanyName;

    this.title = `${name} Finance At a Glance`;
  }

  private calculateTransactionSummary(): void {
    this.transactionValue = this.data.totalPrice;
    if (this.isSeller) {
      this.transactionProfit = this.data.profit || 0;
      this.transactionMargin = this.data.isMarginNotDefined
        ? <string>this.data.margin
        : formatPercent(<number>this.data.margin || 0, this.localeId, '1.0-2');
    }
  }

  private loadSupplierTransactions(): Observable<TransactionEntity[]> {
    return this.searchService.fetchTransactionData(this.getSearchTxPayload()).pipe(
      first(),
      tap(txs => (this.supplierTransactions = txs.map(t => new TransactionEntity().init(t))))
    );
  }

  private setOutstandingTransactions(): void {
    this.outstandingTransactions = this.supplierTransactions.filter(
      tx =>
        tx.state === TransactionStateEnum.Confirmed ||
        tx.state === TransactionStateEnum.InTransit ||
        tx.state === TransactionStateEnum.ChangePending
    );
    this.outstandingPurchaseTransactions = this.outstandingTransactions.filter(t => t.isPurchase);
    this.outstandingSalesTransactions = this.outstandingTransactions.filter(t => t.isSales);

    this.outstandingPurchaseTotalValue = this.outstandingPurchaseTransactions.reduce(
      (acc, cur) => acc + cur.totalPrice,
      0
    );
    this.outstandingSalesTotalValue = this.outstandingSalesTransactions.reduce((acc, cur) => acc + cur.totalPrice, 0);
  }

  private calculateSupplierTotals(): void {
    const confirmedTxs = this.supplierTransactions.filter(tx => tx.passedTheState(TransactionStateEnum.Review));
    this.averageTransactionValue = confirmedTxs.length
      ? confirmedTxs.reduce((acc, cur) => acc + cur.totalPrice, 0) / confirmedTxs.length
      : 0;

    if (this.isSeller) {
      const confirmedSalesTxs = confirmedTxs.filter(t => t.isSales);
      let aggregatedProfit = 0;
      let profitDefCount = 0;
      let aggregatedMargin = 0;
      let marginDefCount = 0;
      confirmedSalesTxs.forEach(t => {
        if (TypeCheck.isNumber(t.profit)) {
          aggregatedProfit += t.profit;
          profitDefCount++;
        }
        const margin = t.margin as number;
        if (!t.isMarginNotDefined && isFinite(margin)) {
          aggregatedMargin += margin;
          marginDefCount++;
        }
      });
      if (profitDefCount > 0) this.averageTransactionProfit = aggregatedProfit / profitDefCount;
      if (marginDefCount > 0) this.averageTransactionMargin = aggregatedMargin / marginDefCount;
    }
  }

  private normalizeFunnelChartData(transactions: TransactionEntity[]): void {
    const transactionCountStates = ObjectUtil.enumToArray(TransactionStateEnum)
      .map(key => ({
        state: key,
        label: TransformHelper.stringUnderscoreToSpaceTitleCase(key),
        count: 0
      }))
      .filter(i => i.state !== TransactionStateEnum.Draft && i.state !== TransactionStateEnum.Canceled);
    transactions.forEach(transaction => {
      const index = transactionCountStates.findIndex(item => item.state === transaction.state);
      if (index !== -1) transactionCountStates[index].count++;
    });
    this.transactionStateDonutData = transactionCountStates;
  }

  private async getSupplierCreditInfo() {
    const userCrmPermissions =
      Environment.getCurrentUser().normalizedAccessControlRoles.CRM_ACCOUNT.CRMSection.sectionGroup;
    const accounts = await this.crmService.getAccounts(true).pipe(first()).toPromise();
    const account = accounts.find(item => item.id === this.data.buyingCompanyId);
    this.canReadCreditInfo =
      userCrmPermissions.readCreditInfo.value === AccessControlScope.Company ||
      (userCrmPermissions.readCreditInfo.value === AccessControlScope.Owner &&
        account.salesTeam.some(seller => seller === Environment.getCurrentUser().id));
    if (this.canReadCreditInfo) {
      this.crmService
        .getAccountCreditInfo(account.id)
        .pipe(first())
        .subscribe(creditInfo => (this.crmCreditInfo = creditInfo));
    }
  }

  private getSearchTxPayload(): any {
    const nonCanceledPayload = Utils.getSearchTxCancelStateExcludePayload();
    const nonArchivedPayload = Utils.getSearchTxExcludeArchivedPayload();
    const otherSideCompanyId =
      this.data.role === RoleInTransaction.Seller ? this.data.buyingCompanyId : this.data.sellerCompanyId;
    const vendorPayload = { value: { field: 'vendorCrm', comparisonOperator: 'eq', fieldValue: otherSideCompanyId } };
    const customerPayload = {
      value: { field: 'customerCrm', comparisonOperator: 'eq', fieldValue: otherSideCompanyId }
    };
    return {
      filters: {
        children: {
          logicalOperator: 'or',
          items: [nonArchivedPayload, nonCanceledPayload, vendorPayload, customerPayload]
        }
      },
      fields: ['state', 'tally', 'trackingData', 'costData', 'register']
    };
  }
}
