import { Badge } from '@app/constants';
import { BaseLog } from '@app/models';
import { BuychainLibHelper } from '@services/helpers/utils/buychain-lib-helper';
import { ObjectUtil } from '@services/helpers/utils/object-util';
import { TransformHelper } from '@services/helpers/utils/transform-helper';
import { RailRestriction, TransportMethodType } from './facility';
import {
  Product,
  ProductSpec,
  ProductsUpdatePermissionBulkPayload,
  TransactionCostDataCostOfGood,
  TransactionRegister,
  TransactionTrackingDataSellerDataOnlineOrCrmDataPopulated,
  TransactionTransactionalJournalEntryPopulated,
  TransportMethodEmbeddedInTrackingData
} from '../../data-layer/http-api/base-api/swagger-gen';
import {
  ChangeTransactionTypesEnum,
  CogTypeEnum,
  ContractStateEnum,
  MessageType,
  PriceSystem,
  ProductPurchaseMethod,
  ProductStateEnum,
  RoleInTransaction,
  TransactionStateEnum,
  TransactionTypeEnum,
  TransportTermEnum
} from '../app-layer.enums';
import { TypeCheck } from '@services/helpers/utils/type-check';
import { Environment } from '@services/app-layer/app-layer.environment';
import { TransactionCostData } from '@app/services/data-layer/http-api/base-api/swagger-gen/model/transactionCostData';
import { SpecHelper } from '@services/helpers/utils/spec-helper';
import { User } from '@app/services/app-layer/entities/user';
import { isValid, startOfDay } from 'date-fns';
import PriceSystemEnum = ProductSpec.PriceSystemEnum;
import PermissionEnum = ProductsUpdatePermissionBulkPayload.PermissionEnum;
import { ProductsHelper } from '@services/app-layer/products/products-helper';

export class TallyUnitEntity {
  lot: string;
  products: any[] = []; // Product[];
  unitProducts: Product[];

  qty: number;

  unitMeasure: number;
  unitWeight: number;
  measureLabel: string;
  specShorthand: string;
  productGroup: string;
  permission: PermissionEnum;
  countByStates: { state: ProductStateEnum; count: number }[];
  allocatedTransactionIds: string[];
  sampleProduct: Product;
  unitTotalListPrice: number;
  offer: number;
  contract: any;
  shipWeekEstimate: Date;
  ownerId: string;
  unitTotalSalesPrice: number;
  unitTotalMeasure: number;
  isOffBook: boolean;
  shipFromId: string;
  isRandomLengthUnit: boolean;
  hasOutstandingProducts: boolean;
  hasAllocatedProducts: boolean;
  isRequiredQtyAvailable: boolean;
  unitTotalCostBasis: number;
  avgCostBasisOfUnitPerUom: number;
  priceOfMerit: number;
  purchaseMethod: ProductPurchaseMethod;
  discountPerUnit: number;
  margin: number;
  profitPerUom: number;
  profitPerLine: number;
  totalWeight: number;
  listPricePerProduct: number;
  offerOrListPricePerProduct: number;
  isContractPurchaseMethod: boolean;

  init(dto): TallyUnitEntity {
    Object.assign(this, dto);

    this.initProductsRelatedData();
    this.initUnitProductsRelatedData();
    this.initSampleProductRelatedData();

    this.unitWeight = this.getUnitWeight();
    this.ownerId = this.getOwnerId();
    this.avgCostBasisOfUnitPerUom = this.unitTotalCostBasis / this.unitTotalMeasure; // used in tally component dx grid
    this.purchaseMethod = this.contract ? ProductPurchaseMethod.CONTRACT : ProductPurchaseMethod.CASH;
    this.discountPerUnit = this.getDiscountPerUnit();
    this.margin = this.getMargin();
    this.profitPerUom = this.getProfitPerUom();
    this.profitPerLine = this.getProfitPerLine();
    this.totalWeight = this.getTotalWeight();
    this.offerOrListPricePerProduct = this.getOfferOrListPricePerProduct();
    this.isContractPurchaseMethod = this.purchaseMethod === ProductPurchaseMethod.CONTRACT;

    return this;
  }

  private initProductsRelatedData() {
    this.qty = this.products.length;
    this.unitProducts = this.products.map(p => p.product);
    this.unitMeasure = this.getUnitMeasurePerProduct();
    this.unitTotalListPrice = this.getListPriceOfUnits();
    this.offer = this.getOffer();
    this.contract = this.getContract();
    this.shipWeekEstimate = this.getShipWeekEstimate();
    this.unitTotalSalesPrice = BuychainLibHelper.getSalesPriceOfUnits(this.products);
    this.unitTotalMeasure = BuychainLibHelper.getUomOfUnits(this.products);
    this.hasOutstandingProducts = this.isAvailableOutstandingProducts();
    this.hasAllocatedProducts = this.products.some(p => !!p.product.allocatedTransactionId);
    this.unitTotalCostBasis = this.getCostBasisOfUnits();
    this.listPricePerProduct = this.getListPricePerProduct();
  }

  private initUnitProductsRelatedData() {
    this.sampleProduct = this.getSampleProduct();
    this.countByStates = this.getCountsByStates();
    this.allocatedTransactionIds = this.getAllocatedTransactionIds();
    this.isRequiredQtyAvailable = this.checkIfRequiredQtyAvailable();
  }

  private initSampleProductRelatedData() {
    this.measureLabel = this.getMeasureLabel();
    this.specShorthand = this.getSpecShorthand();
    this.productGroup = this.getProductGroup();
    this.permission = this.sampleProduct?.permission;
    this.isOffBook = !!this.sampleProduct?.offlineData?.shipFromId;
    this.shipFromId = this.getShipFromId();
    this.isRandomLengthUnit = ProductsHelper.isRandomLengthProduct(this.sampleProduct as any);
    this.priceOfMerit = this.getPriceOfMerit();
  }

  private getCostBasisOfUnits() {
    return this.products[0]?.product?.priceHistory ? BuychainLibHelper.getCostBasisOfUnits(this.products) : 0;
  }

  private getListPriceOfUnits() {
    return this.products[0]?.product?.salesData ? BuychainLibHelper.getListPriceOfUnits(this.products) : 0;
  }

  private getSampleProduct(): Product {
    return this.unitProducts.length ? this.unitProducts[0] : null;
  }

