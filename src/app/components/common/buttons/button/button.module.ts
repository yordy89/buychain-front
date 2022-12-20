import { NgModule } from '@angular/core';
import { ButtonComponent } from './button.component';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@NgModule({
  imports: [CommonModule, MatButtonModule, MatIconModule],
  exports: [ButtonComponent],
  declarations: [ButtonComponent],
  providers: []
})
export class ButtonModule {}
