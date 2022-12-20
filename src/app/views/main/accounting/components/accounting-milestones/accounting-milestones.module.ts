import { NgModule } from '@angular/core';
import { AccountingMilestonesComponent } from './accounting-milestones.component';
import { TableBaseModule } from '@components/common/table-base/table-base.module';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@NgModule({
  imports: [TableBaseModule, CommonModule, MatIconModule],
  exports: [AccountingMilestonesComponent],
  declarations: [AccountingMilestonesComponent],
  providers: []
})
export class AccountingMilestonesModule {}
