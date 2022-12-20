import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { TableBaseComponent } from './table-base.component';

@NgModule({
  imports: [CommonModule],
  exports: [TableBaseComponent],
  declarations: [TableBaseComponent],
  providers: []
})
export class TableBaseModule {}
