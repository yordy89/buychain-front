import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ButtonModule } from '@components/common/buttons/button/button.module';
import { CopyTextButtonModule } from '@components/common/buttons/copy-text-button/copy-text-button.module';
import { ModalBaseModule } from '@components/common/modals/modal-base/modal-base.module';
import { PipesModule } from '@pipes/pipes.module';
import { ContractProductsModalComponent } from '@views/main/common/modals/contract-products-modal/contract-products-modal.component';
import { DxDataGridModule } from 'devextreme-angular';

@NgModule({
  imports: [
    CommonModule,
    ModalBaseModule,
    DxDataGridModule,
    MatTooltipModule,
    ButtonModule,
    CopyTextButtonModule,
    PipesModule
  ],
  exports: [ContractProductsModalComponent],
  declarations: [ContractProductsModalComponent],
  providers: []
})
export class ContractProductsModalModule {}
