import { TransactionEntity, TallyUnitEntity } from './transaction';
import { RoleInTransaction } from '@services/app-layer/app-layer.enums';
import { Environment } from '@services/app-layer/app-layer.environment';

export class OrderConfirmationEntity extends TransactionEntity {
  availableTallyUnits: TallyUnitEntity[];
  creatorName: string;

  init(dto) {
    Object.assign(this, dto);

    super.initBase(dto);

    this.role = this.getRole();
    this.sellerCompany = this.getSellerCompany();
    this.buyingCompany = this.getBuyingCompany();
    this.buyer = this.getBuyer();
    this.seller = this.getSeller();
    this.shipFrom = this.getShipFrom();
    this.shipTo = this.getShipTo();
    this.billToContact = this.getBillToContact();
    this.billToLocation = this.getBillToLocation();
    this.market = this.getMarket();
    this.sellerName = this.getSellerName();
    this.buyerName = this.getBuyerName();
    this.availableTallyUnits = this.costData.soldLots;
    this.transportType = this.getTransportType();
    this.tallyUnitsByLot = this.getTallyUnitsByLot();
    this.tallyUnits = this.getTallyUnits();
    this.hasCashTallyItem = this.checkIfHasCashTallyItem();
    this.shipDate = this.getShipDate();
    this.deliveredPriceTotal = this.getDeliveredPriceTotal();
    this.tallyTotalWeight = this.getTallyTotalWeight();
    this.hasMixedUomTallyItem = this.checkIfHasMixedUomTallyItem();
    this.tallyTotalMeasureTemporary = this.getTallyTotalMeasureTemporary();
    this.measureLabel = this.getMeasureLabel();
    this.tallyTotalUnitsCount = this.getTallyTotalUnitsCount();
    this.creatorName = this.getCreatorName();
    return this;
  }

  protected getRole(): RoleInTransaction {
    const sellerData = this.trackingData?.sellerData?.onlineData?.sellingCompany?.name;
    const buyerData = this.trackingData?.buyerData?.onlineData?.buyingCompany.name;

    if (Environment.getCurrentCompany().name === sellerData) return RoleInTransaction.Seller;
    if (Environment.getCurrentCompany().name === buyerData) return RoleInTransaction.Buyer;
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

  protected getMarket(): string {
    const sellerData = this.trackingData.sellerData;
    const buyerData = this.trackingData.buyerData;

    const crmSeller = !!(sellerData.crmData && sellerData.crmData.sellingCompany);
    const crmBuyer = !!(buyerData.crmData && buyerData.crmData.buyingUser);

    const onlineSeller = !!(sellerData.onlineData && sellerData.onlineData.sellingCompany);
    const onlineBuyer = !!(buyerData.onlineData && buyerData.onlineData.buyingUser);

    if ((crmSeller && !onlineSeller) || (crmBuyer && !onlineBuyer)) {
      return 'Off Market';
    } else if (onlineSeller && onlineBuyer) {
      return 'On Market';
    } else {
      return '--';
    }
  }

  private getCreator(): any {
    // TODO This later will be renamed to creator
    return this.trackingData.creatorId;
  }

  private getCreatorName(): string {
    const creator = this.getCreator();
    return `${creator.firstName} ${creator.lastName}`;
  }

  protected getSellerCompany(): any {
    const sellerData = this.trackingData.sellerData;

    if (this.role === RoleInTransaction.Seller && sellerData.onlineData && sellerData.onlineData.sellingCompany) {
      return sellerData.onlineData.sellingCompany;
    }
    if (this.role === RoleInTransaction.Buyer && sellerData.crmData && sellerData.crmData.sellingCompany) {
      return sellerData.crmData.sellingCompany;
    }
    if (sellerData.onlineData && sellerData.onlineData.sellingCompany) return sellerData.onlineData.sellingCompany;
    if (sellerData.crmData && sellerData.crmData.sellingCompany) return sellerData.crmData.sellingCompany;
    return {};
  }

  protected getShipFrom(): any {
    const sellerData = this.trackingData.sellerData;

    if (this.role === RoleInTransaction.Seller && sellerData.onlineData && sellerData.onlineData.shipFrom) {
      return sellerData.onlineData.shipFrom;
    }
    if (this.role === RoleInTransaction.Buyer && sellerData.crmData && sellerData.crmData.shipFrom) {
      return sellerData.crmData.shipFrom;
    }
    if (sellerData.onlineData && sellerData.onlineData.shipFrom) return sellerData.onlineData.shipFrom;
    if (sellerData.crmData && sellerData.crmData.shipFrom) return sellerData.crmData.shipFrom;
    return {};
  }

  protected getSeller(): any {
    const sellerData = this.trackingData.sellerData;

    if (this.role === RoleInTransaction.Seller && sellerData.onlineData && sellerData.onlineData.designatedSeller) {
      return sellerData.onlineData.designatedSeller;
    }
    if (this.role === RoleInTransaction.Buyer && sellerData.crmData && sellerData.crmData.designatedSeller) {
      return sellerData.crmData.designatedSeller;
    }
    if (sellerData.onlineData && sellerData.onlineData.designatedSeller) return sellerData.onlineData.designatedSeller;
    if (sellerData.crmData && sellerData.crmData.designatedSeller) return sellerData.crmData.designatedSeller;
    return {};
  }
}
