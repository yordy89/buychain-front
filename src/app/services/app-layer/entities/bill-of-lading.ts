import { TransactionEntity, TallyUnitEntity } from './transaction';

export class BillOfLadingEntity extends TransactionEntity {
  availableTallyUnits: TallyUnitEntity[];

  init(dto) {
    Object.assign(this, dto);

    super.initBase(dto);

    this.buyer = this.getBuyer();
    this.seller = this.getSeller();
    this.sellerCompany = this.getSellerCompany();
    this.tallyUnits = this.getTallyUnits();
    this.tallyUnitsByLot = this.getTallyUnitsByLot();
    this.shipTo = this.getShipTo();
    this.shipFrom = this.getShipFrom();
    this.availableTallyUnits = this.costData.soldLots;
    this.measureLabel = this.getMeasureLabel();
    this.tallyMeasurePerPriceSystem = this.getTallyMeasurePerPriceSystem();
    this.tallyTotalMeasure = this.getTallyTotalMeasure();
    this.transportType = this.getTransportType();
    this.transportNotes = this.getTransportNotes();

    return this;
  }

  protected getTallyUnits(): any[] {
    return this.costData.soldTally;
  }

  protected getTallyUnitsByLot(): TallyUnitEntity[] {
    return this.costData.soldLots;
  }

  protected getBuyingCompany(): any {
    const buyerData = this.trackingData.buyerData;

    if (buyerData.crmData && buyerData.crmData.buyingCompany) {
      return buyerData.crmData.buyingCompany;
    }

    if (buyerData.onlineData && buyerData.onlineData.buyingCompany) {
      return buyerData.onlineData.buyingCompany;
    }

    throw new Error(`Buying company is missing. Tx id: ${this.id}`);
  }

  protected getShipTo(): any {
    const buyerData = this.trackingData.buyerData;

    if (buyerData.crmData && buyerData.crmData.shipTo) {
      return buyerData.crmData.shipTo;
    }

    if (buyerData.onlineData && buyerData.onlineData.shipTo) {
      return buyerData.onlineData.shipTo;
    }

    throw new Error(`ShipTo is missing. Tx id: ${this.id}`);
  }

  protected getShipFrom(): any {
    const sellerData = this.trackingData.sellerData;

    if (sellerData.crmData && sellerData.crmData.shipFrom) {
      return sellerData.crmData.shipFrom;
    }

    if (sellerData.onlineData && sellerData.onlineData.shipFrom) {
      return sellerData.onlineData.shipFrom;
    }

    throw new Error(`ShipFrom is missing. Tx id: ${this.id}`);
  }

  protected getBuyer() {
    const buyerData = this.trackingData.buyerData;

    if (buyerData.crmData && buyerData.crmData.buyingUser) {
      return buyerData.crmData.buyingUser;
    }

    if (buyerData.onlineData && buyerData.onlineData.buyingUser) {
      return buyerData.onlineData.buyingUser;
    }

    throw new Error(`Buyer is missing. Tx id: ${this.id}`);
  }

  protected getSeller() {
    const sellerData = this.trackingData.sellerData;

    if (sellerData.onlineData && sellerData.onlineData.designatedSeller) {
      return sellerData.onlineData.designatedSeller;
    }
    if (sellerData.crmData && sellerData.crmData.designatedSeller) {
      return sellerData.crmData.designatedSeller;
    }

    throw new Error(`Seller is missing. Tx id: ${this.id}`);
  }
}
