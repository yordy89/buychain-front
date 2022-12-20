import { NgModule } from '@angular/core';
import { TableResultsTextModule } from '@components/common/table-results-text/table-results-text.module';
import { ShowContractDirectiveModule } from '@directives/show/show-contract.directive';
import { ShowViewCostDirectiveModule } from '@directives/show/show-view-cost.directive';
import { InventorySearchComponent } from '@views/main/common/inventory/inventory-search/inventory-search.component';
import { InventoryFiltersComponent } from '@views/main/common/inventory/inventory-search/inventory-filters/inventory-filters.component';
import { BookmarkModule } from '@views/main/common/bookmark/bookmark.module';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ContractProductsModalModule } from '@views/main/common/modals/contract-products-modal/contract-products-modal.module';
import {
  DxDataGridModule,
  DxDateBoxModule,
  DxNumberBoxModule,
  DxProgressBarModule,
  DxSelectBoxModule,
  DxTextBoxModule
} from 'devextreme-angular';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { PipesModule } from '@pipes/pipes.module';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatInputModule } from '@angular/material/input';
import { FilterGridLayoutModule } from '@views/main/common/filter-grid-layout/filter-grid-layout.module';
import { FilterExpanderModule } from '@views/main/common/filter-expander/filter-expander.moudle';
import { HistoricalPriceModalModule } from '@views/main/common/modals/historical-price-modal/historical-price-modal.module';
import { ButtonModule } from '@components/common/buttons/button/button.module';
import { SelectWithSearchModule } from '@components/common/inputs/select-with-search/select-with-search.module';
import { ModalBaseModule } from '@components/common/modals/modal-base/modal-base.module';
import { MatNativeDateModule } from '@angular/material/core';
import { AutocompleteModule } from '@directives/autocomplete/autocomplete.module';
import { TableFabModule } from '@components/common/table-fab/table-fab.module';
import { MergeLotsModalComponent } from './merge-lots-modal/merge-lots-modal.component';
import { TableBaseModule } from '@components/common/table-base/table-base.module';
import { TableActionsModule } from '@components/common/table-actions/table-actions.module';
import { NumberInputModule } from '@components/common/inputs/number-input/number-input.module';
import { ValueLabelModule } from '@components/common/value-label/value-label.module';
import { LoadAllUnitsModule } from '@views/main/common/load-all-units/load-all-units.module';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { ShoppingCartModule } from '@views/main/common/shopping-cart/shopping-cart.module';

@NgModule({
  imports: [
    BookmarkModule,
    MatFormFieldModule,
    MatSelectModule,
    ReactiveFormsModule,
    DxDataGridModule,
    DxSelectBoxModule,
    DxNumberBoxModule,
    CommonModule,
    RouterModule,
    DxDateBoxModule,
    DxTextBoxModule,
    MatMenuModule,
    MatIconModule,
    MatCheckboxModule,
    FormsModule,
    MatRadioModule,
    PipesModule,
    MatTooltipModule,
    MatInputModule,
    FilterGridLayoutModule,
    FilterExpanderModule,
    HistoricalPriceModalModule,
    ButtonModule,
    SelectWithSearchModule,
    ModalBaseModule,
    MatNativeDateModule,
    TableResultsTextModule,
    ShowViewCostDirectiveModule,
    AutocompleteModule,
    DxProgressBarModule,
    TableFabModule,
    TableBaseModule,
    TableActionsModule,
    ShowContractDirectiveModule,
    NumberInputModule,
    ValueLabelModule,
    LoadAllUnitsModule,
    ContractProductsModalModule,
    MatButtonToggleModule,
    ShoppingCartModule
  ],
  exports: [InventorySearchComponent],
  declarations: [InventorySearchComponent, InventoryFiltersComponent, MergeLotsModalComponent]
})
export class InventorySearchModule {}
