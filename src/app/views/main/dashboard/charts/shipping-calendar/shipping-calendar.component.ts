import { Component, Input } from '@angular/core';
import { TransactionEntity } from '@app/services/app-layer/entities/transaction';
import { NavigationHelperService } from '@app/services/helpers/navigation-helper/navigation-helper.service';
import { isEqual, isValid, startOfDay } from 'date-fns';

@Component({
  selector: 'app-shipping-calendar',
  templateUrl: './shipping-calendar.component.html',
  styleUrls: ['./shipping-calendar.component.scss']
})
export class ShippingCalendarComponent {
  private _tradersTransactions: any[];
  @Input() public get tradersTransactions(): TransactionEntity[] {
    return this._tradersTransactions;
  }
  public set tradersTransactions(value) {
    this._tradersTransactions = value;
    if (value) this.normalizeShippingCalendarData();
  }
  @Input() medianOrdersPerDay: number;

  public shipmentCountByDate = new Map();
  public estimatedOrders: TransactionEntity[] = [];
  public seriesCalcBasis = 0;
  public hovered = false;
  public showTooltip = false;
  public hoveredCellData: any;
  public tooltipData: any;
  public tooltipHovered = false;
  public tooltipBottom = 10;
  public tooltipLeft = 10;
  public tooltipWidth = 300;
  public tooltipHeight = 100;

  public legends = [
    {
      threshold: 2,
      actualValue: 0,
      cssClasses: 'red'
    },
    {
      threshold: 1,
      actualValue: 0,
      cssClasses: 'orange'
    },
    {
      threshold: 0,
      actualValue: 0,
      cssClasses: 'green'
    }
  ];

  constructor(private navigationHelper: NavigationHelperService) {}

  private normalizeShippingCalendarData(): void {
    const txs = this.tradersTransactions.filter(t => t.isConfirmedOrHigherState);

    this.seriesCalcBasis = this.medianOrdersPerDay > 0 ? this.medianOrdersPerDay : 2;
    this.legends.forEach(
      x => (x.actualValue = x.threshold === 0 ? this.seriesCalcBasis : this.seriesCalcBasis * x.threshold)
    );

    this.estimatedOrders = txs.filter(tx => tx.trackingData?.estimatedShipDate || tx.tallyShipDate || tx['date']);
    this.shipmentCountByDate = this.estimatedOrders.reduce((accMap, current) => {
      let estShipmentDate = current.trackingData?.estimatedShipDate || current.tallyShipDate || current['date'];
      if (isValid(estShipmentDate)) estShipmentDate = startOfDay(estShipmentDate);

      const found = accMap.get(estShipmentDate.getTime());
      const newValue = found ? found + 1 : 1;
      accMap.set(estShipmentDate.getTime(), newValue);

      return accMap;
    }, new Map());
  }

  public getDateMarkerCssClass(cellData) {
    const currentDayShippingCount = this.shipmentCountByDate.get(cellData.date.getTime());
    if (currentDayShippingCount) {
      const legend = this.legends.find(x => currentDayShippingCount / this.seriesCalcBasis >= x.threshold);
      return 'marker ' + legend.cssClasses;
    }
  }

  public onMouseOver(e, cellData) {
    if (!this.shipmentCountByDate.get(cellData.date.getTime())) return;

    const currentDayOrders = this.estimatedOrders.filter(tx => {
      const date = tx.trackingData?.estimatedShipDate || tx.tallyShipDate || tx['date'];

      if (!date) {
        return false;
      }

      return isEqual(startOfDay(date), cellData.date);
    });
    this.tooltipData = { orders: currentDayOrders };

    const rect = e.target.getBoundingClientRect();
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const documentHeight = window.innerHeight;
    const x = rect.left + scrollLeft;
    const y = rect.top + scrollTop;
    const bottom = documentHeight - y;

    this.tooltipBottom = bottom;
    this.tooltipLeft = x - (this.tooltipWidth / 2 - 15);

    this.hovered = true;
    this.showTooltip = true;
  }

  public onMouseOut() {
    this.hovered = false;
    setTimeout(() => (this.hovered || this.tooltipHovered ? null : (this.showTooltip = false)), 500);
  }

  public toolTipMouseOver() {
    this.tooltipHovered = true;
  }

  public toolTipMouseOut() {
    this.tooltipHovered = false;
    setTimeout(() => (this.hovered || this.tooltipHovered ? null : (this.showTooltip = false)), 500);
  }

  public navigateToTransaction(transactionId: string) {
    this.navigationHelper.navigateToTransactionById(transactionId);
  }

  public getLinkToTransaction(transactionId: string): string {
    return this.navigationHelper.getLinkToTransaction(transactionId);
  }
}
