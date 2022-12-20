import { NgModule } from '@angular/core';
import { ModalBaseModule } from '@components/common/modals/modal-base/modal-base.module';
import { TransactionMessagingModalComponent } from './transaction-messaging-modal.component';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { PipesModule } from '@pipes/pipes.module';
import { MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatInputModule } from '@angular/material/input';
import { ButtonModule } from '@components/common/buttons/button/button.module';
import { LetterLogoModule } from '@components/common/letter-logo/letter-logo/letter-logo.module';

@NgModule({
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    PipesModule,
    MatDialogModule,
    CommonModule,
    MatTooltipModule,
    MatInputModule,
    ButtonModule,
    ModalBaseModule,
    LetterLogoModule
  ],
  exports: [TransactionMessagingModalComponent],
  declarations: [TransactionMessagingModalComponent],
  providers: []
})
export class TransactionMessagingModalModule {}
