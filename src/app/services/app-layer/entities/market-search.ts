import { ProductsHelper } from '@services/app-layer/products/products-helper';
import { startOfDay } from 'date-fns';
import { ProductSpecExtended } from '@services/app-layer/entities/product';

export class MarketSearchEntity {
  spec: ProductSpecExtended;
  specShorthand: string;
  cutShorthand: string;
  organizationId: string;
  organizationName: string;
  shipFromId: string;
  shipFromShortName: string;

  lotId: string;

  units: number;
  availableProductsCount: number;
  hasAvailableProducts: boolean;
  products: any[];

  priceOfMerit: number;
  shipWeekEstimate: Date;
  askPricePerUnit: number;

  deliveryPricing?: any;

  size: number;

  public init(marketItem: any) {
    this.spec = { ...marketItem.spec, specShorthand: marketItem.specShorthand };
    this.specShorthand = marketItem.specShorthand;
    this.cutShorthand = this.getCutShorthand();
    this.size = this.getSize();
    this.products = marketItem.products;
    const sampleProduct = marketItem.products[0];
    this.organizationId = sampleProduct.organizationId;
    this.organizationName = sampleProduct.organizationName;
    this.shipFromId = sampleProduct.shipFromId;
    this.shipFromShortName = sampleProduct.shipFromShortName;

    this.lotId = marketItem.lot;

    this.units = marketItem.products?.length || 0;
    this.availableProductsCount = this.units;
    this.hasAvailableProducts = !!this.availableProductsCount;
    this.priceOfMerit = sampleProduct.salesData.priceOfMerit;
    this.shipWeekEstimate = sampleProduct.salesData?.shipWeekEstimate
      ? new Date(sampleProduct.salesData.shipWeekEstimate)
      : null;
    if (this.shipWeekEstimate) this.shipWeekEstimate = startOfDay(this.shipWeekEstimate);
    sampleProduct.spec = this.spec;
    this.askPricePerUnit = ProductsHelper.getAskPricePerUnit(sampleProduct);

    ProductsHelper.setSpecs(this, this.spec);

    return this;
  }

  /*
   * private helpers
   */

  private getSize(): number {
    return this.spec.thickness && this.spec.width ? this.spec.thickness.value * this.spec.width.value : 0;
  }

  private getCutShorthand(): string {
    return this.spec.thickness && this.spec.width ? `${this.spec.thickness.name}x${this.spec.width.name}` : '';
  }
}
