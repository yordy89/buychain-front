import { OverlayModule } from '@angular/cdk/overlay';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { CopyTextButtonModule } from '@components/common/buttons/copy-text-button/copy-text-button.module';
import { TableActionsModule } from '@components/common/table-actions/table-actions.module';
import { TableBaseModule } from '@components/common/table-base/table-base.module';
import { TableResultsTextModule } from '@components/common/table-results-text/table-results-text.module';
import { ShowContractDirectiveModule } from '@directives/show/show-contract.directive';
import { ShowViewCostDirectiveModule } from '@directives/show/show-view-cost.directive';
import { FavoriteProductsComponent } from '@views/main/order/order-details/transaction-summary/add-offbook-product-modal/favorite-products/favorite-products.component';
import { ProductsTemplatesComponent } from '@views/main/order/order-details/transaction-summary/add-offbook-product-modal/products-templates/products-templates.component';
import { OrderPdfTemplatesModule } from '@views/main/order/order-pdf-templates/order-pdf-templates.module';
import { orderRoutes } from './order.routing';
import { OrdersOverviewComponent } from './orders-overview/orders-overview.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { OrderDetailsComponent } from '@views/main/order/order-details/order-details.component';
import {
  DxCircularGaugeModule,
  DxDataGridModule,
  DxDateBoxModule,
  DxNumberBoxModule,
  DxPieChartModule,
  DxSelectBoxModule,
  DxSpeedDialActionModule,
  DxTextBoxModule,
  DxTooltipModule
} from 'devextreme-angular';
import { PipesModule } from '@pipes/pipes.module';
import { TransactionSummaryComponent } from '@views/main/order/order-details/transaction-summary/transaction-summary.component';
import { TransactionCostDataModalComponent } from '@views/main/order/order-details/transaction-summary/cost-info/transaction-cost-data-modal/transaction-cost-data-modal.component';
import { TransactionStateComponent } from './order-details/transaction-summary/transaction-state/transaction-state.component';
import { AddMilestoneModalComponent } from './order-details/transaction-summary/add-milestone-modal/add-milestone-modal.component';
import { AddOffbookProductModalComponent } from './order-details/transaction-summary/add-offbook-product-modal/add-offbook-product-modal.component';
import { TallyGridComponent } from './order-details/transaction-summary/add-offbook-product-modal/tally-grid/tally-grid.component';
import { TransactionSummaryListComponent } from './order-details/transaction-summary-list/transaction-summary-list.component';
import { ShippingInfoComponent } from './order-details/transaction-summary/shipping-info/shipping-info.component';
import { ShippingInfoEditModalComponent } from './order-details/transaction-summary/shipping-info-edit-modal/shipping-info-edit-modal.component';
import { AddProductLotModalComponent } from '@views/main/order/order-details/transaction-summary/add-product-lot-modal/add-product-lot-modal.component';
import { CostInfoComponent } from './order-details/transaction-summary/cost-info/cost-info.component';
import { StateUpdateComponent } from './order-details/transaction-summary/state-update/state-update.component';
import { SupplierFinanceReviewModalComponent } from './order-details/transaction-summary/state-update/supplier-finance-review-modal/supplier-finance-review-modal.component';
import { ShippingTransportationComponent } from './order-details/transaction-summary/shipping-info-edit-modal/shipping-transportation/shipping-transportation.component';
import { PurchaseSalesNumberComponent } from './order-details/transaction-summary/purchase-sales-number/purchase-sales-number.component';
import { TransportationInfoComponent } from './order-details/transaction-summary/transportation-info/transportation-info.component';
import { FreightTooltipComponent } from './order-details/transaction-summary/shipping-info-edit-modal/shipping-transportation/freight-tooltip/freight-tooltip.component';
import { OrderDeleteDialogModalComponent } from '@views/main/order/order-details/order-delete-dialog-modal/order-delete-dialog-modal.component';
import { MatTabsModule } from '@angular/material/tabs';
import { ChangeTransactionModalComponent } from './order-details/transaction-summary/state-update/change-transaction-modal/change-transaction-modal.component';
import { TallyComponent } from './order-details/transaction-summary/tally/tally.component';
import { NewOrderComponent } from './order-details/new-order/new-order.component';
import { MatDialogModule } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { BookmarkModule } from '@views/main/common/bookmark/bookmark.module';
import { InventorySearchModule } from '@views/main/common/inventory/inventory-search/inventory-search.module';
import { MarketSearchModule } from '@views/main/common/market-search/market-search.module';
import { FilterGridLayoutModule } from '@views/main/common/filter-grid-layout/filter-grid-layout.module';
import { FilterExpanderModule } from '@views/main/common/filter-expander/filter-expander.moudle';
import { EditProductLotModalModule } from '@views/main/common/modals/edit-product-lot-modal/edit-product-lot-modal.module';
import { AddTallyUnitModalModule } from '@views/main/common/modals/add-tally-unit-modal/add-tally-unit-modal.module';
import { TransactionMessagingModalModule } from '@views/main/common/modals/transaction-messaging-modal/transaction-messaging-modal.module';
import { ButtonModule } from '@components/common/buttons/button/button.module';
import { IconButtonModule } from '@components/common/buttons/icon-button/icon-button.module';
import { FileSelectModule } from '@components/common/inputs/file-select/file-select.module';
import { InPlaceEditorModule } from '@components/common/inputs/in-place-editor/in-place-editor.module';
import { NumberInputModule } from '@components/common/inputs/number-input/number-input.module';
import { SelectWithSearchModule } from '@components/common/inputs/select-with-search/select-with-search.module';
import { DialogModalModule } from '@components/common/modals/dialog-modal/dialog-modal.module';
import { ModalBaseModule } from '@components/common/modals/modal-base/modal-base.module';
import { OpenTransactionsComponent } from './order-details/transaction-summary/state-update/supplier-finance-review-modal/open-transactions/open-transactions.component';
import { NullOnEmptyModule } from '@directives/null-on-empty/null-on-empty.module';
import { UserDetailsComponent } from './order-details/transaction-summary/shipping-info/user-details/user-details.component';
import { MilestonesComponent } from './order-details/transaction-summary/milestones/milestones.component';
import { ProductSpecSelectionComponent } from './order-details/transaction-summary/add-offbook-product-modal/product-spec-selection/product-spec-selection.component';
import { LogEntriesModalModule } from '@views/main/common/modals/log-entries-modal/log-entries-modal.module';
import { TableFabModule } from '@components/common/table-fab/table-fab.module';
import { LoadAllUnitsModule } from '@views/main/common/load-all-units/load-all-units.module';
import { InventoryStreamlineModule } from '@views/main/common/inventory/inventory-streamline/inventory-streamline.module';
import { RandomLengthProductModule } from '@views/main/common/random-length-product/random-length-product.module';

