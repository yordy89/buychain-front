//import { DeliveredPriceLib, UomLib, OfferLib, ProductLib, TallyLib, TransactionLib, FeeLib } from '@buychain/lib';

export class BuychainLibHelper {
  static getDeliveredPrice() {
    //const fraction = DeliveredPriceLib.getDeliveredPrice(tallyUnits, shippingCost, transportTerm);
    const fraction = null;
    return BuychainLibHelper.fractionToDecimal(fraction);
  }

  static getDeliveryCostPerUom() {
    //const fraction = DeliveredPriceLib.getDeliveryCostPerUom(tallyUnits, shippingCost);
    const fraction = null;
    return BuychainLibHelper.fractionToDecimal(fraction);
  }

  static getDeliveredPricePerUnit() {
    //const fraction = DeliveredPriceLib.getDeliveredPricePerUnit(tallyUnit, deliveryCostPerUom, transportTerm);
    const fraction = null;
    return BuychainLibHelper.fractionToDecimal(fraction);
  }

  static getDeliveredPricePerUom() {
    //const fraction = DeliveredPriceLib.getDeliveredPricePerUom(tallyUnit, deliveryCostPerUom, transportTerm);
    const fraction = null;
    return BuychainLibHelper.fractionToDecimal(fraction);
  }

  static getUomValue() {
    //const fraction = UomLib.getValue(spec);
    const fraction = null;
    return BuychainLibHelper.fractionToDecimal(fraction);
  }

  static getOfferPerUom() {
    //const fraction = OfferLib.getOfferPerUom(deliveredPricePerUom, deliveryCostPerUom, transportTerm);
    const fraction = null;
    return BuychainLibHelper.fractionToDecimal(fraction);
  }

  static sortBasedOnSelectionCriteria() {
    //return ProductLib.sortBasedOnSelectionCriteria(products, selectionCriteria);
    return null;
  }

  static getAskPrice() {
    //const fraction = ProductLib.getAskPrice(product);
    const fraction = null;
    return BuychainLibHelper.fractionToDecimal(fraction);
  }

  static getEstimatedProfit() {
    //const fraction = ProductLib.getEstimatedProfit(product);
    const fraction = null;
    return BuychainLibHelper.fractionToDecimal(fraction);
  }

  static getTransactionFee() {
    //const fraction = FeeLib.getTransactionFee(companyContract, tallyUnits, shippingCost, transportTerm);
    const fraction = null;
    return BuychainLibHelper.fractionToDecimal(fraction);
  }

  static getSellerProfit() {
    //const fraction = TransactionLib.getSellerProfit(tallyUnits, cogs);
    const fraction = null;
    return BuychainLibHelper.fractionToDecimal(fraction);
  }

  static getSellerMargin() {
    try {
      //const fraction = TransactionLib.getSellerMargin(tallyUnits, cogs, transportTerm, shippingCost);
      const fraction = null;
      return BuychainLibHelper.fractionToDecimal(fraction);
    } catch (e) {
      return 'n/a';
    }
  }

  static getDiscount() {
    //const fraction = TransactionLib.getDiscount(tallyUnits);
    const fraction = null;
    return BuychainLibHelper.fractionToDecimal(fraction);
  }

  static getDiscountPercentage() {
    //const fraction = TransactionLib.getDiscountPercentage(tallyUnits);
    const fraction = null;
    return BuychainLibHelper.fractionToDecimal(fraction);
  }

  static getShippingCostPayableByBuyer() {
    //const fraction = TransactionLib.getShippingCostPayableByBuyer(transportTerm, shippingCost);
    const fraction = null;
    return BuychainLibHelper.fractionToDecimal(fraction);
  }

  static getListPriceOfUnits() {
    //const fraction = TallyLib.getListPriceOfUnits(products);
    const fraction = null;
    return BuychainLibHelper.fractionToDecimal(fraction);
  }

  static getSalesPriceOfUnits() {
    //const fraction = TallyLib.getSalesPriceOfUnits(products);
    const fraction = null;
    return BuychainLibHelper.fractionToDecimal(fraction);
  }

  static getUomOfUnits() {
    //const fraction = TallyLib.getUomOfUnits(products);
    const fraction = null;
    return BuychainLibHelper.fractionToDecimal(fraction);
  }

  static getDiscountOfUnit() {
    //const fraction = TallyLib.getDiscountOfUnit(product);
    const fraction = null;
    return BuychainLibHelper.fractionToDecimal(fraction);
  }

  static getUomOfUnit() {
    //const fraction = TallyLib.getUomOfUnit(unit);
    const fraction = null;
    return BuychainLibHelper.fractionToDecimal(fraction);
  }

  static getListPriceOfUnit() {
    //const fraction = TallyLib.getListPriceOfUnit(product);
    const fraction = null;
    return BuychainLibHelper.fractionToDecimal(fraction);
  }

  static getCostBasisOfUnits() {
    //const fraction = TallyLib.getCostBasisOfUnits(product);
    const fraction = null;
    return BuychainLibHelper.fractionToDecimal(fraction);
  }

  static isSamePriceSystem() {
    //return TallyLib.isSamePriceSystem(units);
    return null;
  }

  private static fractionToDecimal(fraction: { _denominator: number; _numerator: number }) {
    return fraction._numerator / fraction._denominator;
  }
}
