import { NgModule } from '@angular/core';
import { RandomLengthProductComponent } from './random-length-product.component';
import { TableBaseModule } from '@components/common/table-base/table-base.module';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { ReactiveFormsModule } from '@angular/forms';
import { OrderPdfTemplatesModule } from '@views/main/order/order-pdf-templates/order-pdf-templates.module';
import { ButtonModule } from '@components/common/buttons/button/button.module';
import { ValueLabelModule } from '@components/common/value-label/value-label.module';
import { PipesModule } from '@pipes/pipes.module';
import { MatTooltipModule } from '@angular/material/tooltip';

@NgModule({
  imports: [
    TableBaseModule,
    CommonModule,
    MatInputModule,
    ReactiveFormsModule,
    OrderPdfTemplatesModule,
    ButtonModule,
    ValueLabelModule,
    PipesModule,
    MatTooltipModule
  ],
  exports: [RandomLengthProductComponent],
  declarations: [RandomLengthProductComponent],
  providers: []
})
export class RandomLengthProductModule {}
