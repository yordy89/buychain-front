export class Tooltips {
  private static inventoryTooltips = {
    specShorthand: 'Product specification',
    ownerId: 'Person who owns this product lot',
    state: 'Location of the product lot, either on order, on hand, in transit or sold',
    productsCount: 'The number of units in the product lot',
    allocated: 'Units in this product lot are part of an active order',
    permission:
      'Private: viable only to the owner of the product lot, Internal: visible to all users in the company, External: visible to customers and other users of BuyChain, this product lot will appear in your companies market place.',
    priceOfMerit:
      'The sales ask price of product based on the price system. For example is a product lot has a price system of USD/SQUARE-FEET the price of merit is the price per square foot.',
    shipWeekEstimate: 'A best estimate of the availability of the products in the product lot.',
    askPriceProductLot: 'The value of the product lot assuming it sells at the price of merit.',
    shipFromShortName:
      'Current location of the product. In the case of on order, in-transit it is the destination the inventory will ship to.',
    priceSystem: 'The currency and unit of measure used to describe this commodity. For example USD/M-BOARD-FEET',
    unitPieceCount:
      'The number of pieces of the product grouped into a single sellable unit. It maybe a count or a weight.',
    askPricePerUnit:
      'The price of merit times the measure of a unit in the product lot. For example a unit with 5 MBF and an ask price of 20 = 5*$20 = $100'
  };

  private static marketSearchTooltips = {
    specShorthand: 'Product specification',
    state: 'Location of the product lot, either on order, on hand, in transit or sold',
    units: 'The number of units in the product lot',
    priceOfMerit:
      'The sales ask price of product based on the price system. For example is a product lot has a price system of USD/SQUARE-FEET the price of merit is the price per square foot.',
    shipWeekEstimate: 'A best estimate of the availability of the products in the product lot.',
    shipFromShortName:
      'Current location of the product. In the case of on order, in-transit it is the destination the inventory will ship to.',
    priceSystem: 'The currency and unit of measure used to describe this commodity. For example USD/M-BOARD-FEET',
    unitPieceCount:
      'The number of pieces of the product grouped into a single sellable unit. It maybe a count or a weight.',
    'deliveryPricing.bestEstimate':
      'Best estimate of shipping cost based on rate tables, considering closest rate table entry destination.',
    'deliveryPricing.mbfCostPlusBestEstimate': 'Delivered cost assuming best shipping costs.',
    'deliveryPricing.min':
      'The least expensive shipping option based on rate tables. This may not be the best shipping method or destination.',
    'deliveryPricing.max': 'A worst case shipping cost, based on valid rate table entries.',
    askPricePerUnit:
      'The price of merit times the measure of a unit in the product lot. For example a unit with 5 MBF and an ask price of 20 = 5*$20 = $100'
  };

  private static transactionsTooltips = {
    shipDateInitial: 'The date we expected the transaction to ship.',
    type: 'Replaces with type - sales or purchase, is the user the seller or buyer (purchase) of this transaction.',
    shipFromName: 'Location the order originates from.',
    shipToName: 'Destination location for the order',
    totalPrice: 'The total material price plus shipping to be paid.',
    profit: 'The total price paid by the buyer, minus the costs incured by the seller.',
    margin: 'The profit as a percentage of the total value of the transaction.',
    discount: 'The amount off of the list price.',
    discountPercentage: 'The percent off from the list price of the product.',
    transportMethodType: 'The vehicle type doing the transport truck, rail etc,',
    transportMethodCarrier: 'The company that provides the transport',
    transportMethodRailcar: 'OPEN or CLOSED',
    transportNotes: 'Free form notes about the transaction.',
    state: 'The current status of the transaction.'
  };

  public static lumberColumns = [
    'lumberSeasoning',
    'lumberPattern',
    'lumberSpecies',
    'lumberSubspecies',
    'lumberGrade',
    'lumberSubGrade',
    'lumberCutType',
    'lumberThickness',
    'lumberLength',
    'lumberWidth'
  ];
  public static panelColumns = [
    'panelType',
    'panelSpecies',
    'panelSeasoning',
    'panelSeasoningChemical',
    'panelGrade',
    'panelFinish',
    'panelMfgProcess',
    'panelRating',
    'panelStandard',
    'panelThickness',
    'panelLength',
    'panelWidth',
    'panelPatternWidth'
  ];
  public static engineeredColumns = [
    'engineeredGrade',
    'engineeredType',
    'engineeredSeasoning',
    'engineeredThickness',
    'engineeredLength',
    'engineeredWidth',
    'engineeredDepth',
    'engineeredCertification',
    'engineeredClassification'
  ];

  static getInventoryTooltips(): any {
    return this.inventoryTooltips;
  }

  static getDeliveryPricingTooltips(): any {
    return {
      'deliveryPricing.bestEstimate':
        'Best estimate of shipping cost based on rate tables, considering closest rate table entry destination.',
      'deliveryPricing.mbfCostPlusBestEstimate': 'Delivered cost assuming best shipping costs.',
      'deliveryPricing.min':
        'The least expensive shipping option based on rate tables. This may not be the best shipping method or destination.',
      'deliveryPricing.max': 'A worst case shipping cost, based on valid rate table entries.',
      'deliveryPricing.avg': 'Average expected shipping cost, based on valid rate table entries.'
    };
  }

  static getNoDeliveryLocationTooltips(): any {
    const tooltipMessage = 'Please select a ship to location.';

    return {
      'deliveryPricing.bestEstimate': tooltipMessage,
      'deliveryPricing.mbfCostPlusBestEstimate': tooltipMessage,
      'deliveryPricing.min': tooltipMessage,
      'deliveryPricing.max': tooltipMessage,
      'deliveryPricing.avg': tooltipMessage
    };
  }

  static getInventoryNoProductTooltips(product: string): any {
    const object = {};
    let array = [];
    if (product === 'Lumber') array = this.lumberColumns;
    if (product === 'Panel') array = this.panelColumns;
    if (product === 'Engineered') array = this.engineeredColumns;
    array.forEach(key => (object[key] = `No ${product} products are filtered in grid.`));
    return object;
  }

  static getMarketSearchTooltips(): any {
    return this.marketSearchTooltips;
  }

  static getTransactionsTooltips(): any {
    return this.transactionsTooltips;
  }
}
