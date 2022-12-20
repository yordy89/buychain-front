import { NgModule } from '@angular/core';

import { LoadAllUnitsComponent } from './load-all-units.component';
import { CommonModule } from '@angular/common';
import { DxButtonModule, DxProgressBarModule } from 'devextreme-angular';

@NgModule({
  imports: [CommonModule, DxProgressBarModule, DxButtonModule],
  exports: [LoadAllUnitsComponent],
  declarations: [LoadAllUnitsComponent],
  providers: []
})
export class LoadAllUnitsModule {}
