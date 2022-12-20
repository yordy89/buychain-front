import { NgModule } from '@angular/core';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { PipesModule } from '@pipes/pipes.module';
import { TreeSelectorComponent } from './tree-selector.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { ReactiveFormsModule } from '@angular/forms';
import { MatMenuModule } from '@angular/material/menu';
import { DxTreeListModule } from 'devextreme-angular';

@NgModule({
  imports: [
    MatFormFieldModule,
    MatIconModule,
    MatButtonModule,
    CommonModule,
    MatInputModule,
    ReactiveFormsModule,
    MatMenuModule,
    DxTreeListModule,
    MatAutocompleteModule,
    PipesModule
  ],
  exports: [TreeSelectorComponent],
  declarations: [TreeSelectorComponent],
  providers: []
})
export class TreeSelectorModule {}
