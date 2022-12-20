import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { ChipListInputComponent } from '@components/common/inputs/chip-list-input/chip-list-input.component';
import { PipesModule } from '@pipes/pipes.module';

@NgModule({
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatChipsModule,
    MatAutocompleteModule,
    MatIconModule,
    ReactiveFormsModule,
    PipesModule,
    MatInputModule
  ],
  declarations: [ChipListInputComponent],
  exports: [ChipListInputComponent]
})
export class ChipListInputModule {}
