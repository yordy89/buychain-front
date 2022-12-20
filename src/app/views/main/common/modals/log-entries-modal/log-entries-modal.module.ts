import { NgModule } from '@angular/core';
import { TableBaseModule } from '@components/common/table-base/table-base.module';
import { LogEntriesModalComponent } from '@views/main/common/modals/log-entries-modal/log-entries-modal.component';
import { ModalBaseModule } from '@components/common/modals/modal-base/modal-base.module';
import { CommonModule } from '@angular/common';
import { ButtonModule } from '@components/common/buttons/button/button.module';
import { PipesModule } from '@pipes/pipes.module';

@NgModule({
  imports: [ModalBaseModule, CommonModule, ButtonModule, PipesModule, TableBaseModule],
  exports: [LogEntriesModalComponent],
  declarations: [LogEntriesModalComponent],
  providers: []
})
export class LogEntriesModalModule {}
