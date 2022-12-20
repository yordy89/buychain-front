import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { RouterModule } from '@angular/router';
import { TableActionsModule } from '@components/common/table-actions/table-actions.module';
import { TableBaseModule } from '@components/common/table-base/table-base.module';
import { TableResultsTextModule } from '@components/common/table-results-text/table-results-text.module';
import { AutocompleteModule } from '@directives/autocomplete/autocomplete.module';
import { ShowViewCostDirectiveModule } from '@directives/show/show-view-cost.directive';
import { crmRoutes } from '@views/main/crm/crm.routing';
import { CrmComponent } from '@views/main/crm/crm/crm.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PipesModule } from '@pipes/pipes.module';
import { LabelsGroupComponent } from '@views/main/crm/crm/right-hand-side/common/labels-group/labels-group.component';
import { TabExpansionIconComponent } from '@views/main/crm/crm/right-hand-side/common/tab-expansion-icon/tab-expansion-icon.component';
import { AddCrmAccountModalComponent } from './crm/add-crm-account-modal/add-crm-account-modal.component';
import { CrmAccountSalesInfoComponent } from './crm/right-hand-side/crm-account/crm-account-sales-info/crm-account-sales-info.component';
import { CrmAccountCreditInfoComponent } from './crm/right-hand-side/crm-account/crm-account-credit-info/crm-account-credit-info.component';
import { CrmAccountComponent } from './crm/right-hand-side/crm-account/crm-account.component';
import { CrmAccountContactsComponent } from './crm/right-hand-side/crm-account/crm-account-contacts/crm-account-contacts.component';
import { CrmContactComponent } from './crm/right-hand-side/crm-contact/crm-contact.component';
import { RightHandSideComponent } from './crm/right-hand-side/right-hand-side.component';
import { CrmContactSalesInfoComponent } from './crm/right-hand-side/crm-contact/crm-contact-sales-info/crm-contact-sales-info.component';
import { CrmAccountLocationsComponent } from './crm/right-hand-side/crm-account/crm-account-locations/crm-account-locations.component';
import { CrmLocationComponent } from './crm/right-hand-side/crm-location/crm-location.component';
import { CrmLocationSalesInfoComponent } from './crm/right-hand-side/crm-location/crm-location-sales-info/crm-location-sales-info.component';
import { LinkedCrmAccountModalComponent } from './crm/right-hand-side/crm-account/linked-crm-account-modal/linked-crm-account-modal.component';
import { UnlinkedCrmAccountModalComponent } from './crm/right-hand-side/crm-account/unlinked-crm-account-modal/unlinked-crm-account-modal.component';
import { LinkedCrmContactModalComponent } from './crm/right-hand-side/crm-contact/linked-crm-contact-modal/linked-crm-contact-modal.component';
import { UnlinkedCrmContactModalComponent } from './crm/right-hand-side/crm-contact/unlinked-crm-contact-modal/unlinked-crm-contact-modal.component';
import { UnlinkedCrmLocationModalComponent } from './crm/right-hand-side/crm-location/unlinked-crm-location-modal/unlinked-crm-location-modal.component';
import { LinkedCrmLocationModalComponent } from './crm/right-hand-side/crm-location/linked-crm-location-modal/linked-crm-location-modal.component';
import { DxChartModule, DxDataGridModule, DxFunnelModule, DxPieChartModule } from 'devextreme-angular';
import { CrmAccountOrdersComponent } from './crm/right-hand-side/crm-account/crm-account-orders/crm-account-orders.component';
import { CrmAccountReportsComponent } from '@views/main/crm/crm/right-hand-side/crm-account/crm-account-reports/crm-account-reports.component';
import { SellerSummaryComponent } from '@views/main/crm/crm/right-hand-side/crm-account/crm-account-reports/seller-summary/seller-summary.component';
import { FYRevenueChartComponent } from '@views/main/crm/crm/right-hand-side/crm-account/crm-account-reports/fy-revenue-chart/fy-revenue-chart.component';
import { TraderRevenueChartComponent } from '@views/main/crm/crm/right-hand-side/crm-account/crm-account-reports/trader-revenue-chart/trader-revenue-chart.component';
import { TransactionStatePipelineComponent } from '@views/main/crm/crm/right-hand-side/crm-account/crm-account-reports/transaction-state-pipeline/transaction-state-pipeline.component';
import { TopSpecTableComponent } from '@views/main/crm/crm/right-hand-side/crm-account/crm-account-reports/top-spec-table/top-spec-table.component';
import { FilterByTraderComponent } from '@views/main/crm/crm/right-hand-side/crm-account/crm-account-reports/filter-by-trader/filter-by-trader.component';
import { ExportModalComponent } from './crm/export-modal/export-modal.component';
import { ImportModalComponent } from './crm/import-modal/import-modal.component';
import { CrmInboundInfoComponent } from './crm/right-hand-side/crm-location/crm-inbound-info/crm-inbound-info.component';
import { DisableControlModule } from '@app/directives/disable-control/disable-control.module';
import { CrmOutboundInfoComponent } from './crm/right-hand-side/crm-location/crm-outbound-info/crm-outbound-info.component';
import { NullOnEmptyModule } from '@app/directives/null-on-empty/null-on-empty.module';
import { BookmarkModule } from '@views/main/common/bookmark/bookmark.module';
import { TransactionMessagingModalModule } from '@views/main/common/modals/transaction-messaging-modal/transaction-messaging-modal.module';
import { ButtonModule } from '@components/common/buttons/button/button.module';
import { FileSelectModule } from '@components/common/inputs/file-select/file-select.module';
import { ValueLabelModule } from '@components/common/value-label/value-label.module';
import { CompanyFormModule } from '@components/common/forms/company-form/company-form.module';
import { ProfileFormModule } from '@components/common/forms/profile-form/profile-form.module';
import { FacilityFormModule } from '@components/common/forms/facility-details/facility-form-module';
import { DialogModalModule } from '@components/common/modals/dialog-modal/dialog-modal.module';
import { ModalBaseModule } from '@components/common/modals/modal-base/modal-base.module';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatCardModule } from '@angular/material/card';
import { CrmAccountPaymentInfoComponent } from '@views/main/crm/crm/right-hand-side/crm-account/crm-account-payment-info/crm-account-payment-info.component';
import { CrmAccountCreditMemosComponent } from '@views/main/crm/crm/right-hand-side/crm-account/crm-account-credit-memos/crm-account-credit-memos.component';

