import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { ButtonModule } from '@components/common/buttons/button/button.module';
import { CopyTextButtonModule } from '@components/common/buttons/copy-text-button/copy-text-button.module';
import { SelectWithSearchModule } from '@components/common/inputs/select-with-search/select-with-search.module';
import { TreeSelectorModule } from '@components/common/inputs/tree-selector/tree-selector.module';
import { TableActionsModule } from '@components/common/table-actions/table-actions.module';
import { TableResultsTextModule } from '@components/common/table-results-text/table-results-text.module';
import { AutocompleteModule } from '@directives/autocomplete/autocomplete.module';
import { NullOnEmptyModule } from '@directives/null-on-empty/null-on-empty.module';
import { PipesModule } from '@pipes/pipes.module';
import { SalesOrderTableChartComponent } from '@views/main/accounting/accounts-receivable/sales-orders/components/sales-order-table-chart/sales-order-table-chart.component';
import { SalesOrdersFiltersComponent } from '@views/main/accounting/accounts-receivable/sales-orders/components/sales-orders-filters/sales-orders-filters.component';
import { ViewSalesOrderComponent } from '@views/main/accounting/accounts-receivable/sales-orders/components/view-sales-order/view-sales-order.component';
import {
  SalesOrdersRoutingModule,
  routedComponents
} from '@views/main/accounting/accounts-receivable/sales-orders/sales-orders-routing.module';
import { BookmarkModule } from '@views/main/common/bookmark/bookmark.module';
import { FilterExpanderModule } from '@views/main/common/filter-expander/filter-expander.moudle';
import { FilterGridLayoutModule } from '@views/main/common/filter-grid-layout/filter-grid-layout.module';
import { DxChartModule, DxDataGridModule, DxPieChartModule } from 'devextreme-angular';
import { AddEditSalesOrderComponent } from '@views/main/accounting/accounts-receivable/sales-orders/components/add-edit-sales-order/add-edit-sales-order.component';
import { ChipListInputModule } from '@components/common/inputs/chip-list-input/chip-list-input.module';
import { TableBaseModule } from '@components/common/table-base/table-base.module';
import { NgxCurrencyModule } from 'ngx-currency';
import { AddEditSalesOrderLineComponent } from '@views/main/accounting/accounts-receivable/sales-orders/components/add-edit-sales-order-line/add-edit-sales-order-line.component';
import { InvoicesModule } from '@views/main/accounting/accounts-receivable/invoices/invoices.module';
import { ARLineItemFormModule } from '@views/main/accounting/accounts-receivable/components/ar-line-item-form/ar-line-item-form.module';
import { SalesOrderLineItemsGridComponent } from '@views/main/accounting/accounts-receivable/sales-orders/components/sales-order-line-items-grid/sales-order-line-items-grid.component';
import { SalesOrderInvoicesGridComponent } from '@views/main/accounting/accounts-receivable/sales-orders/components/sales-order-invoices-grid/sales-order-invoices-grid.component';
import { AccountingFileUploadModule } from '@views/main/accounting/components/accounting-file-upload/accounting-file-upload.module';

@NgModule({
  imports: [
    CommonModule,
    SalesOrdersRoutingModule,
    FilterGridLayoutModule,
    BookmarkModule,
    ButtonModule,
    DxDataGridModule,
    TableResultsTextModule,
    CopyTextButtonModule,
    PipesModule,
    MatTooltipModule,
    TableActionsModule,
    DxPieChartModule,
    MatButtonModule,
    MatIconModule,
    DxChartModule,
    MatCardModule,
    FilterExpanderModule,
    MatCheckboxModule,
    FormsModule,
    SelectWithSearchModule,
    TreeSelectorModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatInputModule,
    ReactiveFormsModule,
    MatSelectModule,
    AutocompleteModule,
    NullOnEmptyModule,
    MatDividerModule,
    ChipListInputModule,
    TableBaseModule,
    NgxCurrencyModule,
    InvoicesModule,
    ARLineItemFormModule,
    AccountingFileUploadModule
  ],
  exports: [],
  declarations: [
    ...routedComponents,
    SalesOrderTableChartComponent,
    ViewSalesOrderComponent,
    SalesOrdersFiltersComponent,
    AddEditSalesOrderComponent,
    AddEditSalesOrderLineComponent,
    SalesOrderLineItemsGridComponent,
    SalesOrderInvoicesGridComponent
  ],
  providers: []
})
export class SalesOrdersModule {}
