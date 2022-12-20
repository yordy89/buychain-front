import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Environment } from '@services/app-layer/app-layer.environment';
import { NavigationHelperService } from '@services/helpers/navigation-helper/navigation-helper.service';
import { ReportingService } from '@views/main/reporting/reporting.service';
import { SalesPerformanceComponent } from '@views/main/reporting/sales-performance/sales-performance.component';
import { InventoryPerformanceComponent } from '@views/main/reporting/inventory-performance/inventory-performance.component';
import { InventoryAuditComponent } from '@views/main/reporting/inventory-audit/inventory-audit.component';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-reporting',
  templateUrl: './reporting.component.html',
  styleUrls: ['./reporting.component.scss']
})
export class ReportingComponent implements OnInit, OnDestroy {
  @ViewChild('salesPerformance') salesPerformance: SalesPerformanceComponent;
  @ViewChild('inventoryPerformance') inventoryPerformance: InventoryPerformanceComponent;
  @ViewChild('inventoryAudit') inventoryAudit: InventoryAuditComponent;

  isLoaded = false;

  private destroy$ = new Subject<void>();

  constructor(private navigationHelperService: NavigationHelperService, private reportingService: ReportingService) {}

  ngOnInit() {
    if (
      !Environment.getCurrentCompany().features.advancedReporting ||
      !Environment.getCurrentUser().permissions.priceData
    ) {
      this.navigationHelperService.navigateUserHome();
    }

    this.reportingService
      .loadData()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.isLoaded = true;
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
