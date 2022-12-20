import { NgModule } from '@angular/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { TableActionsModule } from '@components/common/table-actions/table-actions.module';
import { TableResultsTextModule } from '@components/common/table-results-text/table-results-text.module';
import { NullOnEmptyModule } from '@directives/null-on-empty/null-on-empty.module';
import { AddEditDimensionModalComponent } from '@views/main/accounting/financial/dimensions/add-edit-dimension-modal/add-edit-dimension-modal.component';
import { DimensionsComponent } from '@views/main/accounting/financial/dimensions/dimensions.component';
import { FilterGridLayoutModule } from '@views/main/common/filter-grid-layout/filter-grid-layout.module';
import { RouterModule } from '@angular/router';
import { DxDataGridModule } from 'devextreme-angular';
import { ButtonModule } from '@components/common/buttons/button/button.module';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ReactiveFormsModule } from '@angular/forms';
import { ModalBaseModule } from '@components/common/modals/modal-base/modal-base.module';
import { MatInputModule } from '@angular/material/input';
import { PipesModule } from '@pipes/pipes.module';

@NgModule({
  imports: [
    RouterModule.forChild([{ path: '', component: DimensionsComponent }]),
    DxDataGridModule,
    ButtonModule,
    CommonModule,
    MatIconModule,
    MatSlideToggleModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    ModalBaseModule,
    MatInputModule,
    TableActionsModule,
    PipesModule,
    MatCheckboxModule,
    TableResultsTextModule,
    FilterGridLayoutModule,
    NullOnEmptyModule
  ],
  exports: [],
  declarations: [DimensionsComponent, AddEditDimensionModalComponent],
  providers: []
})
export class DimensionsModule {}
