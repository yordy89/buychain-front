import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { RouterModule } from '@angular/router';
import { PipesModule } from '@app/pipes/pipes.module';
import { LetterLogoModule } from '@components/common/letter-logo/letter-logo/letter-logo.module';
import { ShowViewCostDirectiveModule } from '@directives/show/show-view-cost.directive';
import { DashboardComponent } from '@views/main/dashboard/dashboard.component';
import { dashboardRoutes } from '@views/main/dashboard/dashboard.routing';
import {
  DxVectorMapModule,
  DxCalendarModule,
  DxTemplateModule,
  DxChartModule,
  DxTreeMapModule,
  DxPieChartModule
} from 'devextreme-angular';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { QuicklinkModule } from 'ngx-quicklink';
import { OrdersByDayComponent } from './charts/orders-by-day/orders-by-day.component';
import { NumericIndicatorComponent } from './charts/numeric-indicator/numeric-indicator.component';
import { TreeChartComponent } from './charts/tree-chart/tree-chart.component';
import { OrdersByTypeComponent } from './charts/orders-by-type/orders-by-type.component';
import { TableChartComponent } from './charts/table-chart/table-chart.component';
import { LeaderboardComponent } from './charts/leaderboard/leaderboard.component';
import { TopCustomersComponent } from './charts/top-customers/top-customers.component';
import { LateOrdersComponent } from './charts/late-orders/late-orders.component';
import { CustomerMixComponent } from './charts/customer-mix/customer-mix.component';
import { OrdersByStateComponent } from './charts/orders-by-state/orders-by-state.component';
import { ShippingCalendarComponent } from './charts/shipping-calendar/shipping-calendar.component';
import { ChartContainerComponent } from './charts/chart-container/chart-container.component';
import { DefaultDashboardComponent } from './dashboards/default-dashboard/default-dashboard.component';
import { ManagersDashboardComponent } from './dashboards/managers-dashboard/managers-dashboard.component';
import { TradersDashboardComponent } from '@views/main/dashboard/dashboards/traders-dashboard/traders-dashboard.component';

@NgModule({
  imports: [
    CommonModule,
    PipesModule,
    RouterModule.forChild(dashboardRoutes),
    DxVectorMapModule,
    DxChartModule,
    DxPieChartModule,
    DxTreeMapModule,
    DxCalendarModule,
    DxTemplateModule,
    MatButtonToggleModule,
    MatIconModule,
    MatTabsModule,
    MatButtonModule,
    LetterLogoModule,
    ShowViewCostDirectiveModule,
    FormsModule,
    QuicklinkModule
  ],
  declarations: [
    DashboardComponent,
    OrdersByDayComponent,
    NumericIndicatorComponent,
    TreeChartComponent,
    OrdersByTypeComponent,
    TableChartComponent,
    LeaderboardComponent,
    TopCustomersComponent,
    LateOrdersComponent,
    CustomerMixComponent,
    OrdersByStateComponent,
    ShippingCalendarComponent,
    ChartContainerComponent,
    DefaultDashboardComponent,
    ManagersDashboardComponent,
    TradersDashboardComponent
  ],
  exports: [DefaultDashboardComponent]
})
export class DashboardModule {}
