import { ProductPurchaseMethod } from '@services/app-layer/app-layer.enums';
import { ProductEntity } from '@services/app-layer/entities/inventory-search';
import { ProductsHelper } from '@services/app-layer/products/products-helper';
import { ProductSpec } from '@services/data-layer/http-api/base-api/swagger-gen';
import { TransformHelper } from '@services/helpers/utils/transform-helper';
import { startOfDay } from 'date-fns';

export interface ProductSpecExtended extends ProductSpec {
  specShorthand: string;
}

export class ProductLotSearchBase {
  lotId: string;
  lotShortId: string;
  spec: ProductSpecExtended;
  specShorthand: string;
  products: ProductEntity[];
  shipWeekEstimate: Date;
  permission: string;
  priceOfMerit: number;
  shipFromId: string;
  shipFromShortName: string;
  ownerId: string;
  availableProductsCount: number;
  hasAvailableProducts: boolean;
  availableProducts: ProductEntity[];
  hasAllocatedProducts: boolean;
  allocatedProductsCount: number;
  productsCount: number;
  averageCostBasis: number;
  avgCostBasisPerUom: number;
  totalCostBasis: number;
  askPricePerUnit: number;
  askPriceProductLot: number;
  profitProductLot: number;
  inventoryType: string;
  isRandomLengthLot: boolean;

  init(item: any) {
    this.lotId = item.lot;
    this.lotShortId = TransformHelper.getShortHexGuid(this.lotId);
    this.spec = { ...item.spec, specShorthand: item.specShorthand };
    this.specShorthand = item.specShorthand;

    this.products = (item.products || []).map(p => new ProductEntity().init(p));
    this.isRandomLengthLot = this.products.some(p => p.isRandomLengthProduct);

    this.inventoryType = this.getInventoryType();

    this.computeProductsCount();

    return this;
  }

  protected initDataFromFirstUnit() {
    const sampleProduct = this.products[0];

    this.permission = sampleProduct.permission;
    this.priceOfMerit = sampleProduct.salesData.priceOfMerit;
    this.shipWeekEstimate = sampleProduct.salesData.shipWeekEstimate
      ? startOfDay(new Date(sampleProduct.salesData.shipWeekEstimate))
      : null;

    this.shipFromId = sampleProduct.onlineData?.shipFromId;
    this.shipFromShortName = sampleProduct.onlineData?.shipFromShortName;
    this.ownerId = sampleProduct.owner;

    this.totalCostBasis = this.products.reduce((acc, cur) => acc + cur.costBasis, 0);
    this.averageCostBasis = this.productsCount ? this.totalCostBasis / this.productsCount : 0;
    this.avgCostBasisPerUom = ProductsHelper.calcAvgCostBasisPerUom(
      this.spec,
      this.totalCostBasis,
      this.products.length
    );
    this.askPricePerUnit = ProductsHelper.getAskPricePerUnit(sampleProduct);
    this.askPriceProductLot = ProductsHelper.getAskPriceTotal(this.products);
    this.profitProductLot = ProductsHelper.calcProfitTotal(this.products);
  }

  private computeProductsCount() {
    this.productsCount = this.products.length;
    this.availableProducts = this.products.filter(
      p => !p.isAllocated && (!p.isRandomLengthProduct || p.isLengthUnitsFixed)
    );
    this.availableProductsCount = this.availableProducts.length;
    this.hasAvailableProducts = !!this.availableProductsCount;
    this.hasAllocatedProducts = this.products.some(p => p.isAllocated);
    this.allocatedProductsCount = this.products.filter(p => p.isAllocated).length;
  }

  private getInventoryType() {
    const allContracts = this.products.every(item => item.inventoryType === ProductPurchaseMethod.CONTRACT);

    if (allContracts) {
      return ProductPurchaseMethod.CONTRACT;
    }

    const allCash = this.products.every(item => item.inventoryType === ProductPurchaseMethod.CASH);

    if (allCash) {
      return ProductPurchaseMethod.CASH;
    }

    return ProductPurchaseMethod.MIXED;
  }
}
