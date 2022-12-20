import { NgModule } from '@angular/core';
import { ModalBaseModule } from '@components/common/modals/modal-base/modal-base.module';

import { AddTallyUnitModalComponent } from './add-tally-unit-modal.component';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CommonModule } from '@angular/common';
import { MatDialogModule } from '@angular/material/dialog';
import { ButtonModule } from '@components/common/buttons/button/button.module';
import { PipesModule } from '@pipes/pipes.module';

@NgModule({
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    CommonModule,
    MatDialogModule,
    ButtonModule,
    ModalBaseModule,
    PipesModule
  ],
  exports: [],
  declarations: [AddTallyUnitModalComponent],
  providers: []
})
export class AddTallyUnitModalModule {}
