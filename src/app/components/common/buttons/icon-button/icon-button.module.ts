import { NgModule } from '@angular/core';
import { IconButtonComponent } from './icon-button.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

@NgModule({
  imports: [MatButtonModule, MatIconModule, CommonModule],
  exports: [IconButtonComponent],
  declarations: [IconButtonComponent],
  providers: []
})
export class IconButtonModule {}
