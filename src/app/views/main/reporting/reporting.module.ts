import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ImageUploadModule } from '@directives/image-upload/image-upload.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PipesModule } from '@pipes/pipes.module';
import { ReportingComponent } from '@views/main/reporting/reporting.component';
import { reportingRoutes } from '@views/main/reporting/reporting.routing';
import { MatTabsModule } from '@angular/material/tabs';
import {
  DxChartModule,
  DxDataGridModule,
  DxFilterBuilderModule,
  DxRangeSelectorModule,
  DxSelectBoxModule,
  DxTagBoxModule
} from 'devextreme-angular';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { InventoryPerformanceComponent } from './inventory-performance/inventory-performance.component';
import { InventoryAuditComponent } from './inventory-audit/inventory-audit.component';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SalesPerformanceComponent } from '@views/main/reporting/sales-performance/sales-performance.component';
import { MyReportsComponent } from './my-reports/my-reports.component';
import { MatMenuModule } from '@angular/material/menu';
import { BookmarkModule } from '@views/main/common/bookmark/bookmark.module';
import { EditProductLotModalModule } from '@views/main/common/modals/edit-product-lot-modal/edit-product-lot-modal.module';
import { ButtonModule } from '@components/common/buttons/button/button.module';
import { MatNativeDateModule } from '@angular/material/core';

@NgModule({
  imports: [
    CommonModule,
    ImageUploadModule,
    FormsModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    MatSelectModule,
    MatDatepickerModule,
    MatIconModule,
    DxChartModule,
    DxRangeSelectorModule,
    DxSelectBoxModule,
    DxDataGridModule,
    DxTagBoxModule,
    DxFilterBuilderModule,
    MatTabsModule,
    MatMenuModule,
    MatTooltipModule,
    RouterModule.forChild(reportingRoutes),
    PipesModule,
    MatInputModule,
    BookmarkModule,
    EditProductLotModalModule,
    ButtonModule,
    MatNativeDateModule
  ],
  declarations: [
    ReportingComponent,
    SalesPerformanceComponent,
    InventoryPerformanceComponent,
    InventoryAuditComponent,
    MyReportsComponent
  ]
})
export class ReportingModule {}