  private getOffer(): number {
    const unit = this.products ? this.products[0] : null;
    return unit?.offer || 0;
  }

  private getContract() {
    const target = (this.products || []).find(item => item.contract);
    return target?.contract || null;
  }

  // TODO may differ from product to product
  private getOwnerId(): string {
    const ownProduct = this.unitProducts.find(p => !p.allocatedTransactionId);
    return ownProduct ? ownProduct.owner : this.sampleProduct?.owner;
  }

  private getShipWeekEstimate(): Date {
    const date = new Date();
    return this.products.reduce((acc, cur) => {
      const productDate = cur.product?.salesData?.shipWeekEstimate;
      if (!productDate) return acc;
      return new Date(productDate).getTime() < acc.getTime() ? acc : new Date(productDate);
    }, date);
  }

  private getShipFromId(): string {
    const data = this.sampleProduct.onlineData || this.sampleProduct.offlineData;
    return data?.shipFromId;
  }

  private isAvailableOutstandingProducts(): boolean {
    return this.products.some(
      u => u.product.state === ProductStateEnum.ON_ORDER || u.product.state === ProductStateEnum.IN_TRANSIT
    );
  }
  // used up to Review state ONLY
  private checkIfRequiredQtyAvailable() {
    return !this.unitProducts.some(p => p.allocatedTransactionId || p.soldTransactionId);
  }

  private getPriceOfMerit(): number {
    return this.sampleProduct?.salesData?.priceOfMerit || 0;
  }

  private getListPricePerProduct(): number {
    const product = this.products[0];
    return product?.product?.salesData ? BuychainLibHelper.getListPriceOfUnit(product) : 0;
  }

  private getOfferOrListPricePerProduct() {
    return this.offer ? this.offer * this.unitMeasure : this.listPricePerProduct;
  }

  private getDiscountPerUnit() {
    // used in tally component dx grid
    if (!this.offer || this.offer >= this.priceOfMerit) return null;
    return this.products?.length && this.products[0].product.salesData
      ? BuychainLibHelper.getDiscountOfUnit(this.products[0]) * this.qty
      : 0;
  }

  private getMargin() {
    // used in tally component dx grid
    return (
      ((this.offerOrListPricePerProduct * this.qty - this.unitTotalCostBasis) /
        (this.offerOrListPricePerProduct * this.qty)) *
        100 || 0
    );
  }

  private getProfitPerUom() {
    return (this.offerOrListPricePerProduct * this.qty - this.unitTotalCostBasis) / this.unitTotalMeasure || 0;
  }

  private getProfitPerLine() {
    // used in tally component dx grid
    return this.offerOrListPricePerProduct * this.qty - this.unitTotalCostBasis || 0;
  }

  private getTotalWeight() {
    return this.unitWeight * this.qty;
  }

  private getUnitWeight(): number {
    return this.unitMeasure * 3500;
  }

  private getUnitMeasurePerProduct(): number {
    const unit = this.products[0];
    if (!unit.product?.spec) return 0;
    return BuychainLibHelper.getUomOfUnit(unit);
  }

  private getMeasureLabel(): string {
    const priceSystem = this.sampleProduct?.spec?.priceSystem;
    switch (priceSystem) {
      case PriceSystem.USD_Board_Feet:
        return 'MBF';
      case PriceSystem.USD_Linear_Feet:
        return 'LF';
      case PriceSystem.USD_Square_Feet:
        return 'SF';
      default:
        return '';
    }
  }

  private getSpecShorthand(): string {
    const spec = this.sampleProduct?.spec;
    return spec ? SpecHelper.getSpecShorthand(spec) : '';
  }

  private getProductGroup(): string {
    return this.sampleProduct?.spec?.productGroupName || '';
  }

  private getCountsByStates(): { state: ProductStateEnum; count: number }[] {
    return this.unitProducts.reduce((acc, cur) => {
      const index = acc.findIndex(x => x.state === cur.state);
      if (index !== -1) acc[index].count++;
      else acc.push({ state: cur.state, count: 1 });
      return acc;
    }, []);
  }

  private getAllocatedTransactionIds(): string[] {
    return this.unitProducts.reduce((acc, cur) => {
      if (cur.allocatedTransactionId && !acc.some(x => x === cur.allocatedTransactionId))
        acc.push(cur.allocatedTransactionId);
      return acc;
    }, []);
  }
}

export class TallyEntity {
  contentDescription: string;
  tallyLots: TallyUnitEntity[];
  units: any[];
  deletedProducts: any[] = [];
  priceSystem: PriceSystemEnum;

  init(dto): TallyEntity {
    Object.assign(this, dto);
    this.units = dto.units.filter(u => !!u.product);
    this.deletedProducts = dto.units.filter(u => !u.product);
    this.tallyLots = this.normalizeProductsByLot();
    this.priceSystem = this.units?.length ? this.units[0].product.spec.priceSystem : null;
    return this;
  }

  private normalizeProductsByLot(): TallyUnitEntity[] {
    const groupedByLots = this.units.reduce((acc, cur) => {
      if (!cur.product) return acc;
      const index = acc.findIndex(item => item.lot === cur.product.lot);
      index === -1 ? acc.push({ lot: cur.product.lot, products: [cur] }) : acc[index].products.push(cur);
      return acc;
    }, []);
    return groupedByLots.map(lot => new TallyUnitEntity().init(lot));
  }

  hasUnitWithLotId(lotId: string): boolean {
    return this.units.some(unit => unit.product.lot === lotId);
  }
}

export class JournalItemEntity {
  id: string;
  user: {
    firstName: string;
    lastName: string;
    id: string;
    profilePictureUrl: string;
  };
  message: string;
  type: MessageType;
  updatedAt: Date;
  createdAt: Date;

  init(dto: TransactionTransactionalJournalEntryPopulated): JournalItemEntity {
    return Object.assign(this, dto);
  }
}

export class PrivateDataEntity {
  notes?: string;
}

export class SelectedTransportMethod {
  type: TransportMethodType;
  carrier?: string;
  railRestriction?: RailRestriction;
  railCarNumber?: string;
  notes?: string;
  cost: number;

  init(dto: TransportMethodEmbeddedInTrackingData): SelectedTransportMethod {
    Object.assign(this, dto);
    return this;
  }
}

