import { NgModule } from '@angular/core';
import { HistoricalPriceModalComponent } from './historical-price-modal.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { DxChartModule, DxRangeSelectorModule } from 'devextreme-angular';
import { ModalBaseModule } from '@components/common/modals/modal-base/modal-base.module';

@NgModule({
  imports: [
    MatFormFieldModule,
    MatSelectModule,
    FormsModule,
    CommonModule,
    MatTabsModule,
    DxChartModule,
    DxRangeSelectorModule,
    ModalBaseModule
  ],
  exports: [],
  declarations: [HistoricalPriceModalComponent],
  providers: []
})
export class HistoricalPriceModalModule {}
