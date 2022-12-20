import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { TransactionAggregated } from '@services/app-layer/entities/transaction';
import { DashboardStateService, DataSourceEnum } from '@views/main/dashboard/dashboard-state.service';
import { DefaultDashboardHelperService } from '@views/main/dashboard/dashboards/default-dashboard/default-dashboard-helper.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-default-dashboard',
  templateUrl: './default-dashboard.component.html',
  styleUrls: ['./default-dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DefaultDashboardComponent implements OnInit, OnDestroy {
  dataSource: DataSourceEnum;
  productGroups = [
    { name: 'Lumber', color: '#3fb0e8' },
    { name: 'Panel', color: '#ffaf1a' },
    { name: 'Engineered', color: '#8bbd75' }
  ];
  selectedDateRange = 'lastWeek';
  layers = [];
  markers = {};
  defaultDashboardData: TransactionAggregated[];

  private destroy$ = new Subject<void>();

  constructor(
    private defaultDashboardHelperService: DefaultDashboardHelperService,
    private dashboardStateService: DashboardStateService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.layers = this.defaultDashboardHelperService.getLayers();

    this.dashboardStateService.dataSource$.pipe(takeUntil(this.destroy$)).subscribe(data => {
      this.dataSource = data;
      this.loadDefaultDashboardData();
      this.cd.markForCheck();
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onRangeChange() {
    this.onLoadFreshData();
  }

  get lastUpdatedTimeString(): string {
    return this.defaultDashboardHelperService.lastUpdatedTimeDiffString();
  }

  get isSelectedRealData() {
    return this.dataSource === DataSourceEnum.REAL;
  }

  onLoadFreshData(): void {
    this.defaultDashboardHelperService.resetCache();
    this.loadDefaultDashboardData();
  }

  private loadDefaultDashboardData(): void {
    this.defaultDashboardHelperService
      .getDefaultDashboardData(this.dataSource, this.selectedDateRange, null)
      .pipe(takeUntil(this.destroy$))
      .subscribe(dashboardData => {
        this.defaultDashboardData = dashboardData;
        const markers = this.defaultDashboardHelperService.mapToMarkers(this.defaultDashboardData);
        this.markers = {
          type: 'FeatureCollection',
          features: markers
        };
        this.cd.markForCheck();
      });
  }

  customizeBubbles = arg => this.defaultDashboardHelperService.customizeBubbles(arg, this.productGroups);
  customizeText = arg => this.defaultDashboardHelperService.customizeText(arg, this.defaultDashboardData);

  /*
   *  dx map view helpers
   * */

  get mapWidth() {
    const padding = 2 * 100;
    return Math.min(window.innerWidth - padding, 1000);
  }

  get selectedCountryView(): string {
    return this.layers
      .filter(x => x.isVisible)
      .map(x => x.country)
      .toString();
  }
  set selectedCountryView(value: string) {
    if (value) this.layers.forEach(x => (x.isVisible = value.includes(x.country)));
  }

  get zoomFactor() {
    const visibleCountryViews = this.layers.filter(x => x.isVisible);
    return visibleCountryViews.length ? visibleCountryViews[visibleCountryViews.length - 1].zoomFactor : 1;
  }

  get bubbleSizeMin() {
    const visibleCountryViews = this.layers.filter(x => x.isVisible);
    return visibleCountryViews.length ? visibleCountryViews[visibleCountryViews.length - 1].bubbleSizeMin : 1;
  }

  get bubbleSizeMax() {
    const visibleCountryViews = this.layers.filter(x => x.isVisible);
    return visibleCountryViews.length ? visibleCountryViews[visibleCountryViews.length - 1].bubbleSizeMax : 1;
  }

  get center() {
    const visibleCountryViews = this.layers.filter(x => x.isVisible);
    return visibleCountryViews.length ? visibleCountryViews[visibleCountryViews.length - 1].center : [0, 0];
  }
}
