import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { TransactionCostDataModalComponent } from '@views/main/order/order-details/transaction-summary/cost-info/transaction-cost-data-modal/transaction-cost-data-modal.component';
import { first } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { TransportTermEnum } from '@app/services/app-layer/app-layer.enums';
import { TransactionEntity } from '@app/services/app-layer/entities/transaction';

@Component({
  selector: 'app-cost-info',
  templateUrl: './cost-info.component.html',
  styleUrls: ['./cost-info.component.scss']
})
export class CostInfoComponent implements OnChanges {
  @Input() transactionData: TransactionEntity;
  @Input() actions: any;
  isBuyerCollect: boolean;
  showFinalProfit: boolean;

  finalPayment = {
    isDefined: false,
    amountDefined: false,
    discountDefined: false,
    profitDefined: false,
    dateDefined: false
  };

  constructor(private dialog: MatDialog) {}

  ngOnChanges({ transactionData }: SimpleChanges) {
    if (transactionData?.currentValue) {
      this.isBuyerCollect = this.checkIfIsBuyerCollect();
    }
    this.setFinalPaymentDefinedInfo();
    this.showFinalProfit = this.transactionData.isSales;
  }

  configureShippingFees(): void {
    this.dialog
      .open(TransactionCostDataModalComponent, {
        width: '600px',
        disableClose: true,
        data: {
          transaction: this.transactionData,
          buyChainTxFee: this.transactionData.buyChainTxFee
        }
      })
      .afterClosed()
      .pipe(first())
      .subscribe(updated => {
        if (updated) this.actions.onTrackingDataUpdate();
      });
  }

  private checkIfIsBuyerCollect(): boolean {
    const terms = [TransportTermEnum.FOB_DEST_COLLECT, TransportTermEnum.FOB_ORIGIN_COLLECT];
    return this.transactionData.isPurchase && terms.includes(this.transactionData.trackingData.transportTerm);
  }

  private setFinalPaymentDefinedInfo(): void {
    this.finalPayment.isDefined = !!this.transactionData?.costData?.finalPayment;
    if (!this.finalPayment.isDefined) return;
    this.finalPayment.amountDefined = this.transactionData.costData.finalPayment.amount !== null;
    this.finalPayment.discountDefined = this.transactionData.costData.finalPayment.discount !== null;
    this.finalPayment.profitDefined = this.transactionData.costData.finalPayment.profit !== null;
    this.finalPayment.dateDefined = this.transactionData.costData.finalPayment.dateTime !== null;
  }
}
