import { NgModule } from '@angular/core';
import { AddressFormModule } from '@components/common/forms/address-form/address-form.module';
import { CompanyFormComponent } from './company-form.component';
import { ReactiveFormsModule } from '@angular/forms';
import { ImageUploadModule } from '@directives/image-upload/image-upload.module';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { NullOnEmptyModule } from '@directives/null-on-empty/null-on-empty.module';
import { PipesModule } from '@pipes/pipes.module';

@NgModule({
  imports: [
    ReactiveFormsModule,
    ImageUploadModule,
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    NullOnEmptyModule,
    AddressFormModule,
    PipesModule
  ],
  exports: [CompanyFormComponent],
  declarations: [CompanyFormComponent],
  providers: []
})
export class CompanyFormModule {}
