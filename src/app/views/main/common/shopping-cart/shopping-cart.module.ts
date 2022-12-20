import { NgModule } from '@angular/core';
import { ShoppingCartComponent } from './shopping-cart.component';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { CommonModule } from '@angular/common';

@NgModule({
  imports: [MatIconModule, MatBadgeModule, MatMenuModule, CommonModule],
  exports: [ShoppingCartComponent],
  declarations: [ShoppingCartComponent],
  providers: []
})
export class ShoppingCartModule {}
