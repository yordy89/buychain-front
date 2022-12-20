import { NgModule } from '@angular/core';
import { EditProductLotModalComponent } from '@views/main/common/modals/edit-product-lot-modal/edit-product-lot-modal.component';
import { ButtonModule } from '@components/common/buttons/button/button.module';
import { ModalBaseModule } from '@components/common/modals/modal-base/modal-base.module';
import { ProductLotDetailsModule } from '@views/main/common/product-lot-details/product-lot-details.module';

@NgModule({
  imports: [ProductLotDetailsModule, ModalBaseModule, ButtonModule],
  declarations: [EditProductLotModalComponent],
  providers: []
})
export class EditProductLotModalModule {}
