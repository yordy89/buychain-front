import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { ButtonModule } from '@components/common/buttons/button/button.module';
import { ModalBaseModule } from '@components/common/modals/modal-base/modal-base.module';
import { PipesModule } from '@pipes/pipes.module';
import { BulkEditProductLotModalComponent } from '@views/main/common/modals/bulk-edit-product-lot-modal/bulk-edit-product-lot-modal.component';

@NgModule({
  imports: [
    CommonModule,
    ModalBaseModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    MatDatepickerModule,
    ButtonModule,
    PipesModule,
    MatSelectModule,
    MatRadioModule,
    MatInputModule
  ],
  exports: [],
  declarations: [BulkEditProductLotModalComponent],
  providers: []
})
export class BulkEditProductLotModalModule {}
