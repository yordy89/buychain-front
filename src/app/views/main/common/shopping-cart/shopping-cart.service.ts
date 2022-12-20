import { Injectable } from '@angular/core';
import { InventorySearchEntity, InventoryStreamlineEntity } from '@services/app-layer/entities/inventory-search';
import { NotificationHelperService } from '@services/helpers/notification-helper/notification-helper.service';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ShoppingCartService {
  masterViewCartUnits$: BehaviorSubject<InventorySearchEntity[]> = new BehaviorSubject<InventorySearchEntity[]>([]);
  productViewCartUnits$: BehaviorSubject<InventoryStreamlineEntity[]> = new BehaviorSubject<
    InventoryStreamlineEntity[]
  >([]);

  constructor(private notificationHelperService: NotificationHelperService) {}

  setCartUnitsForMasterView(lotsList: InventorySearchEntity[]): void {
    this.masterViewCartUnits$.next(lotsList);
  }

  addCartUnitsForMasterView(lotsList: InventorySearchEntity[]): void {
    const toAdd = lotsList.filter(lot => !this.masterViewCartUnits$.getValue().some(unit => unit.lotId === lot.lotId));
    if (!toAdd?.length) return this.notificationHelperService.showValidation('The selected lots are already in cart');
    if (toAdd.length < lotsList.length) {
      this.notificationHelperService.showValidation(
        `${toAdd.length} of ${lotsList.length} lots has been added to cart. The rest was already in.`
      );
    }
    this.masterViewCartUnits$.next([...this.masterViewCartUnits$.getValue(), ...toAdd]);
  }

  resetMasterViewCartUnits(): void {
    this.masterViewCartUnits$.next([]);
  }

  setCartUnitsForProductView(units: InventoryStreamlineEntity[]): void {
    this.productViewCartUnits$.next(units);
  }

  addCartUnitsForProductView(itemsList: InventoryStreamlineEntity[]): void {
    const toAdd = itemsList.filter(
      entry => !this.productViewCartUnits$.getValue().some(unit => unit.specShorthand === entry.specShorthand)
    );
    if (!toAdd?.length)
      return this.notificationHelperService.showValidation('The selected entries are already in cart');
    if (toAdd.length < itemsList?.length) {
      this.notificationHelperService.showValidation(
        `${toAdd.length} of ${itemsList.length} lots has been added to cart. The rest was already in.`
      );
    }
    this.productViewCartUnits$.next([...this.productViewCartUnits$.getValue(), ...toAdd]);
  }

  resetProductViewCartUnits(): void {
    this.productViewCartUnits$.next([]);
  }
}
