import { NgModule } from '@angular/core';
import { TooltipInfoIconComponent } from './tooltip-info-icon.component';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

@NgModule({
  imports: [MatIconModule, MatTooltipModule],
  exports: [TooltipInfoIconComponent],
  declarations: [TooltipInfoIconComponent],
  providers: []
})
export class TooltipInfoIconModule {}
