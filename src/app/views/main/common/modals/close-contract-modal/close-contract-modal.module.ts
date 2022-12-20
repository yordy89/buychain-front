import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { ButtonModule } from '@components/common/buttons/button/button.module';
import { CopyTextButtonModule } from '@components/common/buttons/copy-text-button/copy-text-button.module';
import { IconButtonModule } from '@components/common/buttons/icon-button/icon-button.module';
import { ModalBaseModule } from '@components/common/modals/modal-base/modal-base.module';
import { PipesModule } from '@pipes/pipes.module';
import { CloseContractModalComponent } from '@views/main/common/modals/close-contract-modal/close-contract-modal.component';
import { CommonModule } from '@angular/common';
import { DxDataGridModule } from 'devextreme-angular';
import { QuicklinkModule } from 'ngx-quicklink';

@NgModule({
  imports: [
    CommonModule,
    ModalBaseModule,
    ButtonModule,
    DxDataGridModule,
    MatTooltipModule,
    CopyTextButtonModule,
    IconButtonModule,
    PipesModule,
    RouterModule,
    MatInputModule,
    ReactiveFormsModule,
    QuicklinkModule
  ],
  exports: [CloseContractModalComponent],
  declarations: [CloseContractModalComponent],
  providers: []
})
export class CloseContractModalModule {}
