import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Environment } from '@services/app-layer/app-layer.environment';
import { TransactionEntity } from '@services/app-layer/entities/transaction';
import { NavigationHelperService } from '@services/helpers/navigation-helper/navigation-helper.service';
import { DashboardStateService, DataSourceEnum } from '@views/main/dashboard/dashboard-state.service';
import {
  TradersDashboardHelperService,
  TradersMetrics
} from '@views/main/dashboard/dashboards/traders-dashboard/traders-dashboard-helper.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-traders-dashboard',
  templateUrl: './traders-dashboard.component.html',
  styleUrls: ['./traders-dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TradersDashboardComponent implements OnInit, OnDestroy {
  dataSource: DataSourceEnum;
  tradersDashboardData: { date: Date; quoteTxs: TransactionEntity[]; confirmedTxs: TransactionEntity[] }[];
  tradersTransactions: TransactionEntity[];
  metrics: TradersMetrics;
  selectedDateRange = 'lastWeek';

  private destroy$ = new Subject<void>();

  constructor(
    private tradersDashboardHelperService: TradersDashboardHelperService,
    private dashboardStateService: DashboardStateService,
    private navigationHelperService: NavigationHelperService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (!Environment.getCurrentUser().permissions.priceData) {
      this.navigationHelperService.navigateUserHome();
    }

    this.metrics = this.tradersDashboardHelperService.getDefaultMetrics();
    this.dashboardStateService.dataSource$.pipe(takeUntil(this.destroy$)).subscribe(data => {
      this.dataSource = data;
      this.loadTradersDashboardData();
      this.cd.markForCheck();
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onDateRangeChange() {
    this.onLoadFreshData();
  }

  get lastUpdatedTimeString(): string {
    return this.tradersDashboardHelperService.lastUpdatedTimeDiffString();
  }

  get isSelectedRealData() {
    return this.dataSource === DataSourceEnum.REAL;
  }

  onLoadFreshData(): void {
    this.tradersDashboardHelperService.resetCache();
    this.loadTradersDashboardData();
  }

  private loadTradersDashboardData(): void {
    this.tradersDashboardHelperService
      .getTradersDashboardData(this.dataSource)
      .pipe(takeUntil(this.destroy$))
      .subscribe(dashboardData => {
        this.tradersTransactions = dashboardData;
        this.tradersDashboardData = this.tradersDashboardHelperService.normalizeManagerTxsData(
          this.selectedDateRange,
          dashboardData
        );
        this.metrics = this.tradersDashboardHelperService.calculateMetrics(this.tradersDashboardData);
        this.cd.markForCheck();
      });
  }
}