@NgModule({
  imports: [
    CommonModule,
    PipesModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatIconModule,
    MatInputModule,
    MatRadioModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatAutocompleteModule,
    MatTooltipModule,
    MatSlideToggleModule,
    MatTabsModule,
    FormsModule,
    ReactiveFormsModule,
    DxDataGridModule,
    DxCircularGaugeModule,
    DxPieChartModule,
    DxTooltipModule,
    RouterModule.forChild(orderRoutes),
    MatExpansionModule,
    MatDialogModule,
    MatMenuModule,
    DxSelectBoxModule,
    DxNumberBoxModule,
    DxDateBoxModule,
    DxTextBoxModule,
    BookmarkModule,
    InventorySearchModule,
    MarketSearchModule,
    FilterGridLayoutModule,
    FilterExpanderModule,
    EditProductLotModalModule,
    AddTallyUnitModalModule,
    TransactionMessagingModalModule,
    LogEntriesModalModule,
    ButtonModule,
    IconButtonModule,
    FileSelectModule,
    InPlaceEditorModule,
    NumberInputModule,
    SelectWithSearchModule,
    TableBaseModule,
    OverlayModule,
    DialogModalModule,
    ModalBaseModule,
    CopyTextButtonModule,
    TableActionsModule,
    NullOnEmptyModule,
    DxSpeedDialActionModule,
    TableResultsTextModule,
    TableFabModule,
    ShowViewCostDirectiveModule,
    ShowContractDirectiveModule,
    LoadAllUnitsModule,
    InventoryStreamlineModule,
    OrderPdfTemplatesModule,
    RandomLengthProductModule
  ],
  declarations: [
    OrdersOverviewComponent,
    OrderDetailsComponent,
    TransactionSummaryComponent,
    TransactionCostDataModalComponent,
    TransactionStateComponent,
    AddMilestoneModalComponent,
    AddOffbookProductModalComponent,
    AddProductLotModalComponent,
    TallyGridComponent,
    TransactionSummaryListComponent,
    ShippingInfoComponent,
    ShippingInfoEditModalComponent,
    CostInfoComponent,
    StateUpdateComponent,
    SupplierFinanceReviewModalComponent,
    ShippingTransportationComponent,
    PurchaseSalesNumberComponent,
    TransportationInfoComponent,
    OrderDeleteDialogModalComponent,
    FreightTooltipComponent,
    ChangeTransactionModalComponent,
    TallyComponent,
    NewOrderComponent,
    OpenTransactionsComponent,
    UserDetailsComponent,
    MilestonesComponent,
    ProductSpecSelectionComponent,
    FavoriteProductsComponent,
    ProductsTemplatesComponent
  ],
  bootstrap: [OrdersOverviewComponent],
  providers: []
})
export class OrderModule {}
