import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { RouterModule } from '@angular/router';
import { ShowContractDirectiveModule } from '@directives/show/show-contract.directive';
import { BulkAddToOrderModalModule } from '@views/main/common/modals/bulk-add-to-order-modal/bulk-add-to-order-modal.module';
import { BulkEditProductLotModalModule } from '@views/main/common/modals/bulk-edit-product-lot-modal/bulk-edit-product-lot-modal.module';
import { CloseContractModalModule } from '@views/main/common/modals/close-contract-modal/close-contract-modal.module';
import { inventoryRoutes } from '@views/main/inventory/inventory.routing';
import { InventoryOverviewComponent } from '@views/main/inventory/inventory-overview/inventory-overview.component';
import {
  DxBulletModule,
  DxDataGridModule,
  DxListModule,
  DxRadioGroupModule,
  DxTemplateModule,
  DxTreeViewModule
} from 'devextreme-angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PipesModule } from '@pipes/pipes.module';
import { BookmarkModule } from '@views/main/common/bookmark/bookmark.module';
import { InventorySearchModule } from '@views/main/common/inventory/inventory-search/inventory-search.module';
import { EditProductLotModalModule } from '@views/main/common/modals/edit-product-lot-modal/edit-product-lot-modal.module';
import { AddTallyUnitModalModule } from '@views/main/common/modals/add-tally-unit-modal/add-tally-unit-modal.module';
import { ProductLotDetailsPageComponent } from './inventory-overview/product-lot-details-page/product-lot-details-page.component';
import { ProductLotDetailsModule } from '@views/main/common/product-lot-details/product-lot-details.module';
import { MatDialogModule } from '@angular/material/dialog';
import { ButtonModule } from '@components/common/buttons/button/button.module';
import { MatCardModule } from '@angular/material/card';
import { InventoryStreamlineModule } from '@views/main/common/inventory/inventory-streamline/inventory-streamline.module';

@NgModule({
  imports: [
    CommonModule,
    DxDataGridModule,
    DxTemplateModule,
    DxBulletModule,
    DxTreeViewModule,
    DxRadioGroupModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    MatSelectModule,
    MatButtonModule,
    MatCheckboxModule,
    FormsModule,
    MatInputModule,
    MatMenuModule,
    MatIconModule,
    MatDialogModule,
    DxListModule,
    PipesModule,
    BookmarkModule,
    InventorySearchModule,
    EditProductLotModalModule,
    AddTallyUnitModalModule,
    RouterModule.forChild(inventoryRoutes),
    BulkEditProductLotModalModule,
    BulkAddToOrderModalModule,
    ProductLotDetailsModule,
    ButtonModule,
    MatCardModule,
    CloseContractModalModule,
    InventoryStreamlineModule,
    ShowContractDirectiveModule
  ],
  declarations: [InventoryOverviewComponent, ProductLotDetailsPageComponent],
  bootstrap: [InventoryOverviewComponent]
})
export class InventoryModule {}
