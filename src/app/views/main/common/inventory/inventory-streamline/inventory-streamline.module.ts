import { NgModule } from '@angular/core';
import { InventoryStreamlineComponent } from './inventory-streamline.component';
import { BookmarkModule } from '@views/main/common/bookmark/bookmark.module';
import { CommonModule } from '@angular/common';
import { FilterExpanderModule } from '@views/main/common/filter-expander/filter-expander.moudle';
import { MatRadioModule } from '@angular/material/radio';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FilterGridLayoutModule } from '@views/main/common/filter-grid-layout/filter-grid-layout.module';
import { ButtonModule } from '@components/common/buttons/button/button.module';
import { DxDataGridModule } from 'devextreme-angular';
import { LoadAllUnitsModule } from '@views/main/common/load-all-units/load-all-units.module';
import { TableResultsTextModule } from '@components/common/table-results-text/table-results-text.module';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AutocompleteModule } from '@directives/autocomplete/autocomplete.module';
import { ShowViewCostDirectiveModule } from '@directives/show/show-view-cost.directive';
import { TableFabModule } from '@components/common/table-fab/table-fab.module';
import { MatMenuModule } from '@angular/material/menu';
import { ShowContractDirectiveModule } from '@directives/show/show-contract.directive';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { PipesModule } from '@pipes/pipes.module';
import { SelectWithSearchModule } from '@components/common/inputs/select-with-search/select-with-search.module';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { InventoryStreamlineFiltersComponent } from './inventory-streamline-filters/inventory-streamline-filters.component';
import { ShoppingCartModule } from '@views/main/common/shopping-cart/shopping-cart.module';

@NgModule({
  imports: [
    BookmarkModule,
    CommonModule,
    FilterExpanderModule,
    MatRadioModule,
    MatIconModule,
    MatCheckboxModule,
    FormsModule,
    FilterGridLayoutModule,
    ButtonModule,
    DxDataGridModule,
    LoadAllUnitsModule,
    TableResultsTextModule,
    MatTooltipModule,
    ReactiveFormsModule,
    AutocompleteModule,
    ShowViewCostDirectiveModule,
    ShowContractDirectiveModule,
    TableFabModule,
    MatMenuModule,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
    PipesModule,
    SelectWithSearchModule,
    MatButtonToggleModule,
    ShoppingCartModule
  ],
  exports: [InventoryStreamlineComponent],
  declarations: [InventoryStreamlineComponent, InventoryStreamlineFiltersComponent],
  providers: []
})
export class InventoryStreamlineModule {}
