import { Routes } from '@angular/router';
import { DashboardComponent } from '@views/main/dashboard/dashboard.component';
import { DefaultDashboardComponent } from '@views/main/dashboard/dashboards/default-dashboard/default-dashboard.component';
import { ManagersDashboardComponent } from '@views/main/dashboard/dashboards/managers-dashboard/managers-dashboard.component';
import { TradersDashboardComponent } from '@views/main/dashboard/dashboards/traders-dashboard/traders-dashboard.component';

export const dashboardRoutes: Routes = [
  {
    path: '',
    component: DashboardComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'default' },
      {
        path: 'default',
        component: DefaultDashboardComponent,
        data: { title: 'Default Dashboard' }
      },
      {
        path: 'managers',
        component: ManagersDashboardComponent,
        data: { title: 'Managers Dashboard' }
      },
      {
        path: 'traders',
        component: TradersDashboardComponent,
        data: { title: 'Traders Dashboard' }
      }
    ]
  }
];
