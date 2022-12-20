import { TransactionEntity } from '@services/app-layer/entities/transaction';

export class SalesPerformanceChartEntity {
  index: number;
  time: any;
  txsList: TransactionEntity[];

  numberOfTransactions: number;
  revenue = 0;
  margin = 0;
  avgMargin = 0;
  volume = 0;

  isPriceSystemUnique = true;
  priceSystem = '';

  public init(dto) {
    Object.assign(this, dto);

    this.numberOfTransactions = this.txsList.length;
    this.txsList.forEach(tx => {
      this.checkIfPriceSystemIsUnique(tx);
      this.revenue += tx.totalPrice;
      this.margin += tx.profit || 0;

      if (tx.margin && !tx.isMarginNotDefined) {
        this.avgMargin = this.avgMargin + <number>tx.margin / this.numberOfTransactions;
      }

      this.volume += this.priceSystem ? tx.tallyMeasurePerPriceSystem.reduce((a, c) => a + c.total, 0) : 0;
    });

    this.volume = Math.round(this.volume * 1000) / 1000;
    return this;
  }

  private checkIfPriceSystemIsUnique(tx: TransactionEntity): void {
    if (this.isPriceSystemUnique) {
      if (!this.priceSystem) {
        this.priceSystem = tx.tallyMeasurePerPriceSystem[0] ? tx.tallyMeasurePerPriceSystem[0].priceSystem : '';
      } else if (tx.tallyMeasurePerPriceSystem.some(measure => measure.priceSystem !== this.priceSystem)) {
        this.isPriceSystemUnique = false;
        this.priceSystem = '';
      }
    }
  }
}
