import { NgModule } from '@angular/core';
import { AccountingFileUploadComponent } from './accounting-file-upload.component';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { DxFileUploaderModule } from 'devextreme-angular';

@NgModule({
  imports: [MatIconModule, CommonModule, DxFileUploaderModule],
  exports: [AccountingFileUploadComponent],
  declarations: [AccountingFileUploadComponent],
  providers: []
})
export class AccountingFileUploadModule {}
