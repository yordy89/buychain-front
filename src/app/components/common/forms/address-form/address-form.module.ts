import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { AddressFormComponent } from '@components/common/forms/address-form/address-form.component';
import { AutocompleteModule } from '@directives/autocomplete/autocomplete.module';

@NgModule({
  imports: [CommonModule, AutocompleteModule, ReactiveFormsModule],
  exports: [AddressFormComponent],
  declarations: [AddressFormComponent],
  providers: []
})
export class AddressFormModule {}
