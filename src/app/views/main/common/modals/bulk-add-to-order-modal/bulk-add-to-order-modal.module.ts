import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ButtonModule } from '@components/common/buttons/button/button.module';
import { NumberInputModule } from '@components/common/inputs/number-input/number-input.module';
import { ModalBaseModule } from '@components/common/modals/modal-base/modal-base.module';
import { TableBaseModule } from '@components/common/table-base/table-base.module';
import { ValueLabelModule } from '@components/common/value-label/value-label.module';
import { AutocompleteModule } from '@directives/autocomplete/autocomplete.module';
import { PipesModule } from '@pipes/pipes.module';
import { BulkAddToOrderModalComponent } from '@views/main/common/modals/bulk-add-to-order-modal/bulk-add-to-order-modal.component';
import { MatButtonToggleModule } from '@angular/material/button-toggle';

@NgModule({
  imports: [
    CommonModule,
    ModalBaseModule,
    AutocompleteModule,
    ReactiveFormsModule,
    ButtonModule,
    TableBaseModule,
    PipesModule,
    MatTooltipModule,
    MatIconModule,
    ValueLabelModule,
    NumberInputModule,
    MatButtonToggleModule
  ],
  exports: [],
  declarations: [BulkAddToOrderModalComponent],
  providers: []
})
export class BulkAddToOrderModalModule {}
