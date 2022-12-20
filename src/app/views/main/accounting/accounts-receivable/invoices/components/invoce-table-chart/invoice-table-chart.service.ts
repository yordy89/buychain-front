import { Injectable } from '@angular/core';
import { getPalette } from 'devextreme/viz/palette';

export interface ChartSeriesItem {
  name: string;
  valueField: string;
  visible?: boolean;
  color?: string;
}

@Injectable({
  providedIn: 'root'
})
export class InvoiceTableChartService {
  palette = getPalette('Soft Pastel').simpleSet;
  stackedBarChartsColors = {
    'profit/settled': this.palette[5],
    loss: '#e23b3e',
    revenue: this.palette[0],
    expense: this.palette[1],
    totalInvoiced: this.palette[6],
    outstanding: this.palette[4]
  };

  agingChartPalette = [this.palette[5], this.palette[1], this.palette[6], this.palette[4], '#e23b3e'];

  statusItemsList: ChartSeriesItem[] = [
    {
      name: 'Invoices Outstanding',
      valueField: 'outstanding',
      visible: true,
      color: this.stackedBarChartsColors.outstanding
    },
    {
      name: 'Invoices Settled',
      valueField: 'settled',
      visible: true,
      color: this.stackedBarChartsColors['profit/settled']
    },
    { name: 'Total Invoiced', valueField: 'total', visible: false, color: this.stackedBarChartsColors.totalInvoiced }
  ];

  generateAgingLegendsList(chart, agingData) {
    if (!chart) {
      return;
    }

    const total = agingData.reduce((acc, curr) => acc + curr.total, 0);

    return agingData
      .map((item, index) => ({
        color: this.agingChartPalette[index],
        ...item
      }))
      .concat([{ total }]);
  }

  generateStatusLegendsList(chart, statusData) {
    if (!chart) {
      return;
    }
    return this.statusItemsList.map(({ valueField, name, color }) => ({
      color,
      key: name,
      total: statusData[0][valueField]
    }));
  }
}
