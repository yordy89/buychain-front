import { formatCurrency } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Inject,
  Input,
  LOCALE_ID,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { ChartLegend } from '@app/models';
import { ARSalesOrder } from '@services/app-layer/entities/accounts-receivable';
import { SalesOrdersService } from '@views/main/accounting/accounts-receivable/sales-orders/sales-orders.service';
import { DxChartComponent } from 'devextreme-angular';
import { fromEvent, Subject, zip } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import * as html2pdf from 'html2pdf.js';
import { saveAs } from 'file-saver';
import { Utils } from '@services/helpers/utils/utils';
import { ChartSeriesItem } from '@views/main/accounting/accounts-receivable/invoices/components/invoce-table-chart/invoice-table-chart.service';
import { SpinnerHelperService } from '@services/helpers/spinner-helper/spinner-helper.service';

@Component({
  selector: 'app-sales-order-table-chart',
  templateUrl: 'sales-order-table-chart.component.html',
  styleUrls: ['./sales-order-table-chart.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SalesOrderTableChartComponent implements OnInit, OnChanges, OnDestroy {
  @Input() items: ARSalesOrder[] = [];
  @Output() closed = new EventEmitter<void>();

  @ViewChild('profitChart', { read: DxChartComponent }) set profitContent(chart) {
    if (this.profitChart) {
      return;
    }
    this.profitChart = chart;
    this.profitLegendsList = this.salesOrdersService.generateProfitLegendsList(chart, this.profitData);
    this.profitItemsList = this.salesOrdersService.getRearrangedProfitItemsList(this.profitData);
    this.profitGeneratedSubj.next();
  }

  @ViewChild('statusChart', { read: DxChartComponent }) set statusContent(chart) {
    if (this.statusChart) {
      return;
    }
    this.statusChart = chart;
    this.statusLegendsList = this.salesOrdersService.generateStatusLegendsList(chart, this.statusData);
    this.statusItemsList = this.salesOrdersService.statusItemsList;
    this.statusGeneratedSubj.next();
  }

  visibleCharts = false;

  profitData: { name: string; revenue: number; expense: number; profit: number }[] = [];
  profitLegendsList: ChartLegend[] = [];

  statusData: { name: string; unbilled: number; billed: number; total: number }[] = [];
  statusLegendsList: ChartLegend[] = [];

  profitItemsList: ChartSeriesItem[] = [];
  statusItemsList: ChartSeriesItem[] = [];
  readonly chartLabelFont = { weight: 600, size: 16 };

  private profitGeneratedSubj = new Subject<void>();
  private statusGeneratedSubj = new Subject<void>();

  private profitChart: DxChartComponent;
  private statusChart: DxChartComponent;
  private destroy$ = new Subject<void>();
  private resizeEvent = new Subject<void>();

  constructor(
    @Inject(LOCALE_ID) private localeId: string,
    private cd: ChangeDetectorRef,
    private salesOrdersService: SalesOrdersService,
    private spinnerService: SpinnerHelperService
  ) {}

  ngOnInit() {
    this.handleWindowResize();

    zip(this.profitGeneratedSubj.asObservable(), this.statusGeneratedSubj.asObservable())
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.cd.detectChanges();
      });

    this.resizeEvent
      .asObservable()
      .pipe(debounceTime(50), takeUntil(this.destroy$))
      .subscribe(() => {
        this.visibleCharts = true;
        this.cd.markForCheck();
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnChanges({ items }: SimpleChanges) {
    if (items && items.currentValue?.length) {
      this.calculateProfitTotals();
      this.profitLegendsList = this.salesOrdersService.generateProfitLegendsList(this.profitChart, this.profitData);
      this.calculateStatusTotals();
      this.statusLegendsList = this.salesOrdersService.generateStatusLegendsList(this.statusChart, this.statusData);
      this.visibleCharts = true;
    } else {
      this.visibleCharts = false;
    }
  }

  get getProfitData() {
    const { name, expense, profit, revenue } = this.profitData[0];
    return [
      {
        name,
        expense,
        profit: Math.abs(profit),
        revenue
      }
    ];
  }

  customizeLabel = point => point.percentText;

  profitValueAxisTitle = () => `$${Utils.abbreviateNumber(this.profitData[0].revenue)}`;

  statusValueAxisTitle = () => `$${Utils.abbreviateNumber(this.statusData[0].total)}`;

  customizeStackedBarLabelText = item => {
    if (item?.value) {
      const text = `$${Utils.abbreviateNumber(item.value)}`;
      if (item.seriesName === 'Profit/(Loss)' && this?.profitData[0]?.profit < 0) {
        return `(${text})`;
      }
      return text;
    }
    return null;
  };

  getAxisColor = (list: ChartSeriesItem[], valueField: string) =>
    list.find(item => item.valueField === valueField)?.color;

  legendValue = value => formatCurrency(Math.abs(value), this.localeId, '$');

  onClose() {
    this.closed.emit();
  }

  customizeStackedBarTooltip = arg => {
    let value = formatCurrency(arg.originalValue, this.localeId, '$');
    if (arg.seriesName === 'Profit/(Loss)' && this?.profitData[0]?.profit < 0) {
      value = `(${value})`;
    }

    return { text: `<b>${arg.seriesName}:</b> ${value}` };
  };

  onExportChart() {
    this.spinnerService.setStatus(true);
    const element = document.getElementById('charts-container');
    const body = document.querySelector('body');
    body.classList.add('print');
    const width = element.clientWidth;
    const options = {
      filename: 'sales-order-charts.jpeg',
      html2canvas: { scale: 1, width, useCORS: true, logging: false },
      jsPDF: { orientation: 'landscape' }
    };

    html2pdf()
      .set(options)
      .from(element)
      .outputImg('dataurlstring')
      .then(data => {
        saveAs(data, 'sales-orders-charts.jpeg');
        body.classList.remove('print');
        this.spinnerService.setStatus(false);
      });
  }

  private calculateProfitTotals() {
    const expenseTotal = this.items.reduce((acc, curr) => acc + curr.expense, 0);
    const profitTotal = this.items.reduce((acc, curr) => acc + curr.profit, 0);
    const revenueTotal = this.items.reduce((acc, curr) => acc + curr.revenue, 0);

    this.profitData = [
      {
        name: 'profit_expense',
        revenue: revenueTotal,
        expense: expenseTotal,
        profit: profitTotal
      }
    ];
  }

  private calculateStatusTotals() {
    const unbilledTotal = this.items.reduce((acc, curr) => acc + curr.unbilled, 0);
    const billedTotal = this.items.reduce((acc, curr) => acc + curr.billed, 0);

    this.statusData = [
      {
        name: 'Status',
        unbilled: unbilledTotal,
        billed: billedTotal,
        total: unbilledTotal + billedTotal
      }
    ];
  }

  private handleWindowResize() {
    fromEvent(window, 'resize')
      .pipe(debounceTime(300), takeUntil(this.destroy$))
      .subscribe(() => {
        this.visibleCharts = false;
        this.resizeEvent.next();
        this.cd.markForCheck();
      });
  }
}
