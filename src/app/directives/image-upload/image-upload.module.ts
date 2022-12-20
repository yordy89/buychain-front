import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ImageUploadComponent } from '@directives/image-upload/image-upload.component';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { LetterLogoModule } from '@components/common/letter-logo/letter-logo/letter-logo.module';

@NgModule({
  imports: [CommonModule, MatIconModule, MatInputModule, LetterLogoModule],
  declarations: [ImageUploadComponent],
  exports: [ImageUploadComponent]
})
export class ImageUploadModule {}
