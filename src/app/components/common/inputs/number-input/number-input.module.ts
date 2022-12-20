import { NgModule } from '@angular/core';
import { IconButtonModule } from '@components/common/buttons/icon-button/icon-button.module';
import { NumberInputComponent } from './number-input.component';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatTooltipModule } from '@angular/material/tooltip';

@NgModule({
  imports: [CommonModule, ReactiveFormsModule, MatTooltipModule, IconButtonModule],
  exports: [NumberInputComponent],
  declarations: [NumberInputComponent],
  providers: []
})
export class NumberInputModule {}
