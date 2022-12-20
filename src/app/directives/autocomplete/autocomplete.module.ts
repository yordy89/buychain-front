import { NgModule } from '@angular/core';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AutocompleteComponent } from '@directives/autocomplete/autocomplete.component';
import { DisableControlModule } from '@directives/disable-control/disable-control.module';
import { MatButtonModule } from '@angular/material/button';
import { PipesModule } from '@pipes/pipes.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    DisableControlModule,
    MatButtonModule,
    PipesModule
  ],
  declarations: [AutocompleteComponent],
  exports: [AutocompleteComponent]
})
export class AutocompleteModule {}
