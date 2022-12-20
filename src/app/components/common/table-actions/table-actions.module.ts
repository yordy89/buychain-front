import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { TableActionsComponent } from '@components/common/table-actions/table-actions.component';

@NgModule({
  imports: [CommonModule, MatIconModule, MatMenuModule],
  exports: [TableActionsComponent],
  declarations: [TableActionsComponent],
  providers: []
})
export class TableActionsModule {}
