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
import { ARInvoiceStateEnum } from '@services/app-layer/app-layer.enums';
import { ARInvoice, ARInvoiceAgeEnum } from '@services/app-layer/entities/accounts-receivable';
import { DxChartComponent, DxPieChartComponent } from 'devextreme-angular';
import { fromEvent, Subject, zip } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import * as html2pdf from 'html2pdf.js';
import { saveAs } from 'file-saver';
import { Utils } from '@services/helpers/utils/utils';
import {
  ChartSeriesItem,
  InvoiceTableChartService
} from '@views/main/accounting/accounts-receivable/invoices/components/invoce-table-chart/invoice-table-chart.service';
import { SpinnerHelperService } from '@services/helpers/spinner-helper/spinner-helper.service';

@Component({
  selector: 'app-invoice-table-chart',
  templateUrl: 'invoice-table-chart.component.html',
  styleUrls: ['./invoice-table-chart.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InvoiceTableChartComponent implements OnInit, OnChanges, OnDestroy {
  @Input() items: ARInvoice[] = [];
  @Output() closed = new EventEmitter<void>();

  @ViewChild('agingChart', { read: DxPieChartComponent }) set agingContent(chart) {
    if (this.agingChart) {
      return;
    }
    this.agingChart = chart;
    this.agingChartPalette = this.invoiceTableChartService.agingChartPalette;
    this.agingLegendsList = this.invoiceTableChartService.generateAgingLegendsList(chart, this.agingData);
    this.agingGeneratedSubj.next();
  }

  @ViewChild('statusChart', { read: DxChartComponent }) set statusContent(chart) {
    if (this.statusChart) {
      return;
    }
    this.statusChart = chart;
    this.statusLegendsList = this.invoiceTableChartService.generateStatusLegendsList(chart, this.statusData);
    this.statusGeneratedSubj.next();
  }

  visibleCharts = false;

  agingData: { key: string; total: number }[] = [];
  agingLegendsList: ChartLegend[] = [];
  agingTotal: number;
  agingChartPalette: Array<string> | string = 'Soft Pastel';

  statusData: { name: string; outstanding: number; settled: number; total: number }[] = [];
  statusLegendsList: ChartLegend[] = [];
  statusTotal: number;

  statusItemsList: ChartSeriesItem[] = this.invoiceTableChartService.statusItemsList;
  readonly ageEnumList = Object.values(ARInvoiceAgeEnum).map(value => ({ key: value, total: 0 }));
  readonly chartLabelFont = { weight: 600, size: 16 };

  private agingGeneratedSubj = new Subject<void>();
  private statusGeneratedSubj = new Subject<void>();

  private agingChart: DxPieChartComponent;
  private statusChart: DxChartComponent;
  private destroy$ = new Subject<void>();
  private resizeEvent = new Subject<void>();

  constructor(
    @Inject(LOCALE_ID) private localeId: string,
    private cd: ChangeDetectorRef,
    private invoiceTableChartService: InvoiceTableChartService,
    private spinnerService: SpinnerHelperService
  ) {}

  ngOnInit() {
    this.handleWindowResize();

    zip(this.agingGeneratedSubj.asObservable(), this.statusGeneratedSubj.asObservable())
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
      this.calculateAgingTotals();
      this.agingLegendsList = this.invoiceTableChartService.generateAgingLegendsList(this.agingChart, this.agingData);
      this.calculateStatusTotals();
      this.statusLegendsList = this.invoiceTableChartService.generateStatusLegendsList(
        this.statusChart,
        this.statusData
      );
      this.visibleCharts = true;
    } else {
      this.visibleCharts = false;
    }
  }

  customizeLabel = point => (point.percent ? point.percentText : null);

  statusValueAxisTitle = () => `$${Utils.abbreviateNumber(this.statusData[0].total || 0)}`;

  customizeStackedBarLabelText = ({ value }) => (value ? `$${Utils.abbreviateNumber(value)}` : null);

  getAxisColor = (list: ChartSeriesItem[], valueField: string) =>
    list.find(item => item.valueField === valueField)?.color;

  onClose() {
    this.closed.emit();
  }

  customizeAgingTooltip = arg => ({ text: `<b>${arg.argumentText}:</b> ${arg.percentText}` });

  customizeStackedBarTooltip = arg => ({
    text: `<b>${arg.seriesName}:</b> ` + formatCurrency(arg.originalValue, this.localeId, '$')
  });

  legendValue = value => formatCurrency(Math.abs(value), this.localeId, '$');

  onExportChart() {
    this.spinnerService.setStatus(true);
    const element = document.getElementById('charts-container');
    const body = document.querySelector('body');
    body.classList.add('print');
    const width = element.clientWidth;
    const options = {
      filename: 'invoices-charts.jpeg',
      html2canvas: { scale: 1, width, useCORS: true, logging: false },
      jsPDF: { orientation: 'landscape' }
    };

    html2pdf()
      .set(options)
      .from(element)
      .outputImg('dataurlstring')
      .then(data => {
        saveAs(data, 'invoices-charts.jpeg');
        body.classList.remove('print');
        this.spinnerService.setStatus(false);
      });
  }

  private calculateAgingTotals() {
    this.agingData = this.items.reduce((acc: any, item) => {
      if (item.state === ARInvoiceStateEnum.ISSUED) {
        const index = acc.findIndex(({ key }) => key === item.age);
        acc[index].total += item.total;
        acc.splice(index, 1, acc[index]);
        return acc;
      }
      return acc;
    }, this.ageEnumList);
  }

  get thereIsAgingData() {
    return !!this.agingData.reduce((acc, curr) => acc + curr.total, 0);
  }

  private calculateStatusTotals() {
    const outstandingTotal = this.items.reduce((acc, curr) => {
      const isVoidedOrClosed = curr.state === ARInvoiceStateEnum.VOIDED || curr.state === ARInvoiceStateEnum.CLOSED;
      if (isVoidedOrClosed) {
        return acc;
      }
      return acc + curr.receivableAmountSum;
    }, 0);

    const settledTotal = this.items.reduce((acc, curr) => {
      const isClosed = curr.state === ARInvoiceStateEnum.CLOSED;
      if (isClosed) {
        return acc + curr.receivableAmountSum;
      }
      return acc;
    }, 0);

    this.statusData = [
      {
        name: 'Status',
        outstanding: outstandingTotal,
        settled: settledTotal,
        total: outstandingTotal + settledTotal
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