export class OnlineSellerData {
  sellingCompany: any;
  designatedSeller: any;
  shipFrom: ShippingInfo;
}

export class ShippingInfo {
  id: string;
  shortName: string;
  rateTableId: string;
}

export class SellerData {
  onlineData = new OnlineSellerData();
  crmData: CrmSellerDataEntity;
}

export class OnlineBuyerDataEntity {
  buyingCompany: any;
  buyingUser: any;
  shipTo: ShippingInfo;
  billToContact: any;
  billToLocation: any;

  init(dto): OnlineBuyerDataEntity {
    return Object.assign(this, dto);
  }
}

export class CrmSellerDataEntity {
  designatedSeller: any;
  sellingCompany: any;
  shipFrom: ShippingInfo;

  init(dto: TransactionTrackingDataSellerDataOnlineOrCrmDataPopulated): CrmSellerDataEntity {
    return Object.assign(this, dto);
  }
}

export class CrmBuyerDataEntity {
  buyingCompany: any;
  buyingUser: any;
  shipTo: ShippingInfo;
  billToContact: any;
  billToLocation: any;

  init(dto): CrmBuyerDataEntity {
    return Object.assign(this, dto);
  }
}

export class BuyerDataEntity {
  onlineData: OnlineBuyerDataEntity;
  crmData: CrmBuyerDataEntity;
}

export class CostDataEntity {
  finalPayment: FianlPaymentEntity;
  shippingCost: number;
  cogs: CostDataCostOfGood[];
  cogp: CostDataCostOfGood[];
  soldTally?: any[];
  soldLots: TallyUnitEntity[];
  cogArray: CostDataCostOfGood[];
  cogSubtotal: number;

  init(dto: TransactionCostData): CostDataEntity {
    Object.assign(this, dto);
    this.soldLots = this.normalizeProductsByLot();
    this.cogArray = this.getCogArray();
    this.cogSubtotal = this.getCogSubtotal();
    return this;
  }

  private normalizeProductsByLot(): TallyUnitEntity[] {
    const groupedByLots = this.soldTally.reduce((acc, cur) => {
      const index = acc.findIndex(item => item.lot === cur.product.lot);
      index === -1 ? acc.push({ lot: cur.product.lot, products: [cur] }) : acc[index].products.push(cur);
      return acc;
    }, []);
    return groupedByLots.map(lot => new TallyUnitEntity().init(lot));
  }

  private getCogArray(): CostDataCostOfGood[] {
    return this.cogs || this.cogp || [];
  }

  private getCogSubtotal(): number {
    return this.cogArray.reduce((acc, current) => acc + current.value, 0);
  }
}

export class CostDataCostOfGood implements TransactionCostDataCostOfGood {
  id: string;
  type: CogTypeEnum;
  label: string;
  value: number;
  updatedAt: Date;
  createdAt: Date;

  init(dto: TransactionCostDataCostOfGood): CostDataCostOfGood {
    return Object.assign(this, dto);
  }
}

export class TrackingDataEntity {
  transactionId: string;
  selectedTransportMethod: SelectedTransportMethod;
  estimatedShipDate: Date;
  auditAddress: string;
  creatorId: string;
  sellerData: SellerData = new SellerData();
  buyerData: BuyerDataEntity;
  privateData?: PrivateDataEntity;
  purchaseOrderNumber?: string;
  salesOrderNumber?: string;
  transportTerm: TransportTermEnum;

  init(dto: any) {
    Object.assign(this, dto);

    this.estimatedShipDate = dto.estimatedShipDate && new Date(dto.estimatedShipDate);
    this.purchaseOrderNumber = dto.PONumber;
    this.salesOrderNumber = dto.SONumber;
    this.selectedTransportMethod = dto.transportMethod;
    return this;
  }
}

export class MilestoneEntity {
  icon: string;
  description: string;
  attachment: AttachmentEntity;
  creator?: User;
  updatedAt?: Date;
  createdAt?: Date;

  init(data): MilestoneEntity {
    Object.assign(this, data);
    return this;
  }
}

export class AttachmentEntity {
  id: string;
  name: string;
  sizeKb: number;
  key: string;
  user: string;
  company: string;
  checksum: string;
  createdAt: Date;
  updatedAt: Date;
}

export class FianlPaymentEntity {
  amount: number;
  discount: number;
  profit: number;
  dateTime: Date;
}

export class ChangePendingEntity {
  type: ChangeTransactionTypesEnum;
  buyerApproved: boolean;
  sellerApproved: boolean;
  prevState: TransactionStateEnum;
  transport: {
    estimatedShipDate?: Date;
    transportMethod?: SelectedTransportMethod;
    shippingCost: number;
    transportTerm: TransportTermEnum;
    onlineData?: {
      shipToLocation: string;
      shipToContact: string;
      billToLocation: string;
      billToContact: string;
    };
    crmData?: {
      shipToLocation: string;
      shipToContact: string;
      billToLocation: string;
      billToContact: string;
    };
  };
}

export class TransactionAggregated {
  id: string;
  transactionNumber: string;
  description: string;
  state: TransactionStateEnum;
  isConfirmedOrHigherState: boolean;
  sellerName: string;
  sellerId: string;
  sellerProfilePictureUrl: string;

  buyingCompanyId: string;
  buyingCompanyName: string;

  shipToFacilityName: string;
  shipToCountry: string;
  shipToState: string;
  shipToCity: string;

  shipToLatitude: number;
  shipToLongitude: number;

  estimatedShipDate: Date;

  year: number;
  month: number;
  day: number;
  dateString: string;
  quoteDateString: string;
  confirmedDateString: string;
  date: Date;

  productGroup: string;
  producer: string;

  totalCost: number;
  totalPrice: number;
  profit: number;
  getSeller: () => void;
  getShipTo: () => void;

