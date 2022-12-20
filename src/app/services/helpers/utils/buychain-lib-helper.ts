import { DeliveredPriceLib, UomLib, OfferLib, ProductLib, TallyLib, TransactionLib, FeeLib } from '@buychain/lib';

export class BuychainLibHelper {
  static getDeliveredPrice(tallyUnits, shippingCost, transportTerm) {
    const fraction = DeliveredPriceLib.getDeliveredPrice(tallyUnits, shippingCost, transportTerm);
    return BuychainLibHelper.fractionToDecimal(fraction);
  }

  static getDeliveryCostPerUom(tallyUnits, shippingCost) {
    const fraction = DeliveredPriceLib.getDeliveryCostPerUom(tallyUnits, shippingCost);
    return BuychainLibHelper.fractionToDecimal(fraction);
  }

  static getDeliveredPricePerUnit(tallyUnit, deliveryCostPerUom, transportTerm) {
    const fraction = DeliveredPriceLib.getDeliveredPricePerUnit(tallyUnit, deliveryCostPerUom, transportTerm);
    return BuychainLibHelper.fractionToDecimal(fraction);
  }

  static getDeliveredPricePerUom(tallyUnit, deliveryCostPerUom, transportTerm) {
    const fraction = DeliveredPriceLib.getDeliveredPricePerUom(tallyUnit, deliveryCostPerUom, transportTerm);
    return BuychainLibHelper.fractionToDecimal(fraction);
  }

  static getUomValue(spec) {
    const fraction = UomLib.getValue(spec);
    return BuychainLibHelper.fractionToDecimal(fraction);
  }

  static getOfferPerUom(deliveredPricePerUom, deliveryCostPerUom, transportTerm) {
    const fraction = OfferLib.getOfferPerUom(deliveredPricePerUom, deliveryCostPerUom, transportTerm);
    return BuychainLibHelper.fractionToDecimal(fraction);
  }

  static sortBasedOnSelectionCriteria(products, selectionCriteria) {
    return ProductLib.sortBasedOnSelectionCriteria(products, selectionCriteria);
  }

  static getAskPrice(product) {
    const fraction = ProductLib.getAskPrice(product);
    return BuychainLibHelper.fractionToDecimal(fraction);
  }

  static getEstimatedProfit(product) {
    const fraction = ProductLib.getEstimatedProfit(product);
    return BuychainLibHelper.fractionToDecimal(fraction);
  }

  static getTransactionFee(companyContract, tallyUnits, shippingCost, transportTerm) {
    const fraction = FeeLib.getTransactionFee(companyContract, tallyUnits, shippingCost, transportTerm);
    return BuychainLibHelper.fractionToDecimal(fraction);
  }

  static getSellerProfit(tallyUnits, cogs) {
    const fraction = TransactionLib.getSellerProfit(tallyUnits, cogs);
    return BuychainLibHelper.fractionToDecimal(fraction);
  }

  static getSellerMargin(tallyUnits, cogs, transportTerm, shippingCost) {
    try {
      const fraction = TransactionLib.getSellerMargin(tallyUnits, cogs, transportTerm, shippingCost);
      return BuychainLibHelper.fractionToDecimal(fraction);
    } catch (e) {
      return 'n/a';
    }
  }

  static getDiscount(tallyUnits) {
    const fraction = TransactionLib.getDiscount(tallyUnits);
    return BuychainLibHelper.fractionToDecimal(fraction);
  }

  static getDiscountPercentage(tallyUnits) {
    const fraction = TransactionLib.getDiscountPercentage(tallyUnits);
    return BuychainLibHelper.fractionToDecimal(fraction);
  }

  static getShippingCostPayableByBuyer(transportTerm, shippingCost) {
    const fraction = TransactionLib.getShippingCostPayableByBuyer(transportTerm, shippingCost);
    return BuychainLibHelper.fractionToDecimal(fraction);
  }

  static getListPriceOfUnits(products) {
    const fraction = TallyLib.getListPriceOfUnits(products);
    return BuychainLibHelper.fractionToDecimal(fraction);
  }

  static getSalesPriceOfUnits(products) {
    const fraction = TallyLib.getSalesPriceOfUnits(products);
    return BuychainLibHelper.fractionToDecimal(fraction);
  }

  static getUomOfUnits(products) {
    const fraction = TallyLib.getUomOfUnits(products);
    return BuychainLibHelper.fractionToDecimal(fraction);
  }

  static getDiscountOfUnit(product) {
    const fraction = TallyLib.getDiscountOfUnit(product);
    return BuychainLibHelper.fractionToDecimal(fraction);
  }

  static getUomOfUnit(unit) {
    const fraction = TallyLib.getUomOfUnit(unit);
    return BuychainLibHelper.fractionToDecimal(fraction);
  }

  static getListPriceOfUnit(product) {
    const fraction = TallyLib.getListPriceOfUnit(product);
    return BuychainLibHelper.fractionToDecimal(fraction);
  }

  static getCostBasisOfUnits(product) {
    const fraction = TallyLib.getCostBasisOfUnits(product);
    return BuychainLibHelper.fractionToDecimal(fraction);
  }

  static isSamePriceSystem(units) {
    return TallyLib.isSamePriceSystem(units);
  }

  private static fractionToDecimal(fraction: { _denominator: number; _numerator: number }) {
    return fraction._numerator / fraction._denominator;
  }
}
