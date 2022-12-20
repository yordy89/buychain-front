import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DisableControlDirective } from '@directives/disable-control/disable-control.directive';

@NgModule({
  imports: [CommonModule],
  declarations: [DisableControlDirective],
  exports: [DisableControlDirective]
})
export class DisableControlModule {}
