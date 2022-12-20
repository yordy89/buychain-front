import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { TableResultsTextComponent } from '@components/common/table-results-text/table-results-text.component';

@NgModule({
  imports: [CommonModule],
  exports: [TableResultsTextComponent],
  declarations: [TableResultsTextComponent],
  providers: []
})
export class TableResultsTextModule {}
