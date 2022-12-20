import { NgModule } from '@angular/core';
import { ModalBaseModule } from '@components/common/modals/modal-base/modal-base.module';
import { DialogModalComponent } from './dialog-modal.component';
import { MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { ButtonModule } from '@components/common/buttons/button/button.module';

@NgModule({
  imports: [MatDialogModule, CommonModule, ButtonModule, ModalBaseModule],
  exports: [],
  declarations: [DialogModalComponent],
  providers: []
})
export class DialogModalModule {}
