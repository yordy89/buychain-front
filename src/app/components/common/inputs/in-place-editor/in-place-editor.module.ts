import { NgModule } from '@angular/core';
import { IconButtonModule } from '@components/common/buttons/icon-button/icon-button.module';
import { InPlaceEditorComponent } from './in-place-editor.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { NullOnEmptyModule } from '@directives/null-on-empty/null-on-empty.module';
import { PipesModule } from '@pipes/pipes.module';

@NgModule({
  imports: [
    MatFormFieldModule,
    CommonModule,
    ReactiveFormsModule,
    MatDatepickerModule,
    MatInputModule,
    IconButtonModule,
    NullOnEmptyModule,
    PipesModule
  ],
  exports: [InPlaceEditorComponent],
  declarations: [InPlaceEditorComponent],
  providers: []
})
export class InPlaceEditorModule {}
