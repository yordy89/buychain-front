import { Component, Input } from '@angular/core';
import { TransactionEntity } from '@services/app-layer/entities/transaction';

@Component({
  selector: 'app-orders-by-state',
  templateUrl: './orders-by-state.component.html'
})
export class OrdersByStateComponent {
  private _tradersTransactions: any[];
  @Input() public get tradersTransactions(): TransactionEntity[] {
    return this._tradersTransactions;
  }
  public set tradersTransactions(value) {
    this._tradersTransactions = value;
    if (value) this.normalizeOrdersByState();
  }

  public data = [];

  constructor() {
    this.customizeLabelText = this.customizeLabelText.bind(this);
  }

  private normalizeOrdersByState(): void {
    this.data = this.tradersTransactions.reduce((acc, item) => {
      let found = acc.find(x => x.argument === item.state);
      if (!found) {
        found = { argument: item.state, value: 0 };
        acc.push(found);
      }
      found.value += 1;
      return acc;
    }, []);
  }

  customizeLabelText(pointInfo) {
    const total = this.data.reduce((sum, item) => (sum += item.value), 0);
    const percentage = (pointInfo.value / total) * 100;
    const roundToOneDecimal = Math.round(percentage * 10) / 10;
    return pointInfo.argument + '<br>' + roundToOneDecimal + '%';
  }
}
