import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { NullOnEmptyDirective } from './null-on-empty.directive';
import { FormsModule } from '@angular/forms';

@NgModule({
  imports: [FormsModule, CommonModule, MatIconModule, MatInputModule],
  declarations: [NullOnEmptyDirective],
  exports: [NullOnEmptyDirective]
})
export class NullOnEmptyModule {}
