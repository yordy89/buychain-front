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
import { ButtonModule } from '@components/common/buttons/button/button.module';
import { CopyTextButtonModule } from '@components/common/buttons/copy-text-button/copy-text-button.module';
import { TableActionsModule } from '@components/common/table-actions/table-actions.module';
import { TableResultsTextModule } from '@components/common/table-results-text/table-results-text.module';
import { AutocompleteModule } from '@directives/autocomplete/autocomplete.module';
import { NullOnEmptyModule } from '@directives/null-on-empty/null-on-empty.module';
import { PipesModule } from '@pipes/pipes.module';
import { BookmarkModule } from '@views/main/common/bookmark/bookmark.module';
import { FilterExpanderModule } from '@views/main/common/filter-expander/filter-expander.moudle';
import { FilterGridLayoutModule } from '@views/main/common/filter-grid-layout/filter-grid-layout.module';
import { DxDataGridModule, DxTabPanelModule, DxTemplateHost } from 'devextreme-angular';
import {
  BillsRoutingModule,
  routedComponents
} from '@views/main/accounting/accounts-payable/bills/bills-routing.module';
import { BillsFiltersComponent } from '@views/main/accounting/accounts-payable/bills/components/bills-filters/bills-filters.component';
import { BillComponent } from '@views/main/accounting/accounts-payable/bills/bill/bill.component';
import { ViewBillComponent } from '@views/main/accounting/accounts-payable/bills/components/view-bill/view-bill.component';
import { AddEditBillComponent } from '@views/main/accounting/accounts-payable/bills/components/add-edit-bill/add-edit-bill.component';
import { TreeSelectorModule } from '@components/common/inputs/tree-selector/tree-selector.module';
import { BillLineComponent } from '@views/main/accounting/accounts-payable/bills/bill-line/bill-line.component';
import { AddEditBillLineComponent } from '@views/main/accounting/accounts-payable/bills/components/add-edit-bill-line/add-edit-bill-line.component';
import { BillLineItemsGridComponent } from '@views/main/accounting/accounts-payable/bills/components/bill-line-items-grid/bill-line-items-grid.component';
import { AddLineFromPurchaseOrderModalComponent } from '@views/main/accounting/accounts-payable/bills/components/add-line-from-purchase-order-modal/add-line-from-purchase-order-modal.component';
import { ModalBaseModule } from '@components/common/modals/modal-base/modal-base.module';
import { APLineItemFormModule } from '@views/main/accounting/accounts-payable/components/ap-line-item-form/ap-line-item-form.module';
import { AddEditBillPaymentComponent } from '@views/main/accounting/accounts-payable/bills/components/add-edit-bill-payment/add-edit-bill-payment.component';
import { NgxCurrencyModule } from 'ngx-currency';
import { BillPaymentComponent } from '@views/main/accounting/accounts-payable/bills/bill-payment/bill-payment.component';
import { BillPaymentsGridComponent } from '@views/main/accounting/accounts-payable/bills/components/bill-payments-grid/bill-payments-grid.component';
import { AccountingFileUploadModule } from '@views/main/accounting/components/accounting-file-upload/accounting-file-upload.module';
import { AccountingMilestonesModule } from '@views/main/accounting/components/accounting-milestones/accounting-milestones.module';

@NgModule({
  imports: [
    BillsRoutingModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    FilterGridLayoutModule,
    BookmarkModule,
    FilterExpanderModule,
    MatCheckboxModule,
    PipesModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    ButtonModule,
    MatTooltipModule,
    DxDataGridModule,
    CopyTextButtonModule,
    TableResultsTextModule,
    TableActionsModule,
    MatCardModule,
    DxTabPanelModule,
    AutocompleteModule,
    MatSelectModule,
    NullOnEmptyModule,
    TreeSelectorModule,
    ModalBaseModule,
    APLineItemFormModule,
    NgxCurrencyModule,
    AccountingFileUploadModule,
    AccountingMilestonesModule
  ],
  exports: [],
  declarations: [
    ...routedComponents,
    BillsFiltersComponent,
    BillComponent,
    ViewBillComponent,
    AddEditBillComponent,
    BillLineComponent,
    AddEditBillLineComponent,
    BillLineItemsGridComponent,
    AddLineFromPurchaseOrderModalComponent,
    AddEditBillPaymentComponent,
    BillPaymentComponent,
    BillPaymentsGridComponent
  ],
  providers: [DxTemplateHost]
})
export class BillsModule {}
