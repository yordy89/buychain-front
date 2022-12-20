import { Component, Input } from '@angular/core';
import { TransactionEntity } from '@services/app-layer/entities/transaction';

@Component({
  selector: 'app-customer-mix',
  templateUrl: './customer-mix.component.html'
})
export class CustomerMixComponent {
  private _tradersTransactions: any[];
  @Input() public get tradersTransactions(): TransactionEntity[] {
    return this._tradersTransactions;
  }
  public set tradersTransactions(value) {
    this._tradersTransactions = value;
    if (value) this.normalizeCustomerMixData();
  }

  public data = [];

  constructor() {
    this.customizeLabelText = this.customizeLabelText.bind(this);
  }

  private normalizeCustomerMixData(): void {
    const txs = this.tradersTransactions.filter(t => t.isConfirmedOrHigherState);
    this.data = txs.reduce((acc, item) => {
      let found = acc.find(x => x.argument === item.buyingCompanyName);
      if (!found) {
        found = { argument: item.buyingCompanyName, value: 0 };
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
