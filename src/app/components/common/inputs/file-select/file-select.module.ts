import { NgModule } from '@angular/core';
import { ButtonModule } from '@components/common/buttons/button/button.module';
import { FileSelectComponent } from './file-select.component';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';

@NgModule({
  imports: [MatIconModule, CommonModule, ButtonModule, MatButtonModule],
  exports: [FileSelectComponent],
  declarations: [FileSelectComponent],
  providers: []
})
export class FileSelectModule {}
