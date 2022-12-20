import { Injectable } from '@angular/core';
import { ProductsOfInterest } from '@services/app-layer/app-layer.enums';
import { Environment } from '@services/app-layer/app-layer.environment';
import { Country } from '@services/app-layer/entities/country';
import { RailCarrier } from '@services/app-layer/rail-carrier/rail-carrier.service';

@Injectable({
  providedIn: 'root'
})
export class ConstantDataHelperService {
  private data: {
    Countries: Country[];
    CurrencyCodes: string[];
    ProductsOfInterest: ProductsOfInterest[];
    RailCarriers: RailCarrier[];
    UiProducts: {
      unitPieceCount: string;
      productGroups: { name: string; imageUrl: string; products: any[] }[];
    };
  };

  load() {
    return import(
      /* webpackChunkName: "constant-data" */
      '@buychain/constant-data'
    )
      .then(data => (this.data = data['default']))
      .then(() => {
        Environment.setUiProducts(this.getUiProducts());
      });
  }

  getCountries() {
    return this.data.Countries;
  }

  getCurrencyCodes() {
    return this.data.CurrencyCodes;
  }

  getProductOfInterest() {
    return this.data.ProductsOfInterest;
  }

  getRailCarriers() {
    return this.data.RailCarriers;
  }

  getUiProducts() {
    return this.data.UiProducts;
  }
}
