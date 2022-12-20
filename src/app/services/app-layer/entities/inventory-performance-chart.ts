import { Product } from '@services/data-layer/http-api/base-api/swagger-gen';
import { BuychainLibHelper } from '@services/helpers/utils/buychain-lib-helper';

export class InventoryPerformanceChartEntity {
  index: number;
  time: any;
  productList: Product[];
  sumOfMeasure = 0;
  sumOfCostBasis = 0;
  sumOfUnits = 0;
  avgTurnTime = 0;

  public init(dto) {
    Object.assign(this, dto);

    this.sumOfUnits = this.productList.length;

    let productsWithTurnTimeCount = 0;

    this.productList.forEach(product => {
      this.sumOfCostBasis += product.priceHistory?.costBasis || 0;
      this.sumOfMeasure += BuychainLibHelper.getUomValue(product.spec);
      const productTurnTime = this.getProductTurnTime(product);
      if (productTurnTime) {
        this.avgTurnTime += this.getProductTurnTime(product);
        productsWithTurnTimeCount++;
      }
    });
    if (productsWithTurnTimeCount) this.avgTurnTime /= productsWithTurnTimeCount;

    this.sumOfCostBasis = Math.round(this.sumOfCostBasis * 100) / 100;
    this.sumOfMeasure = Math.round(this.sumOfMeasure * 1000) / 1000;
    return this;
  }

  private getProductTurnTime(product: Product): number {
    if (!product.dateHistory?.purchaseDate || !product.dateHistory?.soldDate) return 0;

    const soleTime = new Date(product.dateHistory.soldDate);
    const purchaseTime = new Date(product.dateHistory.purchaseDate);
    return (soleTime.getTime() - purchaseTime.getTime()) / (1000 * 3600 * 24);
  }
}
