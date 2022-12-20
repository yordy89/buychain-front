import { NgModule } from '@angular/core';
import { APLineItemFormComponent } from './ap-line-item-form.component';
import { AutocompleteModule } from '@directives/autocomplete/autocomplete.module';
import { MatSelectModule } from '@angular/material/select';
import { PipesModule } from '@pipes/pipes.module';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { NgxCurrencyModule } from 'ngx-currency';
import { NullOnEmptyModule } from '@directives/null-on-empty/null-on-empty.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatTooltipModule } from '@angular/material/tooltip';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    AutocompleteModule,
    MatSelectModule,
    PipesModule,
    MatInputModule,
    NgxCurrencyModule,
    NullOnEmptyModule,
    MatTooltipModule
  ],
  exports: [APLineItemFormComponent],
  declarations: [APLineItemFormComponent],
  providers: []
})
export class APLineItemFormModule {}
