import { NgModule } from '@angular/core';

import { ProductLotDetailsComponent } from './product-lot-details.component';
import { ValueLabelModule } from '@components/common/value-label/value-label.module';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSelectModule } from '@angular/material/select';
import { CommonModule } from '@angular/common';
import { ProductTableComponent } from '@views/main/common/product-lot-details/product-table/product-table.component';
import { PipesModule } from '@pipes/pipes.module';
import { DxDataGridModule } from 'devextreme-angular';
import { CopyTextButtonModule } from '@components/common/buttons/copy-text-button/copy-text-button.module';
import { MatIconModule } from '@angular/material/icon';
import { IconButtonModule } from '@components/common/buttons/icon-button/icon-button.module';
import { TableFabModule } from '@components/common/table-fab/table-fab.module';
import { ShowViewCostDirectiveModule } from '@directives/show/show-view-cost.directive';
import { MatDialogModule } from '@angular/material/dialog';
import { SelectProductLotModalComponent } from '@views/main/common/product-lot-details/select-product-lot-modal/select-product-lot-modal.component';
import { ModalBaseModule } from '@components/common/modals/modal-base/modal-base.module';
import { ButtonModule } from '@components/common/buttons/button/button.module';
import { ShowContractDirectiveModule } from '@directives/show/show-contract.directive';
import { TableBaseModule } from '@components/common/table-base/table-base.module';
import { OrderPdfTemplatesModule } from '@views/main/order/order-pdf-templates/order-pdf-templates.module';
import { RandomLengthProductModule } from '@views/main/common/random-length-product/random-length-product.module';

@NgModule({
  imports: [
    ValueLabelModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatTooltipModule,
    MatInputModule,
    MatDatepickerModule,
    MatSelectModule,
    MatDialogModule,
    CommonModule,
    PipesModule,
    DxDataGridModule,
    CopyTextButtonModule,
    MatIconModule,
    IconButtonModule,
    TableFabModule,
    ShowViewCostDirectiveModule,
    ShowContractDirectiveModule,
    ModalBaseModule,
    ButtonModule,
    TableBaseModule,
    OrderPdfTemplatesModule,
    RandomLengthProductModule
  ],
  exports: [ProductLotDetailsComponent],
  declarations: [ProductTableComponent, ProductLotDetailsComponent, SelectProductLotModalComponent]
})
export class ProductLotDetailsModule {}