  init(
    tx: TransactionEntity,
    shipToLatitude?: number,
    shipToLongitude?: number,
    shipToCounty?: string,
    shipToState?: string,
    shipToCity?: string
  ): TransactionAggregated {
    this.id = tx.id;
    this.transactionNumber = tx.transactionNumber;
    this.description = tx.description;

    this.state = tx.state;
    this.isConfirmedOrHigherState =
      this.state === TransactionStateEnum.Confirmed ||
      this.state === TransactionStateEnum.InTransit ||
      this.state === TransactionStateEnum.Complete ||
      this.state === TransactionStateEnum.ChangePending;

    this.sellerName = tx.sellerName;
    this.sellerId = tx.seller.id;
    this.sellerProfilePictureUrl = tx.seller.profilePictureUrl;

    this.buyingCompanyId = tx.buyingCompanyId;
    this.buyingCompanyName = tx.buyingCompanyName;

    this.totalCost = tx.totalPrice;
    this.profit = tx.profit;

    this.shipToFacilityName = tx.shipToName;
    this.shipToLatitude = shipToLatitude;
    this.shipToLongitude = shipToLongitude;
    this.shipToCountry = shipToCounty;
    this.shipToState = shipToState;
    this.shipToCity = shipToCity;

    this.estimatedShipDate = tx.trackingData.estimatedShipDate || tx.tallyShipDate;

    this.date = tx.quoteDate || tx.draftDate;
    if (this.date) this.date = startOfDay(this.date);
    this.year = this.date.getFullYear();
    this.month = this.date.getMonth() + 1;
    this.day = this.date.getDate();

    this.dateString = `${this.year}-${this.month}-${this.day}`;

    const tallyItems = tx.tallyUnitsByLot;
    if (tallyItems.length > 0) {
      this.productGroup = tallyItems[0].productGroup;
      this.producer = tx.costData.soldTally[0].mgfFacility;
    }

    return this;
  }
}

export interface TransactionLog extends BaseLog {
  event: string;
}

export class TransactionEntity {
  id?: string;
  state: TransactionStateEnum;
  costData: CostDataEntity;
  tally: TallyEntity;
  trackingData: TrackingDataEntity;
  milestones?: MilestoneEntity[];
  register: TransactionRegister;
  transactionJournal: JournalItemEntity[];
  transactionalJournalAllRead: string[];
  changePending?: ChangePendingEntity;

  createdAt: Date;
  updatedAt: Date;
  draftDate?: Date;
  quoteDate?: Date;
  reviewDate?: Date;
  confirmedDate?: Date;
  inTransitDate?: Date;
  completeDate?: Date;

  isExpanded: boolean; // ? component specific thing.

  shipDateInitial: Date;

  // BuyChain lib provided
  profit: number;
  margin: number | 'n/a';
  isMarginNotDefined: boolean;
  discount: number;
  discountPercentage: number;
  isConfirmedOrHigherState: boolean;
  isInInvalidState: boolean;

  log: TransactionLog[];

  totalPrice: number;
  tallyUnits: any[];
  tallyShipDate: Date;
  shipDate: Date;
  role: RoleInTransaction;
  deliveredPriceTotal: number;
  isPurchasedTally: boolean;
  isDraftState: boolean;
  isQuoteState: boolean;
  transactionNumber: string;
  seller: any;
  buyer: any;
  sellerName: string;
  buyerName: string;
  shipTo: any;
  billToLocation: any;
  billToContact: any;
  shipFrom: any;
  shipFromName: string;
  shipToName: string;
  sellerCompany: any;
  sellerCompanyName: string;
  buyingCompany: any;
  buyingCompanyName: string;
  hasUnreadComment: boolean;
  market: string;
  type: TransactionTypeEnum;
  isSales: boolean;
  isPurchase: boolean;
  transportType: string;
  purchaseOrderNumber: string;
  salesOrderNumber: string;
  transportMethodType: string;
  transportMethodCarrier: string;
  transportMethodRailcar: string;
  transportNotes: string;
  hasMixedUomTallyItem: boolean;
  description: string;
  tallyTotalUnitsCount: number;
  tallyUnitsByLot: any[];
  measureLabel: string;
  tallyTotalWeight: number;
  tallyTotalMeasureTemporary: number;
  isSellerCrm: boolean;
  isBuyerCrm: boolean;
  tallyTotalMeasureTemporaryExcludingContracts: number;
  totalProfitPerUoM: number;
  deliveryCostPerUom: number;
  isResourceOwner: boolean;
  hasCashTallyItem: boolean;
  tallyTotalOfferedPrice: number;
  totalCostBasis: number;
  isShippingCostVisible: boolean;
  costInfoMaterialCost: number;
  priceToInvoice: number;
  badgeClass: string;
  costBasisForSeller: number;
  buyChainTxFee: number;
  costBasisForBuyer: number;
  costBasisForBuyerPerUoM: number;
  tallyMeasurePerPriceSystem: any[];
  tallyTotalMeasure: string;
  isTallyItemsRequiredQtyAvailable: boolean;
  sellerCompanyId: string;
  buyingCompanyId: string;

  init(dto) {
    Object.assign(this, dto);

    this.tally = new TallyEntity().init(dto.tally);

    this.initBase(dto);
    this.initStateRelatedData();
    this.initRoleRelatedData();
    this.initTrackingDataRelatedData();

    this.tallyUnitsByLot = this.getTallyUnitsByLot();
    this.tallyUnits = this.getTallyUnits();

    this.initDataFromTallyUnits(dto);
    this.initTallyUnitsRelatedData();
    this.initTallyUnitsByLotRelatedData();

    this.shipDate = this.getShipDate();
    this.shipDateInitial = this.shipDate;
    this.deliveredPriceTotal = this.getDeliveredPriceTotal();
    this.totalPrice = this.getTotalPrice();
    this.isPurchasedTally = this.checkIfIsPurchasedTally();
    this.seller = this.getSeller();
    this.buyer = this.getBuyer();
    this.sellerCompany = this.getSellerCompany();
    this.buyingCompany = this.getBuyingCompany();
    this.sellerName = this.getSellerName();
    this.buyerName = this.getBuyerName();
    this.shipTo = this.getShipTo();
    this.shipFrom = this.getShipFrom();
    this.shipFromName = this.shipFrom.shortName || '';
    this.shipToName = this.shipTo.shortName || '';
    this.sellerCompanyName = this.sellerCompany.name || '';
    this.buyingCompanyName = this.buyingCompany.name || '';
    this.hasUnreadComment = this.checkIfHasUnreadComment();
    this.market = this.getMarket();
    this.description = this.getDescription();
    this.measureLabel = this.getMeasureLabel();
    this.totalProfitPerUoM = this.getTotalProfitPerUoM();
    this.deliveryCostPerUom = this.getDeliveryCostPerUom();
    this.isResourceOwner = this.checkIfIsResourceOwner();
    this.costInfoMaterialCost = this.getCostInfoMaterialCost();
    this.priceToInvoice = this.getPriceToInvoice();
    this.costBasisForSeller = this.getCostBasisForSeller();
    this.buyChainTxFee = this.getBuyChainTxFee();
    this.costBasisForBuyer = this.getCostBasisForBuyer();
    this.costBasisForBuyerPerUoM = this.getCostBasisForBuyerPerUoM();
    this.tallyTotalMeasure = this.getTallyTotalMeasure();
    this.isTallyItemsRequiredQtyAvailable = this.checkIfTallyItemsRequiredQtyAvailable();
    this.sellerCompanyId = this.sellerCompany.id;
    this.buyingCompanyId = this.buyingCompany.id;
    return this;
  }

