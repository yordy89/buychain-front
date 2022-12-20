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
import { SelectWithSearchModule } from '@components/common/inputs/select-with-search/select-with-search.module';
import { TreeSelectorModule } from '@components/common/inputs/tree-selector/tree-selector.module';
import { TableActionsModule } from '@components/common/table-actions/table-actions.module';
import { TableResultsTextModule } from '@components/common/table-results-text/table-results-text.module';
import { AutocompleteModule } from '@directives/autocomplete/autocomplete.module';
import { NullOnEmptyModule } from '@directives/null-on-empty/null-on-empty.module';
import { PipesModule } from '@pipes/pipes.module';
import { BookmarkModule } from '@views/main/common/bookmark/bookmark.module';
import { FilterExpanderModule } from '@views/main/common/filter-expander/filter-expander.moudle';
import { FilterGridLayoutModule } from '@views/main/common/filter-grid-layout/filter-grid-layout.module';
import {
  DxChartModule,
  DxDataGridModule,
  DxPieChartModule,
  DxTabPanelModule,
  DxTemplateHost,
  DxTemplateModule
} from 'devextreme-angular';
import {
  InvoicesRoutingModule,
  routedComponents
} from '@views/main/accounting/accounts-receivable/invoices/invoices-routing.module';
import { InvoiceTableChartComponent } from '@views/main/accounting/accounts-receivable/invoices/components/invoce-table-chart/invoice-table-chart.component';
import { InvoicesFiltersComponent } from '@views/main/accounting/accounts-receivable/invoices/components/invoices-filters/invoices-filters.component';
import { InvoiceComponent } from '@views/main/accounting/accounts-receivable/invoices/invoice/invoice.component';
import { AddEditInvoiceComponent } from '@views/main/accounting/accounts-receivable/invoices/components/add-edit-invoice/add-edit-invoice.component';
import { ViewInvoiceComponent } from '@views/main/accounting/accounts-receivable/invoices/components/view-invoice/view-invoice.component';
import { AltBillToModalComponent } from '@views/main/accounting/accounts-receivable/invoices/components/alt-bill-to-modal/alt-bill-to-modal.component';
import { ModalBaseModule } from '@components/common/modals/modal-base/modal-base.module';
import { FacilityFormModule } from '@components/common/forms/facility-details/facility-form-module';
import { AddEditInvoiceLineComponent } from '@views/main/accounting/accounts-receivable/invoices/components/add-edit-invoice-line/add-edit-invoice-line.component';
import { InvoiceLineComponent } from '@views/main/accounting/accounts-receivable/invoices/invoice-line/invoice-line.component';
import { AddLineFromSalesOrderModalComponent } from '@views/main/accounting/accounts-receivable/invoices/components/add-line-from-sales-order-modal/add-line-from-sales-order-modal.component';
import { ARLineItemFormModule } from '@views/main/accounting/accounts-receivable/components/ar-line-item-form/ar-line-item-form.module';
import { AddEditInvoicePaymentComponent } from '@views/main/accounting/accounts-receivable/invoices/components/add-edit-invoice-payment/add-edit-invoice-payment.component';
import { InvoicePaymentComponent } from '@views/main/accounting/accounts-receivable/invoices/invoice-payment/invoice-payment.component';
import { NgxCurrencyModule } from 'ngx-currency';
import { InvoicePaymentsGridComponent } from '@views/main/accounting/accounts-receivable/invoices/components/invoice-payments-grid/invoice-payments-grid.component';
import { InvoiceLineItemsGridComponent } from '@views/main/accounting/accounts-receivable/invoices/components/invoice-line-items-grid/invoice-line-items-grid.component';
import { AccountingFileUploadModule } from '@views/main/accounting/components/accounting-file-upload/accounting-file-upload.module';
import { MatDividerModule } from '@angular/material/divider';
import { OpenLineItemsGridComponent } from '@views/main/accounting/accounts-receivable/invoices/components/open-line-items-grid/open-line-items-grid.component';
import { AddEditOpenLineItemModalComponent } from '@views/main/accounting/accounts-receivable/invoices/components/add-edit-open-line-item-modal/add-edit-open-line-item-modal.component';
import { AddRejectNoteModalComponent } from '@views/main/accounting/accounts-receivable/invoices/components/add-rejected-note-modal/add-reject-note-modal.component';
import { InvoicePdfTemplateComponent } from '@views/main/accounting/accounts-receivable/invoices/invoice-pdf-template/invoice-pdf-template.component';
import { AddressComponent } from '@views/main/accounting/accounts-receivable/invoices/invoice-pdf-template/address/address.component';
import { AccountingMilestonesModule } from '@views/main/accounting/components/accounting-milestones/accounting-milestones.module';

@NgModule({
  imports: [
    CommonModule,
    InvoicesRoutingModule,
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
    DxTabPanelModule,
    ModalBaseModule,
    FacilityFormModule,
    ARLineItemFormModule,
    NgxCurrencyModule,
    DxTemplateModule,
    AccountingFileUploadModule,
    MatDividerModule,
    AccountingMilestonesModule
  ],
  exports: [],
  declarations: [
    ...routedComponents,
    InvoiceTableChartComponent,
    InvoicesFiltersComponent,
    InvoiceComponent,
    AddEditInvoiceComponent,
    ViewInvoiceComponent,
    AltBillToModalComponent,
    InvoiceLineComponent,
    AddEditInvoiceLineComponent,
    AddLineFromSalesOrderModalComponent,
    AddEditInvoicePaymentComponent,
    InvoicePaymentComponent,
    InvoicePaymentsGridComponent,
    InvoiceLineItemsGridComponent,
    OpenLineItemsGridComponent,
    AddEditOpenLineItemModalComponent,
    AddRejectNoteModalComponent,
    InvoicePdfTemplateComponent,
    AddressComponent
  ],
  providers: [DxTemplateHost]
})
export class InvoicesModule {}
