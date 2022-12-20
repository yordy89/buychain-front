import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { SelectWithSearchComponent } from './select-with-search.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { PipesModule } from '@pipes/pipes.module';

@NgModule({
  imports: [
    MatFormFieldModule,
    MatSelectModule,
    ReactiveFormsModule,
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    PipesModule
  ],
  exports: [SelectWithSearchComponent],
  declarations: [SelectWithSearchComponent],
  providers: []
})
export class SelectWithSearchModule {}