  private initTrackingDataRelatedData() {
    this.billToLocation = this.getBillToLocation();
    this.billToContact = this.getBillToContact();
    this.transportType = this.getTransportType();
    this.salesOrderNumber = this.trackingData.salesOrderNumber;
    this.transportMethodType = this.getTransportMethodType();
    this.transportMethodCarrier = this.getTransportMethodCarrier();
    this.transportMethodRailcar = this.getTransportMethodRailcar();
    this.transportNotes = this.getTransportNotes();
    this.isSellerCrm = this.checkIfIsSellerCrm();
    this.isBuyerCrm = this.checkIfIsBuyerCrm();
    this.isShippingCostVisible = this.checkIfShippingCostVisible();
  }

  private initTallyUnitsRelatedData() {
    this.tallyTotalUnitsCount = this.getTallyTotalUnitsCount();
    this.tallyShipDate = this.getTallyShipDate();
    this.hasMixedUomTallyItem = this.checkIfHasMixedUomTallyItem();
    this.tallyTotalMeasureTemporary = this.getTallyTotalMeasureTemporary();
    this.tallyTotalMeasureTemporaryExcludingContracts = this.getTallyTotalMeasureTemporaryExcludingContracts();
    this.totalCostBasis = this.getTotalCostBasis();
  }

  private initTallyUnitsByLotRelatedData() {
    this.hasCashTallyItem = this.checkIfHasCashTallyItem();
    this.tallyTotalWeight = this.getTallyTotalWeight();
    this.tallyTotalOfferedPrice = this.getTallyTotalOfferedPrice();
    this.tallyMeasurePerPriceSystem = this.getTallyMeasurePerPriceSystem();
  }

  private initStateRelatedData() {
    this.isConfirmedOrHigherState = this.getIsConfirmedOrHigherState();
    this.isInInvalidState =
      this.state === TransactionStateEnum.Canceled || this.state === TransactionStateEnum.ChangePending;
    this.isDraftState = this.state === TransactionStateEnum.Draft;
    this.isQuoteState = this.state === TransactionStateEnum.Quote;
    this.badgeClass = this.getBadgeClass();
  }

  private initRoleRelatedData() {
    this.isSales = this.role === RoleInTransaction.Seller;
    this.isPurchase = this.role === RoleInTransaction.Buyer;
    this.type = this.getType();
  }

  protected getTallyTotalUnitsCount() {
    return this.tallyUnits.length;
  }

  protected getTallyTotalMeasureTemporary() {
    return BuychainLibHelper.getUomOfUnits(this.tallyUnits);
  }

  protected initBase(dto) {
    this.initDates(dto);

    this.transactionNumber = this.getTransactionNumber();
    this.trackingData = new TrackingDataEntity().init(dto.trackingData);
    this.purchaseOrderNumber = this.trackingData.purchaseOrderNumber;
    this.role = this.getRole();
    this.costData = new CostDataEntity().init(dto.costData);
  }

  protected getTransactionNumber() {
    return TransformHelper.getShortHexGuid(this.id);
  }

  private initDates(dto) {
    this.createdAt = new Date(dto.createdAt);
    this.updatedAt = new Date(dto.updatedAt);

    if (dto.register) {
      this.draftDate = dto.register.draftDate ? new Date(dto.register.draftDate) : null;
      this.quoteDate = dto.register.quoteDate ? new Date(dto.register.quoteDate) : null;
      this.reviewDate = dto.register.reviewDate ? new Date(dto.register.reviewDate) : null;
      this.confirmedDate = dto.register.confirmedDate ? new Date(dto.register.confirmedDate) : null;
      this.inTransitDate = dto.register.inTransitDate ? new Date(dto.register.inTransitDate) : null;
      this.completeDate = dto.register.completeDate ? new Date(dto.register.completeDate) : null;
    }
  }

  private initDataFromTallyUnits(dto) {
    try {
      const tallyUnits = this.tallyUnits.filter(
        item => !item.contract || item.contract.state === ContractStateEnum.CLOSED
      );
      if (tallyUnits.length) {
        if (this.role === RoleInTransaction.Seller && tallyUnits[0]?.product?.priceHistory) {
          this.profit = BuychainLibHelper.getSellerProfit(tallyUnits, this.costData.cogArray) || null;
          this.initMargin(tallyUnits);
        }

        this.initDiscount(tallyUnits);
      }
    } catch (error) {
      console.error(error, dto);
    }
  }

  private initMargin(tallyUnits) {
    const margin = BuychainLibHelper.getSellerMargin(
      tallyUnits,
      this.costData.cogArray,
      this.trackingData.transportTerm,
      this.costData.shippingCost
    );

    this.isMarginNotDefined = margin === 'n/a';

    if (this.isMarginNotDefined) {
      this.margin = margin;
    } else {
      this.margin = !margin && margin !== 0 ? null : margin;

      if (this.margin || this.margin === 0) {
        this.margin = this.margin as number;
        isFinite(this.margin) ? (this.margin /= 100) : (this.margin = -1);
      }
    }
  }

  private initDiscount(tallyUnits) {
    this.discount = BuychainLibHelper.getDiscount(tallyUnits) || null;
    if (this.discount <= 0) {
      this.discount = 0;
      this.discountPercentage = 0;
    } else {
      this.discountPercentage = BuychainLibHelper.getDiscountPercentage(tallyUnits) || null;
      if (this.discountPercentage) this.discountPercentage /= 100;
    }
  }

