import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { TableFabComponent } from '@components/common/table-fab/table-fab.component';

@NgModule({
  imports: [CommonModule, MatMenuModule, MatIconModule, MatButtonModule],
  exports: [TableFabComponent],
  declarations: [TableFabComponent],
  providers: []
})
export class TableFabModule {}
