import { NgModule } from '@angular/core';
import { TableActionsModule } from '@components/common/table-actions/table-actions.module';
import { TableResultsTextModule } from '@components/common/table-results-text/table-results-text.module';
import { RateTableEntriesComponent } from '@views/main/company/settings/rate-tables/rate-table-entries-module/rate-table-entries/rate-table-entries.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { DxDataGridModule, DxSelectBoxModule } from 'devextreme-angular';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { RouterModule } from '@angular/router';
import { rateTableRoutes } from '@views/main/company/settings/rate-tables/rate-table-entries-module/rate-table-entries.routing';
import { ImportRateTableModalComponent } from '@views/main/company/settings/rate-tables/rate-table-entries-module/rate-table-entries/import-rate-table-modal/import-rate-table-modal.component';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ButtonModule } from '@components/common/buttons/button/button.module';
import { IconButtonModule } from '@components/common/buttons/icon-button/icon-button.module';
import { FileSelectModule } from '@components/common/inputs/file-select/file-select.module';
import { DialogModalModule } from '@components/common/modals/dialog-modal/dialog-modal.module';
import { ModalBaseModule } from '@components/common/modals/modal-base/modal-base.module';
import { AddRateTableEntryModalComponent } from './rate-table-entries/add-rate-table-entry-modal/add-rate-table-entry-modal.component';
import { MatSelectModule } from '@angular/material/select';
import { SelectWithSearchModule } from '@components/common/inputs/select-with-search/select-with-search.module';
import { PipesModule } from '@pipes/pipes.module';
import { NullOnEmptyModule } from '@directives/null-on-empty/null-on-empty.module';
import { EditRateTableEntryModalComponent } from './rate-table-entries/edit-rate-table-entry-modal/edit-rate-table-entry-modal.component';
import { MatIconModule } from '@angular/material/icon';
import { NumberInputModule } from '@components/common/inputs/number-input/number-input.module';
import { AutocompleteModule } from '@directives/autocomplete/autocomplete.module';

@NgModule({
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    DxDataGridModule,
    DxSelectBoxModule,
    CommonModule,
    MatInputModule,
    RouterModule.forChild(rateTableRoutes),
    MatCheckboxModule,
    FormsModule,
    MatProgressBarModule,
    ButtonModule,
    IconButtonModule,
    FileSelectModule,
    DialogModalModule,
    ModalBaseModule,
    MatSelectModule,
    SelectWithSearchModule,
    PipesModule,
    NullOnEmptyModule,
    MatIconModule,
    NumberInputModule,
    TableActionsModule,
    TableResultsTextModule,
    AutocompleteModule
  ],
  declarations: [
    RateTableEntriesComponent,
    ImportRateTableModalComponent,
    AddRateTableEntryModalComponent,
    EditRateTableEntryModalComponent
  ],
  exports: [RateTableEntriesComponent]
})
export class RateTableEntriesModule {}