@NgModule({
  imports: [
    MatFormFieldModule,
    MatSelectModule,
    FormsModule,
    MatDialogModule,
    MatTabsModule,
    MatInputModule,
    MatMenuModule,
    ReactiveFormsModule,
    CommonModule,
    MatIconModule,
    PipesModule,
    DxDataGridModule,
    DxChartModule,
    DxFunnelModule,
    DxPieChartModule,
    DisableControlModule,
    NullOnEmptyModule,
    TransactionMessagingModalModule,
    RouterModule.forChild(crmRoutes),
    BookmarkModule,
    TableBaseModule,
    ButtonModule,
    FileSelectModule,
    ValueLabelModule,
    CompanyFormModule,
    ProfileFormModule,
    FacilityFormModule,
    DialogModalModule,
    ModalBaseModule,
    TableActionsModule,
    AutocompleteModule,
    TableResultsTextModule,
    ShowViewCostDirectiveModule,
    MatSlideToggleModule,
    MatButtonModule,
    MatCardModule
  ],
  declarations: [
    CrmComponent,
    AddCrmAccountModalComponent,
    CrmAccountSalesInfoComponent,
    CrmAccountCreditInfoComponent,
    CrmAccountComponent,
    CrmAccountContactsComponent,
    CrmContactComponent,
    RightHandSideComponent,
    CrmContactSalesInfoComponent,
    CrmAccountLocationsComponent,
    CrmLocationComponent,
    CrmLocationSalesInfoComponent,
    LinkedCrmAccountModalComponent,
    UnlinkedCrmAccountModalComponent,
    LinkedCrmContactModalComponent,
    UnlinkedCrmContactModalComponent,
    LinkedCrmLocationModalComponent,
    UnlinkedCrmLocationModalComponent,
    TabExpansionIconComponent,
    CrmAccountOrdersComponent,
    LabelsGroupComponent,
    CrmAccountReportsComponent,
    SellerSummaryComponent,
    FYRevenueChartComponent,
    TraderRevenueChartComponent,
    TransactionStatePipelineComponent,
    TopSpecTableComponent,
    FilterByTraderComponent,
    ExportModalComponent,
    ImportModalComponent,
    CrmInboundInfoComponent,
    CrmOutboundInfoComponent,
    CrmAccountPaymentInfoComponent,
    CrmAccountCreditMemosComponent
  ]
})
export class CrmModule {}
