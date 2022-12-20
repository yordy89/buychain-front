import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { ModalBaseComponent } from './modal-base.component';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';

@NgModule({
  imports: [MatIconModule, MatButtonModule, MatDialogModule, CommonModule],
  exports: [ModalBaseComponent],
  declarations: [ModalBaseComponent],
  providers: []
})
export class ModalBaseModule {}
