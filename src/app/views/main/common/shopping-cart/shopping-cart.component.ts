import { Component, Input, OnInit } from '@angular/core';
import { InventoryViewEnum } from '@services/app-layer/app-layer.enums';
import { InventoryHelperService } from '@views/main/common/inventory/inventory.helper.service';
import { BulkAddToOrderModalComponent } from '@views/main/common/modals/bulk-add-to-order-modal/bulk-add-to-order-modal.component';
import { MemberEntity } from '@services/app-layer/entities/member';
import { MatDialog } from '@angular/material/dialog';
import { NavigationHelperService } from '@services/helpers/navigation-helper/navigation-helper.service';
import { InventorySearchEntity } from '@services/app-layer/entities/inventory-search';
import { ShoppingCartService } from '@views/main/common/shopping-cart/shopping-cart.service';

@Component({
  selector: 'app-shopping-cart',
  templateUrl: './shopping-cart.component.html'
})
export class ShoppingCartComponent implements OnInit {
  @Input() inventoryView: InventoryViewEnum;
  @Input() membersList: MemberEntity[] = [];

  unitsInCart: any[] = [];

  constructor(
    private inventoryHelperService: InventoryHelperService,
    private navigationService: NavigationHelperService,
    private shoppingCartService: ShoppingCartService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.inventoryView === InventoryViewEnum.MasterView
      ? this.shoppingCartService.masterViewCartUnits$.subscribe(units => (this.unitsInCart = units))
      : this.shoppingCartService.productViewCartUnits$.subscribe(units => (this.unitsInCart = units));
  }

  openBulkAddToOrder(): void {
    this.dialog
      .open(BulkAddToOrderModalComponent, {
        width: '1500px',
        disableClose: true,
        data: {
          productLots:
            this.inventoryView === InventoryViewEnum.MasterView
              ? this.unitsInCart
              : this.getLotsFromProductViewEntries(),
          membersList: this.membersList,
          cartType: this.inventoryView
        }
      })
      .afterClosed()
      .subscribe(txId => {
        if (txId) this.navigationService.navigateToTransactionById(txId);
      });
  }

  clearCart(): void {
    this.inventoryView === InventoryViewEnum.MasterView
      ? this.shoppingCartService.resetMasterViewCartUnits()
      : this.shoppingCartService.resetProductViewCartUnits();
  }

  private getLotsFromProductViewEntries(): InventorySearchEntity[] {
    const products = this.unitsInCart.reduce((acc, cur) => [...acc, ...cur.products], []);
    return this.inventoryHelperService.normalizeInventoryData(products);
  }
}
