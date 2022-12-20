import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { RouterModule } from '@angular/router';
import { ButtonModule } from '@components/common/buttons/button/button.module';
import { SelectWithSearchModule } from '@components/common/inputs/select-with-search/select-with-search.module';
import { ModalBaseModule } from '@components/common/modals/modal-base/modal-base.module';
import { TableActionsModule } from '@components/common/table-actions/table-actions.module';
import { TableResultsTextModule } from '@components/common/table-results-text/table-results-text.module';
import { NullOnEmptyModule } from '@directives/null-on-empty/null-on-empty.module';
import { PipesModule } from '@pipes/pipes.module';
import { AccountsComponent } from '@views/main/accounting/financial/accounts/accounts.component';
import { AddEditAccountModalComponent } from '@views/main/accounting/financial/accounts/add-edit-account-modal/add-edit-account-modal.component';
import { BookmarkModule } from '@views/main/common/bookmark/bookmark.module';
import { FilterExpanderModule } from '@views/main/common/filter-expander/filter-expander.moudle';
import { FilterGridLayoutModule } from '@views/main/common/filter-grid-layout/filter-grid-layout.module';
import { DxDataGridModule } from 'devextreme-angular';
import { AccountFiltersComponent } from './account-filters/account-filters.component';
import { MatTooltipModule } from '@angular/material/tooltip';

@NgModule({
  imports: [
    RouterModule.forChild([{ path: '', component: AccountsComponent }]),
    BookmarkModule,
    FilterGridLayoutModule,
    FilterExpanderModule,
    MatSlideToggleModule,
    SelectWithSearchModule,
    DxDataGridModule,
    CommonModule,
    ButtonModule,
    MatIconModule,
    ModalBaseModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    PipesModule,
    MatInputModule,
    FormsModule,
    MatTooltipModule,
    TableActionsModule,
    MatCheckboxModule,
    TableResultsTextModule,
    NullOnEmptyModule
  ],
  exports: [],
  declarations: [AccountsComponent, AddEditAccountModalComponent, AccountFiltersComponent],
  providers: []
})
export class AccountsModule {}
