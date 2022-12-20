import { Routes } from '@angular/router';
import { InventoryAuditComponent } from '@views/main/reporting/inventory-audit/inventory-audit.component';
import { InventoryPerformanceComponent } from '@views/main/reporting/inventory-performance/inventory-performance.component';
import { MyReportsComponent } from '@views/main/reporting/my-reports/my-reports.component';
import { ReportingComponent } from '@views/main/reporting/reporting.component';
import { SalesPerformanceComponent } from '@views/main/reporting/sales-performance/sales-performance.component';

export const reportingRoutes: Routes = [
  {
    path: '',
    component: ReportingComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'my-reports' },
      {
        path: 'my-reports',
        component: MyReportsComponent
      },
      {
        path: 'sales-performance',
        component: SalesPerformanceComponent
      },
      {
        path: 'inventory-performance',
        component: InventoryPerformanceComponent
      },
      {
        path: 'inventory-audit',
        component: InventoryAuditComponent
      }
    ]
  }
];
