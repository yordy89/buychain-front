import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Environment } from '@services/app-layer/app-layer.environment';
import { TransactionEntity } from '@services/app-layer/entities/transaction';
import { NavigationHelperService } from '@services/helpers/navigation-helper/navigation-helper.service';
import { DashboardStateService, DataSourceEnum } from '@views/main/dashboard/dashboard-state.service';
import {
  ManagersDashboardHelperService,
  ManagersMetrics
} from '@views/main/dashboard/dashboards/managers-dashboard/managers-dashboard-helper.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-managers-dashboard',
  templateUrl: './managers-dashboard.component.html',
  styleUrls: ['./managers-dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ManagersDashboardComponent implements OnInit, OnDestroy {
  dataSource: DataSourceEnum;
  managersDashboardData: { date: Date; quoteTxs: TransactionEntity[]; confirmedTxs: TransactionEntity[] }[];
  managersTransactions: TransactionEntity[];
  metrics: ManagersMetrics;
  selectedDateRange = 'lastWeek';

  private destroy$ = new Subject<void>();

  constructor(
    private managersDashboardHelperService: ManagersDashboardHelperService,
    private dashboardStateService: DashboardStateService,
    private navigationHelperService: NavigationHelperService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (!Environment.getCurrentUser().permissions.priceData) {
      this.navigationHelperService.navigateUserHome();
    }

    this.metrics = this.managersDashboardHelperService.getDefaultMetrics();
    this.dashboardStateService.dataSource$.pipe(takeUntil(this.destroy$)).subscribe(data => {
      this.dataSource = data;
      this.loadManagersDashboardData();
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
    return this.managersDashboardHelperService.lastUpdatedTimeDiffString();
  }

  get isSelectedRealData() {
    return this.dataSource === DataSourceEnum.REAL;
  }

  onLoadFreshData(): void {
    this.managersDashboardHelperService.resetCache();
    this.loadManagersDashboardData();
  }

  private loadManagersDashboardData(): void {
    this.managersDashboardHelperService
      .getManagersDashboardData(this.dataSource)
      .pipe(takeUntil(this.destroy$))
      .subscribe(dashboardData => {
        this.managersTransactions = dashboardData;
        this.managersDashboardData = this.managersDashboardHelperService.normalizeManagerTxsData(
          this.selectedDateRange,
          dashboardData
        );
        this.metrics = this.managersDashboardHelperService.calculateMetrics(this.managersDashboardData);
        this.cd.markForCheck();
      });
  }
}
