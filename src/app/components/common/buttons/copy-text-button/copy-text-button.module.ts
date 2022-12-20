import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CopyTextButtonComponent } from '@components/common/buttons/copy-text-button/copy-text-button.component';
import { IconButtonModule } from '@components/common/buttons/icon-button/icon-button.module';

@NgModule({
  imports: [MatIconModule, CommonModule, IconButtonModule, MatTooltipModule],
  exports: [CopyTextButtonComponent],
  declarations: [CopyTextButtonComponent],
  providers: []
})
export class CopyTextButtonModule {}
