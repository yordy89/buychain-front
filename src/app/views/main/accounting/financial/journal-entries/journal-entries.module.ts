import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { ButtonModule } from '@components/common/buttons/button/button.module';
import { CopyTextButtonModule } from '@components/common/buttons/copy-text-button/copy-text-button.module';
import { IconButtonModule } from '@components/common/buttons/icon-button/icon-button.module';
import { ChipListInputModule } from '@components/common/inputs/chip-list-input/chip-list-input.module';
import { FileSelectModule } from '@components/common/inputs/file-select/file-select.module';
import { SelectWithSearchModule } from '@components/common/inputs/select-with-search/select-with-search.module';
import { TreeSelectorModule } from '@components/common/inputs/tree-selector/tree-selector.module';
import { ModalBaseModule } from '@components/common/modals/modal-base/modal-base.module';
import { TableActionsModule } from '@components/common/table-actions/table-actions.module';
import { TableFabModule } from '@components/common/table-fab/table-fab.module';
import { TableResultsTextModule } from '@components/common/table-results-text/table-results-text.module';
import { AutocompleteModule } from '@directives/autocomplete/autocomplete.module';
import { NullOnEmptyModule } from '@directives/null-on-empty/null-on-empty.module';
import { PipesModule } from '@pipes/pipes.module';
import { AddEditJournalEntryComponent } from '@views/main/accounting/financial/journal-entries/components/add-edit-journal-entry/add-edit-journal-entry.component';
import { JournalEntriesFiltersComponent } from '@views/main/accounting/financial/journal-entries/components/journal-entries-filters/journal-entries-filters.component';
import { JournalEntriesComponent } from '@views/main/accounting/financial/journal-entries/journal-entries.component';
import { JournalEntryComponent } from '@views/main/accounting/financial/journal-entries/journal-entry/journal-entry.component';
import { ViewJournalEntryComponent } from '@views/main/accounting/financial/journal-entries/components/view-journal-entry/view-journal-entry.component';
import { BookmarkModule } from '@views/main/common/bookmark/bookmark.module';
import { FilterExpanderModule } from '@views/main/common/filter-expander/filter-expander.moudle';
import { FilterGridLayoutModule } from '@views/main/common/filter-grid-layout/filter-grid-layout.module';
import { DxDataGridModule } from 'devextreme-angular';
import { LogEntriesModalModule } from '@views/main/common/modals/log-entries-modal/log-entries-modal.module';
import { NgxCurrencyModule } from 'ngx-currency';
import { AccountingFileUploadModule } from '@views/main/accounting/components/accounting-file-upload/accounting-file-upload.module';

@NgModule({
  imports: [
    RouterModule.forChild([
      { path: '', component: JournalEntriesComponent },
      { path: 'add', component: JournalEntryComponent },
      { path: ':id', component: JournalEntryComponent }
    ]),
    FilterGridLayoutModule,
    DxDataGridModule,
    CommonModule,
    BookmarkModule,
    CopyTextButtonModule,
    PipesModule,
    ButtonModule,
    MatTooltipModule,
    FilterExpanderModule,
    SelectWithSearchModule,
    MatSelectModule,
    MatIconModule,
    FormsModule,
    IconButtonModule,
    TableActionsModule,
    MatMenuModule,
    ModalBaseModule,
    ReactiveFormsModule,
    MatInputModule,
    MatDatepickerModule,
    FileSelectModule,
    MatListModule,
    MatButtonModule,
    MatNativeDateModule,
    MatDialogModule,
    AutocompleteModule,
    NullOnEmptyModule,
    MatCheckboxModule,
    MatCardModule,
    TableResultsTextModule,
    LogEntriesModalModule,
    NgxCurrencyModule,
    TableFabModule,
    TreeSelectorModule,
    ChipListInputModule,
    AccountingFileUploadModule
  ],
  exports: [],
  declarations: [
    JournalEntriesComponent,
    JournalEntriesFiltersComponent,
    ViewJournalEntryComponent,
    JournalEntryComponent,
    AddEditJournalEntryComponent
  ],
  providers: []
})
export class JournalEntriesModule {}
