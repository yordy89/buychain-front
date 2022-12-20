import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { first, map } from 'rxjs/operators';
import { BaseApiService } from '@app/services/data-layer/http-api/base-api/base-api.service';
import { ProductLotPermissionEnum } from '@services/app-layer/app-layer.enums';

@Injectable({
  providedIn: 'root'
})
export class ProductsService {
  constructor(private baseApi: BaseApiService) {}

  public addProductsBulk(quantity: number, product): Observable<any> {
    const payload = { quantity, product };
    return this.baseApi.products.addProductsBulk(payload).pipe(
      first(),
      map(dto => dto) // TODO entity
    );
  }

  public updateLotsOwnerBulk(ids: string[], owner: string) {
    return this.baseApi.products.updateProductsOwnerBulk({ lots: ids, owner }).pipe(first());
  }
  public updateLotsPermissionBulk(ids: string[], permission: ProductLotPermissionEnum) {
    return this.baseApi.products.updateProductsPermissionBulk({ lots: ids, permission }).pipe(first());
  }
  public updateLotsSalesNotesBulk(ids: string[], salesNotes: string) {
    return this.baseApi.products.updateProductsSalesNotesBulk({ lots: ids, salesNotes }).pipe(first());
  }
  public updateLotsPriceOfMeritBulk(ids: string[], priceOfMerit: number) {
    return this.baseApi.products.updateProductsSalesDataPriceOfMeritBulk({ lots: ids, priceOfMerit }).pipe(first());
  }
  public updateLotsShipWeekEstimateBulk(ids: string[], shipWeekEstimate: Date) {
    return this.baseApi.products
      .updateProductsSalesDataShipWeekEstimateBulk({ lots: ids, shipWeekEstimate })
      .pipe(first());
  }
  public updateProductLot(productId: string, targetLotId: string) {
    return this.baseApi.products.updateProductLot(productId, { lot: targetLotId }).pipe(first());
  }
  public splitProductFromLot(productId: string) {
    return this.baseApi.products.addProductLot(productId).pipe(first());
  }
  public updateProductContract(productId: string, contractPrice: number) {
    return this.baseApi.products.updateProductContract(productId, { contractPrice }).pipe(first());
  }
  public updateProductSpecLengthUnits(productId: string, lengthUnitsPayload: any[]) {
    const payload = { lengthUnits: lengthUnitsPayload };
    return this.baseApi.products.updateProductSpecLengthUnits(productId, payload as any).pipe(first());
  }
}