  private checkIfIsPurchasedTally() {
    return (
      this.role === RoleInTransaction.Buyer &&
      this.passedTheState(TransactionStateEnum.Review) &&
      this.state !== TransactionStateEnum.Canceled
    );
  }

  protected getSellerName(): string {
    const seller = this.seller;
    return seller.firstName ? `${seller.firstName} ${seller.lastName}` : seller.username || '';
  }

  protected getBuyerName(): string {
    const buyer = this.buyer;
    return buyer.firstName ? `${buyer.firstName} ${buyer.lastName}` : buyer.username || '';
  }

  private checkIfHasUnreadComment(): boolean {
    // used in transactions overview dx dataGrid
    return (
      this.transactionalJournalAllRead?.length &&
      !this.transactionalJournalAllRead?.some(id => id === Environment.getCurrentUser().id)
    );
  }

  protected getMarket(): string {
    return 'Off Market';
  }

  protected getRole(): RoleInTransaction {
    const sellerData = this.trackingData.sellerData.onlineData;
    const buyerData = this.trackingData.buyerData.onlineData;

    const sellerCompanyId =
      sellerData &&
      (TypeCheck.isObject(sellerData.sellingCompany) ? sellerData.sellingCompany.id : sellerData.sellingCompany);
    const buyerCompanyId =
      buyerData && (TypeCheck.isObject(buyerData.buyingCompany) ? buyerData.buyingCompany.id : buyerData.buyingCompany);
    if (Environment.getCurrentUser().companyId === sellerCompanyId) return RoleInTransaction.Seller;
    if (Environment.getCurrentUser().companyId === buyerCompanyId) return RoleInTransaction.Buyer;
  }

  private getType(): TransactionTypeEnum {
    if (this.role === RoleInTransaction.Seller) return TransactionTypeEnum.Sales;
    if (this.role === RoleInTransaction.Buyer) return TransactionTypeEnum.Purchase;
  }

  protected getTransportType(): string {
    if (this.trackingData?.selectedTransportMethod?.type) {
      const type = this.trackingData.selectedTransportMethod.type;
      return TransformHelper.stringUnderscoreToSpaceTitleCase(type);
    }
    return '';
  }

  private getTotalProfitPerUoM() {
    // for seller
    const totalProfit = this.profit;
    const totalMeasure = this.tallyTotalMeasureTemporaryExcludingContracts;
    return TypeCheck.isNumber(totalProfit) && totalMeasure ? totalProfit / totalMeasure : 0;
  }

  private getCostBasisForBuyer() {
    // for buyer
    return this.totalPrice + this.costData.cogSubtotal + this.buyChainTxFee;
  }

  private getCostBasisForSeller() {
    // for seller
    return this.totalCostBasis + this.costData.cogSubtotal;
  }

  private getCostBasisForBuyerPerUoM() {
    // for buyer
    const totalCost = this.costBasisForBuyer;
    const totalMeasure = this.tallyTotalMeasureTemporaryExcludingContracts;
    return TypeCheck.isNumber(totalCost) && totalMeasure ? totalCost / totalMeasure : 0;
  }

  private getTotalPrice(): number {
    let costData = 0;
    if (this.costData) costData = this.shippingCostInTxTotalCost();
    return costData + this.deliveredPriceTotal;
  }

  private getDescription(): string {
    const isDescriptionEmpty = !this.tally.contentDescription;

    const availableTallyUnits = this.tallyUnits;
    const hasTallyItems = !!availableTallyUnits.length;

    if (isDescriptionEmpty && hasTallyItems) {
      return availableTallyUnits[0].product.specShorthand;
    } else {
      return this.tally.contentDescription || '';
    }
  }

  private getTransportMethodType() {
    if (
      !this.trackingData ||
      !this.trackingData.selectedTransportMethod ||
      !this.trackingData.selectedTransportMethod.type
    )
      return '';
    const transportData = this.trackingData.selectedTransportMethod;
    return transportData.type;
  }

  // those are used in dx datagrids somehow, maybe refactor later
  private getTransportMethodCarrier() {
    if (
      !this.trackingData ||
      !this.trackingData.selectedTransportMethod ||
      !this.trackingData.selectedTransportMethod.type
    )
      return '';
    const transportData = this.trackingData.selectedTransportMethod;
    const type = transportData.type;
    const carrier = transportData.carrier;
    return type === TransportMethodType.Rail ? carrier : '';
  }

  private getTransportMethodRailcar() {
    if (
      !this.trackingData ||
      !this.trackingData.selectedTransportMethod ||
      !this.trackingData.selectedTransportMethod.type ||
      this.trackingData.selectedTransportMethod.type !== TransportMethodType.Rail
    )
      return '';

    const transportData = this.trackingData.selectedTransportMethod;
    const railCarNumber = transportData.railCarNumber;
    return railCarNumber || 'Unassigned';
  }

  protected getTransportNotes() {
    if (!this.trackingData || !this.trackingData.selectedTransportMethod) return '';
    return this.trackingData.selectedTransportMethod.notes;
  }

  protected checkIfHasMixedUomTallyItem() {
    if (this.tallyUnits.length) return !BuychainLibHelper.isSamePriceSystem(this.tallyUnits);
    return false;
  }

  protected getTallyUnits(): any[] {
    return (this.state === TransactionStateEnum.Confirmed ||
      this.state === TransactionStateEnum.ChangePending ||
      this.state === TransactionStateEnum.Canceled ||
      this.state === TransactionStateEnum.InTransit ||
      this.state === TransactionStateEnum.Complete) &&
      this.role === RoleInTransaction.Seller
      ? this.costData.soldTally
      : this.tally.units;
  }

  protected getTallyUnitsByLot(): TallyUnitEntity[] {
    return (this.state === TransactionStateEnum.Confirmed ||
      this.state === TransactionStateEnum.ChangePending ||
      this.state === TransactionStateEnum.Canceled ||
      this.state === TransactionStateEnum.InTransit ||
      this.state === TransactionStateEnum.Complete) &&
      this.role === RoleInTransaction.Seller
      ? this.costData.soldLots
      : this.tally.tallyLots;
  }

  protected getMeasureLabel() {
    if (!this.tallyUnitsByLot.length) return '';
    return this.hasMixedUomTallyItem ? 'MIX' : this.tallyUnitsByLot[0].measureLabel;
  }

