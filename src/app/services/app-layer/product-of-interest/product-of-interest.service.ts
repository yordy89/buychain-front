import { Injectable } from '@angular/core';
import { ProductsOfInterest } from '@services/app-layer/app-layer.enums';
import { ConstantDataHelperService } from '@services/helpers/constant-data-helper/constant-data-helper.service';

@Injectable({
  providedIn: 'root'
})
export class ProductsOfInterestService {
  constructor(private constantDataHelperService: ConstantDataHelperService) {}

  getProductsOfInterestList(): ProductsOfInterest[] {
    return this.constantDataHelperService.getProductOfInterest().sort((a, b) => (a.name < b.name ? -1 : 1));
  }
}
