import { NgModule } from '@angular/core';
import { TableResultsTextModule } from '@components/common/table-results-text/table-results-text.module';
import { AutocompleteModule } from '@directives/autocomplete/autocomplete.module';

import { MarketSearchComponent } from './market-search.component';
import { BookmarkModule } from '@views/main/common/bookmark/bookmark.module';
import { MatRadioModule } from '@angular/material/radio';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DxDataGridModule } from 'devextreme-angular';
import { CommonModule } from '@angular/common';
import { FilterGridLayoutModule } from '@views/main/common/filter-grid-layout/filter-grid-layout.module';
import { FilterExpanderModule } from '@views/main/common/filter-expander/filter-expander.moudle';
import { ButtonModule } from '@components/common/buttons/button/button.module';
import { SelectWithSearchModule } from '@components/common/inputs/select-with-search/select-with-search.module';

@NgModule({
  exports: [MarketSearchComponent],
  declarations: [MarketSearchComponent],
  imports: [
    BookmarkModule,
    MatRadioModule,
    MatIconModule,
    MatCheckboxModule,
    FormsModule,
    ReactiveFormsModule,
    MatTooltipModule,
    DxDataGridModule,
    CommonModule,
    FilterGridLayoutModule,
    FilterExpanderModule,
    ButtonModule,
    SelectWithSearchModule,
    AutocompleteModule,
    TableResultsTextModule
  ]
})
export class MarketSearchModule {}
