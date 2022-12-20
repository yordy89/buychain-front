import { TransactionEntity, TallyUnitEntity } from './transaction';

export class InvoiceEntity extends TransactionEntity {
  availableTallyUnits: TallyUnitEntity[];

  init(dto) {
    Object.assign(this, dto);

    super.initBase(dto);

    this.sellerCompany = this.getSellerCompany();
    this.buyingCompany = this.getBuyingCompany();
    this.buyer = this.getBuyer();
    this.seller = this.getSeller();
    this.tallyUnits = this.getTallyUnits();
    this.tallyUnitsByLot = this.getTallyUnitsByLot();
    this.shipTo = this.getShipTo();
    this.billToLocation = this.getBillToLocation();
    this.billToContact = this.getBillToContact();
    this.deliveredPriceTotal = this.getDeliveredPriceTotal();
    this.shipDate = this.getShipDate();
    this.sellerName = this.getSellerName();
    this.buyerName = this.getBuyerName();
    this.market = this.getMarket();
    this.transportType = this.getTransportType();
    this.availableTallyUnits = this.costData.soldLots;
    this.hasCashTallyItem = this.checkIfHasCashTallyItem();

    return this;
  }

  protected getTallyUnits(): any[] {
    return this.costData.soldTally;
  }

  protected getTallyUnitsByLot(): TallyUnitEntity[] {
    return this.costData.soldLots;
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

    if (sellerData.crmData && sellerData.crmData.designatedSeller) {
      return sellerData.crmData.designatedSeller;
    }

    if (sellerData.onlineData && sellerData.onlineData.designatedSeller) {
      return sellerData.onlineData.designatedSeller;
    }

    throw new Error(`Buyer is missing. Tx id: ${this.id}`);
  }

  protected getBillToContact(): any {
    const buyerData = this.trackingData.buyerData;

    if (buyerData.onlineData && buyerData.onlineData.billToContact) return buyerData.onlineData.billToContact;
    if (buyerData.crmData && buyerData.crmData.billToContact) return buyerData.crmData.billToContact;
    return {};
  }

  protected getBillToLocation(): any {
    const buyerData = this.trackingData.buyerData;
    if (buyerData.onlineData && buyerData.onlineData.billToLocation) return buyerData.onlineData.billToLocation;
    if (buyerData.crmData && buyerData.crmData.billToLocation) return buyerData.crmData.billToLocation;
    return {};
  }

  protected getSellerCompany(): any {
    const sellerData = this.trackingData.sellerData;

    if (sellerData.onlineData && sellerData.onlineData.sellingCompany) return sellerData.onlineData.sellingCompany;
    return {};
  }

  protected getBuyingCompany(): any {
    const buyerData = this.trackingData.buyerData;

    if (buyerData.crmData && buyerData.crmData.buyingCompany) return buyerData.crmData.buyingCompany;
    return {};
  }
}