  passedTheState(state: TransactionStateEnum): boolean {
    const stateArray = ObjectUtil.enumToArray(TransactionStateEnum);
    const stateIndex = stateArray.findIndex(item => item === state);
    const txStateIndex = stateArray.findIndex(item => item === this.state);
    return txStateIndex > stateIndex;
  }

  passedTheValidState(state: TransactionStateEnum): boolean {
    const stateArray = ObjectUtil.enumToArray(TransactionStateEnum).filter(
      s => s !== TransactionStateEnum.ChangePending && s !== TransactionStateEnum.Canceled
    );
    const stateIndex = stateArray.findIndex(item => item === state);
    const txStateIndex = stateArray.findIndex(item => item === this.state);
    return txStateIndex > stateIndex;
  }

  private getBuyChainTxFee() {
    if (!this.tallyUnits?.length || this.role === RoleInTransaction.Seller) {
      return 0;
    }

    return BuychainLibHelper.getTransactionFee(
      Environment.getCurrentCompany().contract,
      this.tallyUnits,
      this.costData.shippingCost,
      this.trackingData.transportTerm
    );
  }

  private getIsConfirmedOrHigherState(): boolean {
    return (
      this.state === TransactionStateEnum.Confirmed ||
      this.state === TransactionStateEnum.InTransit ||
      this.state === TransactionStateEnum.Complete ||
      this.state === TransactionStateEnum.ChangePending
    );
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
    return {};
  }

  protected getBuyer(): any {
    const buyerData = this.trackingData.buyerData;

    if (this.role === RoleInTransaction.Buyer && buyerData.onlineData && buyerData.onlineData.buyingUser)
      return buyerData.onlineData.buyingUser;
    if (buyerData.crmData && buyerData.crmData.buyingUser) return buyerData.crmData.buyingUser;
    if (
      this.role === RoleInTransaction.Seller &&
      !(buyerData.crmData && buyerData.crmData.buyingUser) &&
      buyerData.onlineData &&
      buyerData.onlineData.buyingUser
    )
      return buyerData.onlineData.buyingUser;
    return {};
  }

  protected getShipTo(): any {
    const buyerData = this.trackingData.buyerData;

    if (this.role === RoleInTransaction.Buyer && buyerData.onlineData && buyerData.onlineData.shipTo)
      return buyerData.onlineData.shipTo;
    if (buyerData.crmData && buyerData.crmData.shipTo) return buyerData.crmData.shipTo;
    if (
      this.role === RoleInTransaction.Seller &&
      !(buyerData.crmData && buyerData.crmData.shipTo) &&
      buyerData.onlineData &&
      buyerData.onlineData.shipTo
    )
      return buyerData.onlineData.shipTo;
    return {};
  }

  protected getBillToLocation(): any {
    const buyerData = this.trackingData.buyerData;

    if (buyerData.onlineData && buyerData.onlineData.billToLocation && buyerData.onlineData.billToLocation.id) {
      return buyerData.onlineData.billToLocation;
    }
    if (buyerData.crmData && buyerData.crmData.billToLocation && buyerData.crmData.billToLocation.id) {
      return buyerData.crmData.billToLocation;
    }
    return {};
  }

  protected getBillToContact(): any {
    const buyerData = this.trackingData.buyerData;

    if (buyerData.onlineData && buyerData.onlineData.billToContact && buyerData.onlineData.billToContact.id) {
      return buyerData.onlineData.billToContact;
    }
    if (buyerData.crmData && buyerData.crmData.billToContact && buyerData.crmData.billToContact.id) {
      return buyerData.crmData.billToContact;
    }
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
    // if (sellerData.onlineData && sellerData.onlineData.shipFrom) return sellerData.onlineData.shipFrom;
    return {};
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
    return {};
  }

  private checkIfIsSellerCrm(): boolean {
    const sellerData = this.trackingData.sellerData;
    return !!(sellerData.crmData && sellerData.crmData.sellingCompany);
  }

  private checkIfIsBuyerCrm(): boolean {
    const buyerData = this.trackingData.buyerData;
    return !!(buyerData.crmData && buyerData.crmData.buyingCompany);
  }

  protected getBuyingCompany(): any {
    const buyerData = this.trackingData.buyerData;
    if (this.role === RoleInTransaction.Buyer && buyerData.onlineData && buyerData.onlineData.buyingCompany)
      return buyerData.onlineData.buyingCompany;
    if (buyerData.crmData && buyerData.crmData.buyingCompany) return buyerData.crmData.buyingCompany;
    if (
      this.role === RoleInTransaction.Seller &&
      !(buyerData.crmData && buyerData.crmData.buyingCompany) &&
      buyerData.onlineData &&
      buyerData.onlineData.buyingCompany
    )
      return buyerData.onlineData.buyingCompany;
    return {};
  }

  private shippingCostInTxTotalCost(): number {
    if (this.role === RoleInTransaction.Seller) {
      const terms = [TransportTermEnum.FOB_DEST_PREPAY_CHARGE, TransportTermEnum.FOB_ORIGIN_PREPAY_CHARGE];
      return terms.includes(this.trackingData.transportTerm) ? this.costData.shippingCost : 0;
    }
    if (this.role === RoleInTransaction.Buyer) {
      return BuychainLibHelper.getShippingCostPayableByBuyer(
        this.trackingData.transportTerm,
        this.costData.shippingCost
      );
    }
  }

  protected getDeliveredPriceTotal(): number {
    if (!this.tallyUnits?.length) return 0;

    return BuychainLibHelper.getDeliveredPrice(
      this.tallyUnits,
      this.costData.shippingCost,
      this.trackingData.transportTerm
    );
  }

  private getDeliveryCostPerUom(): number {
    if (!this.tallyUnits.length) return 0;
    return BuychainLibHelper.getDeliveryCostPerUom(this.tallyUnits, this.costData.shippingCost);
  }

  calcDeliveredPricePerLineItem(tallyItem: TallyUnitEntity) {
    if (!tallyItem.products.length) return 0;
    const deliveredPrices = tallyItem.products.map(p =>
      BuychainLibHelper.getDeliveredPricePerUnit(p, this.deliveryCostPerUom, this.trackingData.transportTerm)
    );
    return deliveredPrices.reduce((acc, cur) => acc + cur, 0);
  }

