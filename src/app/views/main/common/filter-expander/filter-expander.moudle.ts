import { NgModule } from '@angular/core';
import { FilterExpanderComponent } from './filter-expander.component';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

@NgModule({
  imports: [MatIconModule, CommonModule],
  exports: [FilterExpanderComponent],
  declarations: [FilterExpanderComponent],
  providers: []
})
export class FilterExpanderModule {}
