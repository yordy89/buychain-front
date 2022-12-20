import {
  Component,
  OnInit,
  Input,
  ViewChild,
  ElementRef,
  OnDestroy,
  ChangeDetectorRef,
  Output,
  EventEmitter
} from '@angular/core';
import { DataSourceEnum } from '@views/main/dashboard/dashboard-state.service';
import { fromEvent, Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-orders-by-day',
  templateUrl: './orders-by-day.component.html',
  styleUrls: ['./orders-by-day.component.scss']
})
export class OrdersByDayComponent implements OnInit, OnDestroy {
  @ViewChild('chartContainer') chartContainer: ElementRef;
  private _dashboardData: any[];
  @Input() public get dashboardData() {
    return this._dashboardData;
  }
  set dashboardData(value) {
    this._dashboardData = value;
    if (value) this.normalizeManagersDataForChart();
  }
  @Input() dateRange: string;
  @Input() dataSource: DataSourceEnum;
  @Output() dateRangeChange = new EventEmitter<string>();

  selectedDateRange: string;

  public chartWidth = 0;

  public data = [];
  public avgOrdersPerDay = 0;
  public avgLabel = {
    visible: true,
    text: '',
    position: 'outside',
    horizontalAlignment: 'right',
    font: { size: 22 }
  };

  public todaysOrdersCount: number;
  public quotesCount: number;
  public salesCount: number;

  private destroy$ = new Subject<void>();

  constructor(private cd: ChangeDetectorRef) {}

  ngOnInit() {
    this.selectedDateRange = this.dateRange;
    this.handleWindowResize();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get isSelectedRealData() {
    return this.dataSource === DataSourceEnum.REAL;
  }

  onRangeChange(value) {
    this.selectedDateRange = value;
    this.dateRangeChange.emit(value);
  }

  private handleWindowResize() {
    fromEvent(window, 'resize')
      .pipe(debounceTime(300), takeUntil(this.destroy$))
      .subscribe(() => {
        this.calcChartWidth();
        this.cd.markForCheck();
      });
  }

  private normalizeManagersDataForChart(): void {
    this.quotesCount = 0;
    this.salesCount = 0;
    this.data = this.dashboardData.map(item => {
      this.quotesCount += item.quoteTxs.length;
      this.salesCount += item.confirmedTxs.length;
      return { date: item.date, quoteCount: item.quoteTxs.length, confirmedCount: item.confirmedTxs.length };
    });
    this.data.shift();

    this.avgOrdersPerDay = Math.round((this.salesCount / this.data.length) * 100) / 100;
    this.avgLabel.text = `Average - ${this.avgOrdersPerDay}`;

    this.todaysOrdersCount = this.data[this.data.length - 1].confirmedCount;

    this.calcChartWidth();
  }

  customizeArgumentAxisText(e) {
    return new Date(e.value).getDate();
  }

  calcChartWidth() {
    if (!this.chartContainer) this.chartWidth = 0;
    const container = this.chartContainer?.nativeElement;
    this.chartWidth = container?.offsetWidth - 2 * 30; // container width - paddings
  }
}
