import { NgModule } from '@angular/core';
import {
  PurchaseOrdersRoutingModule,
  routedComponents
} from '@views/main/accounting/accounts-payable/purchase-orders/purchase-orders-routing.module';
import { PurchaseOrdersFiltersComponent } from '@views/main/accounting/accounts-payable/purchase-orders/component/purchase-orders-filters/purchase-orders-filters.component';
import { FilterGridLayoutModule } from '@views/main/common/filter-grid-layout/filter-grid-layout.module';
import { BookmarkModule } from '@views/main/common/bookmark/bookmark.module';
import { ButtonModule } from '@components/common/buttons/button/button.module';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DxDataGridModule } from 'devextreme-angular';
import { TableResultsTextModule } from '@components/common/table-results-text/table-results-text.module';
import { CopyTextButtonModule } from '@components/common/buttons/copy-text-button/copy-text-button.module';
import { CommonModule } from '@angular/common';
import { PipesModule } from '@pipes/pipes.module';
import { TableActionsModule } from '@components/common/table-actions/table-actions.module';
import { FilterExpanderModule } from '@views/main/common/filter-expander/filter-expander.moudle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SelectWithSearchModule } from '@components/common/inputs/select-with-search/select-with-search.module';
import { TreeSelectorModule } from '@components/common/inputs/tree-selector/tree-selector.module';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { AddEditPurchaseOrderComponent } from '@views/main/accounting/accounts-payable/purchase-orders/component/add-edit-purchase-order/add-edit-purchase-order.component';
import { TableBaseModule } from '@components/common/table-base/table-base.module';
import { MatSelectModule } from '@angular/material/select';
import { NullOnEmptyModule } from '@directives/null-on-empty/null-on-empty.module';
import { MatCardModule } from '@angular/material/card';
import { ViewPurchaseOrderComponent } from '@views/main/accounting/accounts-payable/purchase-orders/component/view-purchase-order/view-purchase-order.component';
import { PurchaseOrderLineItemsGridComponent } from '@views/main/accounting/accounts-payable/purchase-orders/component/purchase-order-line-items-grid/purchase-order-line-items-grid.component';
import { AddEditPurchaseOrderLineComponent } from '@views/main/accounting/accounts-payable/purchase-orders/component/add-edit-purchase-order-line/add-edit-purchase-order-line.component';
import { PurchaseOrderLineComponent } from '@views/main/accounting/accounts-payable/purchase-orders/purchase-order-line/purchase-order-line.component';
import { APLineItemFormModule } from '@views/main/accounting/accounts-payable/components/ap-line-item-form/ap-line-item-form.module';
import { PurchaseOrderBillsGridComponent } from '@views/main/accounting/accounts-payable/purchase-orders/component/purchase-order-bills-grid/purchase-order-bills-grid.component';
import { BillsModule } from '@views/main/accounting/accounts-payable/bills/bills.module';
import { AccountingFileUploadModule } from '@views/main/accounting/components/accounting-file-upload/accounting-file-upload.module';

@NgModule({
  imports: [
    PurchaseOrdersRoutingModule,
    FilterGridLayoutModule,
    BookmarkModule,
    ButtonModule,
    MatTooltipModule,
    DxDataGridModule,
    TableResultsTextModule,
    CopyTextButtonModule,
    CommonModule,
    PipesModule,
    TableActionsModule,
    FilterExpanderModule,
    MatCheckboxModule,
    FormsModule,
    SelectWithSearchModule,
    TreeSelectorModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    TableBaseModule,
    ReactiveFormsModule,
    MatSelectModule,
    NullOnEmptyModule,
    MatCardModule,
    APLineItemFormModule,
    BillsModule,
    APLineItemFormModule,
    AccountingFileUploadModule
  ],
  exports: [],
  declarations: [
    ...routedComponents,
    PurchaseOrdersFiltersComponent,
    AddEditPurchaseOrderComponent,
    ViewPurchaseOrderComponent,
    PurchaseOrderLineItemsGridComponent,
    AddEditPurchaseOrderLineComponent,
    PurchaseOrderLineComponent,
    PurchaseOrderBillsGridComponent
  ],
  providers: []
})
export class PurchaseOrdersModule {}
