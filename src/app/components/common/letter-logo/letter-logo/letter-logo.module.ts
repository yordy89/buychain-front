import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LetterLogoComponent } from '@components/common/letter-logo/letter-logo/letter-logo.component';

@NgModule({
  imports: [CommonModule],
  exports: [LetterLogoComponent],
  declarations: [LetterLogoComponent],
  providers: []
})
export class LetterLogoModule {}