  calcDeliveredPricePerUoM(tallyItem: TallyUnitEntity) {
    const tallyUnit = tallyItem.products[0];
    const deliveredPrice = BuychainLibHelper.getDeliveredPricePerUom(
      tallyUnit,
      this.deliveryCostPerUom,
      this.trackingData.transportTerm
    );
    return deliveredPrice || 0;
  }

  private checkIfIsResourceOwner(): boolean {
    const currentUser = Environment.getCurrentUser();
    const sellerData = this.trackingData.sellerData.onlineData;
    const buyerData = this.trackingData.buyerData.onlineData;
    const sellingUsers = this.tallyUnits.map(x => x.product.owner);
    return !!(
      (sellerData &&
        ((sellingUsers && sellingUsers.some(user => user === currentUser.id)) ||
          (sellerData.designatedSeller &&
            (sellerData.designatedSeller === currentUser.id || sellerData.designatedSeller.id === currentUser.id)))) ||
      (buyerData && buyerData.buyingUser && buyerData.buyingUser.id === currentUser.id)
    );
  }

  protected getShipDate() {
    let date;
    if (
      !this.passedTheState(TransactionStateEnum.Confirmed) ||
      this.state === TransactionStateEnum.Canceled ||
      this.state === TransactionStateEnum.ChangePending
    ) {
      date = this.trackingData.estimatedShipDate || this.tallyShipDate;
    } else {
      date = this.register.inTransitDate;
    }
    date = date && isValid(new Date(date)) ? startOfDay(new Date(date)) : startOfDay(new Date());
    return date;
  }

  private getTallyShipDate(): Date {
    const currentDate = new Date();

    return this.tallyUnits.length
      ? this.tallyUnits.reduce(
          (acc, current) =>
            current.product?.salesData?.shipWeekEstimate &&
            acc.getTime() < new Date(current.product.salesData.shipWeekEstimate).getTime()
              ? new Date(current.product.salesData.shipWeekEstimate)
              : acc,
          currentDate
        )
      : null;
  }

  private getTallyTotalOfferedPrice(): number {
    return this.tallyUnitsByLot
      .filter(item => !item.contract)
      .reduce((acc, current) => acc + current.unitTotalSalesPrice, 0);
  }

  protected checkIfHasCashTallyItem() {
    return this.tallyUnitsByLot.some(item => !item.contract);
  }

  protected getTallyTotalWeight(): number {
    return Math.round(this.tallyUnitsByLot.reduce((acc, current) => acc + current.totalWeight, 0) * 100) / 100;
  }

  protected getTallyTotalMeasure(): string {
    return this.tallyMeasurePerPriceSystem.reduce(
      (acc, cur) => acc.concat(`${cur.measureLabel}: ${cur.total.toFixed(3)}`),
      ''
    );
  }

  private getTotalCostBasis(): number {
    const units = this.tallyUnits.filter(item => !item.contract);
    if (units.length === 0) return 0;
    return BuychainLibHelper.getCostBasisOfUnits(units);
  }

  protected getTallyMeasurePerPriceSystem(): any[] {
    const measurePerPriceSystem = <{ priceSystem: PriceSystemEnum; total: number; measureLabel: string }[]>[];
    this.tallyUnitsByLot.forEach(unit => {
      const product = unit.products[0].product;
      if (TypeCheck.isObject(product)) {
        const index = measurePerPriceSystem.findIndex(measure => measure.priceSystem === product.spec.priceSystem);
        if (index === -1) {
          measurePerPriceSystem.push({
            priceSystem: product.spec.priceSystem,
            total: unit.unitMeasure * unit.qty,
            measureLabel: unit.measureLabel
          });
        } else measurePerPriceSystem[index].total += unit.unitMeasure * unit.qty;
      }
    });
    return measurePerPriceSystem;
  }

  private getTallyTotalMeasureTemporaryExcludingContracts(): number {
    const units = this.tallyUnits.filter(item => !item.contract);
    return BuychainLibHelper.getUomOfUnits(units);
  }

  // used only up to Review state ONLY
  private checkIfTallyItemsRequiredQtyAvailable() {
    return this.tally.tallyLots.every(x => x.isRequiredQtyAvailable);
  }

  private checkIfShippingCostVisible() {
    const visibilityMap = {
      FOB_DEST_PREPAY: { BUYER: false, SELLER: true },
      FOB_DEST_COLLECT: { BUYER: true, SELLER: false },
      FOB_DEST_PREPAY_CHARGE: { BUYER: true, SELLER: true },
      FOB_ORIGIN_PREPAY: { BUYER: false, SELLER: true },
      FOB_ORIGIN_COLLECT: { BUYER: true, SELLER: false },
      FOB_ORIGIN_PREPAY_CHARGE: { BUYER: true, SELLER: true }
    };

    const freightTerms = this.trackingData.transportTerm;
    return visibilityMap[freightTerms][this.role];
  }

  canSetShippingCost(freightTerms: TransportTermEnum): boolean {
    const editabilityMap = {
      FOB_DEST_PREPAY: { BUYER: false, SELLER: true },
      FOB_DEST_COLLECT: { BUYER: true, SELLER: false },
      FOB_DEST_PREPAY_CHARGE: { BUYER: true, SELLER: true },
      FOB_ORIGIN_PREPAY: { BUYER: false, SELLER: true },
      FOB_ORIGIN_COLLECT: { BUYER: true, SELLER: false },
      FOB_ORIGIN_PREPAY_CHARGE: { BUYER: true, SELLER: true }
    };

    return editabilityMap[freightTerms][this.role];
  }

  // TODO
  private getCostInfoMaterialCost(): number {
    return this.role === RoleInTransaction.Seller ? this.tallyTotalOfferedPrice : this.deliveredPriceTotal;
  }

  private getPriceToInvoice(): number {
    const terms = [TransportTermEnum.FOB_DEST_PREPAY_CHARGE, TransportTermEnum.FOB_ORIGIN_PREPAY_CHARGE];
    return (
      this.deliveredPriceTotal + (terms.includes(this.trackingData.transportTerm) ? this.costData.shippingCost : 0)
    );
  }

  private getBadgeClass() {
    switch (this.state) {
      case TransactionStateEnum.Complete:
        return Badge.success;
      case TransactionStateEnum.Confirmed:
        return Badge.primary;
      case TransactionStateEnum.InTransit:
        return Badge.warning;
      default:
        return Badge.secondary;
    }
  }
}
