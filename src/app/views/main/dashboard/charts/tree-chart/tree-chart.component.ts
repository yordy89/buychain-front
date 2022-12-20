import { Component, Input, ChangeDetectorRef } from '@angular/core';
import { TransactionEntity } from '@services/app-layer/entities/transaction';
import { CrmService } from '@services/app-layer/crm/crm.service';

@Component({
  selector: 'app-tree-chart',
  templateUrl: './tree-chart.component.html'
})
export class TreeChartComponent {
  private _managersTransactions: any[];
  @Input() public get managersTransactions(): TransactionEntity[] {
    return this._managersTransactions;
  }
  public set managersTransactions(value) {
    this._managersTransactions = value;
    if (value) this.normalizeTreeChartData();
  }

  public data = [];

  constructor(private crmService: CrmService, private cd: ChangeDetectorRef) {}

  private async normalizeTreeChartData() {
    const crmLocations = await this.crmService.getLocations().toPromise();
    this.data = [];

    const txs = this.managersTransactions
      .filter(t => t.isConfirmedOrHigherState)
      .map(t => {
        const productGroup = t['productGroup'] || t.tallyUnitsByLot[0]?.productGroup;
        const location = crmLocations.find(item => item.id === t.shipTo?.id);
        return { productGroup, shipToState: t['shipToState'] || location?.state || location?.link?.state, ...t };
      });

    const groupedByState = this.groupBy(
      txs.filter(x => x.isConfirmedOrHigherState),
      'shipToState'
    );

    Object.keys(groupedByState).forEach(stateKey => {
      const groupedByProduct = this.groupBy(groupedByState[stateKey], 'productGroup');

      const stateData = Object.keys(groupedByProduct).map(product => ({
        name: `${product} - ${groupedByProduct[product].length}`,
        value: groupedByProduct[product].length
      }));

      const stateCount = stateData.reduce((acc, current) => (acc += current.value), 0);

      this.data.push({
        name: `${stateKey} - ${stateCount}`,
        items: stateData
      });
    });
    this.cd.markForCheck();
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
