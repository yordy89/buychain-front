import { Component, Input } from '@angular/core';
import { TransactionEntity } from '@services/app-layer/entities/transaction';

@Component({
  selector: 'app-orders-by-type',
  templateUrl: './orders-by-type.component.html',
  styleUrls: ['./orders-by-type.component.css']
})
export class OrdersByTypeComponent {
  private _managersTransactions: any[];
  @Input() public get managersTransactions(): TransactionEntity[] {
    return this._managersTransactions;
  }
  public set managersTransactions(value) {
    this._managersTransactions = value;
    if (value) this.normalizeOrdersByType();
  }

  public data = [];

  private normalizeOrdersByType(): void {
    this.data = [];
    const txs = this.managersTransactions
      .filter(t => t.isConfirmedOrHigherState)
      .map(t => {
        const productGroup = t['productGroup'] || t.tallyUnitsByLot[0].productGroup;
        return { productGroup, ...t };
      });
    const groupedByProduct = this.groupBy(txs, 'productGroup');
    Object.keys(groupedByProduct).forEach(key => {
      this.data.push({ name: key, value: groupedByProduct[key].length });
    });
  }

  groupBy(items, key) {
    return items.reduce(
      (result, item) => ({
        ...result,
        [item[key]]: [...(result[item[key]] || []), item]
      }),
      {}
    );
  }
}
