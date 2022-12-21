//import { DeliveredPriceLib, UomLib, OfferLib, ProductLib, TallyLib, TransactionLib, FeeLib } from '@buychain/lib';

export class BuychainLibHelper {
  static getDeliveredPrice(tallyUnits, shippingCost, transportTerm) {
    //const fraction = DeliveredPriceLib.getDeliveredPrice(tallyUnits, shippingCost, transportTerm);
    const fraction = null
    return BuychainLibHelper.fractionToDecimal(fraction);
  }

  static getDeliveryCostPerUom(tallyUnits, shippingCost) {
    //const fraction = DeliveredPriceLib.getDeliveryCostPerUom(tallyUnits, shippingCost);
    const fraction = null
    return BuychainLibHelper.fractionToDecimal(fraction);
  }

  static getDeliveredPricePerUnit(tallyUnit, deliveryCostPerUom, transportTerm) {
    //const fraction = DeliveredPriceLib.getDeliveredPricePerUnit(tallyUnit, deliveryCostPerUom, transportTerm);
    const fraction = null
    return BuychainLibHelper.fractionToDecimal(fraction);
  }

  static getDeliveredPricePerUom(tallyUnit, deliveryCostPerUom, transportTerm) {
    //const fraction = DeliveredPriceLib.getDeliveredPricePerUom(tallyUnit, deliveryCostPerUom, transportTerm);
    const fraction = null
    return BuychainLibHelper.fractionToDecimal(fraction);
  }

  static getUomValue(spec) {
    //const fraction = UomLib.getValue(spec);
    const fraction = null
    return BuychainLibHelper.fractionToDecimal(fraction);
  }

  static getOfferPerUom(deliveredPricePerUom, deliveryCostPerUom, transportTerm) {
    //const fraction = OfferLib.getOfferPerUom(deliveredPricePerUom, deliveryCostPerUom, transportTerm);
    const fraction = null
    return BuychainLibHelper.fractionToDecimal(fraction);
  }

  static sortBasedOnSelectionCriteria(products, selectionCriteria) {
    //return ProductLib.sortBasedOnSelectionCriteria(products, selectionCriteria);
    return null
  }

  static getAskPrice(product) {
    //const fraction = ProductLib.getAskPrice(product);
    const fraction = null
    return BuychainLibHelper.fractionToDecimal(fraction);
  }

  static getEstimatedProfit(product) {
    //const fraction = ProductLib.getEstimatedProfit(product);
    const fraction = null
    return BuychainLibHelper.fractionToDecimal(fraction);
  }

  static getTransactionFee(companyContract, tallyUnits, shippingCost, transportTerm) {
    //const fraction = FeeLib.getTransactionFee(companyContract, tallyUnits, shippingCost, transportTerm);
    const fraction = null
    return BuychainLibHelper.fractionToDecimal(fraction);
  }

  static getSellerProfit(tallyUnits, cogs) {
    //const fraction = TransactionLib.getSellerProfit(tallyUnits, cogs);
    const fraction = null
    return BuychainLibHelper.fractionToDecimal(fraction);
  }

  static getSellerMargin(tallyUnits, cogs, transportTerm, shippingCost) {
    try {
      //const fraction = TransactionLib.getSellerMargin(tallyUnits, cogs, transportTerm, shippingCost);
      const fraction = null
      return BuychainLibHelper.fractionToDecimal(fraction);
    } catch (e) {
      return 'n/a';
    }
  }

  static getDiscount(tallyUnits) {
    //const fraction = TransactionLib.getDiscount(tallyUnits);
    const fraction = null
    return BuychainLibHelper.fractionToDecimal(fraction);
  }

  static getDiscountPercentage(tallyUnits) {
    //const fraction = TransactionLib.getDiscountPercentage(tallyUnits);
    const fraction = null
    return BuychainLibHelper.fractionToDecimal(fraction);
  }

  static getShippingCostPayableByBuyer(transportTerm, shippingCost) {
    //const fraction = TransactionLib.getShippingCostPayableByBuyer(transportTerm, shippingCost);
    const fraction = null
    return BuychainLibHelper.fractionToDecimal(fraction);
  }

  static getListPriceOfUnits(products) {
    //const fraction = TallyLib.getListPriceOfUnits(products);
    const fraction = null
    return BuychainLibHelper.fractionToDecimal(fraction);
  }

  static getSalesPriceOfUnits(products) {
    //const fraction = TallyLib.getSalesPriceOfUnits(products);
    const fraction = null
    return BuychainLibHelper.fractionToDecimal(fraction);
  }

  static getUomOfUnits(products) {
    //const fraction = TallyLib.getUomOfUnits(products);
    const fraction = null
    return BuychainLibHelper.fractionToDecimal(fraction);
  }

  static getDiscountOfUnit(product) {
    //const fraction = TallyLib.getDiscountOfUnit(product);
    const fraction = null
    return BuychainLibHelper.fractionToDecimal(fraction);
  }

  static getUomOfUnit(unit) {
    //const fraction = TallyLib.getUomOfUnit(unit);
    const fraction = null
    return BuychainLibHelper.fractionToDecimal(fraction);
  }

  static getListPriceOfUnit(product) {
    //const fraction = TallyLib.getListPriceOfUnit(product);
    const fraction = null
    return BuychainLibHelper.fractionToDecimal(fraction);
  }

  static getCostBasisOfUnits(product) {
    //const fraction = TallyLib.getCostBasisOfUnits(product);
    const fraction = null
    return BuychainLibHelper.fractionToDecimal(fraction);
  }

  static isSamePriceSystem(units) {
    //return TallyLib.isSamePriceSystem(units);
    return null
  }

  private static fractionToDecimal(fraction: { _denominator: number; _numerator: number }) {
    return fraction._numerator / fraction._denominator;
  }
}
