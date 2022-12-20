import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { MatButtonToggleChange } from '@angular/material/button-toggle';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { AccessControlProfile } from '@app/services/app-layer/permission/permission.interface';
import { Environment } from '@services/app-layer/app-layer.environment';
import { DashboardStateService, DataSourceEnum } from '@views/main/dashboard/dashboard-state.service';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit, OnDestroy {
  dataSource: DataSourceEnum;

  readonly dataSourceEnum = DataSourceEnum;
  readonly isProduction = Environment.isProduction;
  readonly isTrader = Environment.getCurrentUser().accessControlProfile === AccessControlProfile.Trader;

  title = '';

  private destroy$ = new Subject<void>();

  constructor(
    private dashboardStateService: DashboardStateService,
    private route: ActivatedRoute,
    private cd: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit() {
    this.initTitle();

    this.dashboardStateService.dataSource$.pipe(takeUntil(this.destroy$)).subscribe(data => {
      this.dataSource = data;
      this.cd.markForCheck();
    });

    this.router.events
      .pipe(
        filter(e => e instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.initTitle();
        this.cd.markForCheck();
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onChangeSource(event: MatButtonToggleChange) {
    this.dashboardStateService.setDataSource(event.value);
  }

  private initTitle() {
    this.title = this.route.snapshot.firstChild.data?.title;
  }
}
