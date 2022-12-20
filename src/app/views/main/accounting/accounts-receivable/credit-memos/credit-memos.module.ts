import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { DxDataGridModule, DxTemplateHost } from 'devextreme-angular';
import {
  CreditMemosRoutingModule,
  routedComponents
} from '@views/main/accounting/accounts-receivable/credit-memos/credit-memos-routing.module';
import { FilterGridLayoutModule } from '@views/main/common/filter-grid-layout/filter-grid-layout.module';
import { ButtonModule } from '@components/common/buttons/button/button.module';
import { AddEditCreditMemoComponent } from '@views/main/accounting/accounts-receivable/credit-memos/components/add-edit-credit-memo/add-edit-credit-memo.component';
import { SelectWithSearchModule } from '@components/common/inputs/select-with-search/select-with-search.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CreditMemoComponent } from '@views/main/accounting/accounts-receivable/credit-memos/credit-memo/credit-memo.component';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { NgxCurrencyModule } from 'ngx-currency';
import { PipesModule } from '@pipes/pipes.module';
import { NullOnEmptyModule } from '@directives/null-on-empty/null-on-empty.module';
import { AccountingFileUploadModule } from '@views/main/accounting/components/accounting-file-upload/accounting-file-upload.module';
import { MatSelectModule } from '@angular/material/select';
import { AutocompleteModule } from '@directives/autocomplete/autocomplete.module';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { CreditMemosFiltersComponent } from '@views/main/accounting/accounts-receivable/credit-memos/components/credit-memos-filters/credit-memos-filters.component';
import { FilterExpanderModule } from '@views/main/common/filter-expander/filter-expander.moudle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { BookmarkModule } from '@views/main/common/bookmark/bookmark.module';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TableResultsTextModule } from '@components/common/table-results-text/table-results-text.module';
import { CopyTextButtonModule } from '@components/common/buttons/copy-text-button/copy-text-button.module';
import { TableActionsModule } from '@components/common/table-actions/table-actions.module';
import { ViewCreditMemoComponent } from '@views/main/accounting/accounts-receivable/credit-memos/components/view-credit-memo/view-credit-memo.component';
import { ApplyCreditMemoComponent } from '@views/main/accounting/accounts-receivable/credit-memos/components/apply-credit-memo/apply-credit-memo.component';

@NgModule({
  imports: [
    CommonModule,
    CreditMemosRoutingModule,
    FilterGridLayoutModule,
    ButtonModule,
    SelectWithSearchModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    NgxCurrencyModule,
    PipesModule,
    NullOnEmptyModule,
    AccountingFileUploadModule,
    MatSelectModule,
    AutocompleteModule,
    MatDatepickerModule,
    FilterExpanderModule,
    MatCheckboxModule,
    FormsModule,
    BookmarkModule,
    MatTooltipModule,
    TableResultsTextModule,
    DxDataGridModule,
    CopyTextButtonModule,
    TableActionsModule
  ],
  exports: [],
  declarations: [
    ...routedComponents,
    CreditMemoComponent,
    AddEditCreditMemoComponent,
    CreditMemosFiltersComponent,
    ViewCreditMemoComponent,
    ApplyCreditMemoComponent
  ],
  providers: [DxTemplateHost]
})
export class CreditMemosModule {}
