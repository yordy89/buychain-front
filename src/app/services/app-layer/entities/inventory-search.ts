import { Badge } from '@app/constants';
import { ContractStateEnum, ProductPurchaseMethod, ProductStateEnum } from '@services/app-layer/app-layer.enums';
import { ContractEntity } from '@services/app-layer/entities/contract';
import { ProductLotSearchBase, ProductSpecExtended } from '@services/app-layer/entities/product';
import { ProductsHelper } from '@services/app-layer/products/products-helper';
import {
  Product,
  ProductDateHistory,
  ProductOfflineData,
  ProductOnlineData,
  ProductPriceHistory,
  ProductSalesData
} from '@services/data-layer/http-api/base-api/swagger-gen';
import { BuychainLibHelper } from '@services/helpers/utils/buychain-lib-helper';
import { TransformHelper } from '@services/helpers/utils/transform-helper';
import { differenceInDays } from 'date-fns';
import { Environment } from '@services/app-layer/app-layer.environment';

export class InventorySearchEntity extends ProductLotSearchBase {
  // product
  organizationId: string;
  organizationName: string;

  risi: number;
  salesNotes: string;
  cutShorthand: string;
  size: number;

  // delivery pricing
  deliveryPricing?: any;

  onHandCount: number;
  onOrderCount: number;
  inTransitCount: number;
  soldCount: number;

  randomLengthUnits: string;
  inventoryType: string;

  qtyInUom: number;
  qtyInUomWithLabel: string;

  contractUnitsCount: number;
  openContractUnitsCount: number;
  closedContractUnitsCount: number;
  totalContractPrice: number;
  avgContractAgeOfMaterials: number;
  avgContractMargin: number;
  avgContractSoldPrice: number;
  avgContractPurchasePrice: number;
  contractFirstOpenedDate: Date;
  contractFirstClosedDate: Date;
  nearestContractExpirationClosedDate: Date;

  public init(inventoryItem: any) {
    super.init(inventoryItem);

    this.cutShorthand = this.getCutShorthand();
    this.size = this.getSize();
    this.risi = this.generateRndRiSi(); // for demo
    this.setCountByStates();
    this.initDataFromFirstUnit();
    ProductsHelper.setSpecs(this, this.spec);
    ProductsHelper.computeContractsData(this, this.products);

    this.qtyInUom = this.getQtyInUom();
    this.qtyInUomWithLabel = this.getQtyInUomWithLabel();

    return this;
  }

  protected initDataFromFirstUnit() {
    super.initDataFromFirstUnit();
    const sampleProduct = this.products[0];
    if (sampleProduct.isRandomLengthProduct) this.defineRandomLengthUnits();

    const productOnlineData = sampleProduct.onlineData;
    this.organizationId = productOnlineData?.organizationId;
    this.organizationName = productOnlineData?.organizationName;

    this.salesNotes = sampleProduct.salesNotes || ' ';
  }

  private getCutShorthand(): string {
    return this.spec.thickness && this.spec.width ? `${this.spec.thickness.name}x${this.spec.width.name}` : '';
  }

  private getSize(): number {
    return this.spec.thickness && this.spec.width ? this.spec.thickness.value * this.spec.width.value : 0;
  }

  private getQtyInUom(): number {
    return BuychainLibHelper.getUomValue(this.spec) * this.productsCount;
  }

  private getQtyInUomWithLabel(): string {
    return `${this.qtyInUom.toFixed(3)} ${ProductsHelper.getMeasureLabel(this.spec)}`;
  }

  private generateRndRiSi(): number {
    const min = 100;
    const max = 500;
    return Math.random() * (max - min) + min;
  }

  private setCountByStates(): void {
    this.onHandCount = 0;
    this.onOrderCount = 0;
    this.inTransitCount = 0;
    this.soldCount = 0;
    this.products.forEach(p => {
      switch (p.state) {
        case ProductStateEnum.ON_HAND:
          return this.onHandCount++;
        case ProductStateEnum.ON_ORDER:
          return this.onOrderCount++;
        case ProductStateEnum.IN_TRANSIT:
          return this.inTransitCount++;
      }
      if (p.soldTransactionId) this.soldCount++;
    });
  }

  private defineRandomLengthUnits(): void {
    const sampleProduct = this.products[0];
    if (sampleProduct.isRandomLengthProduct && sampleProduct?.spec?.lengthUnits?.length) {
      this.randomLengthUnits = sampleProduct.spec.lengthUnits.reduce(
        (acc, cur) => acc + (acc ? ', ' : '') + `${cur.count} - ${cur.length.name}`,
        ''
      );
    } else this.randomLengthUnits = '';
  }
}

export class InventoryStreamlineEntity {
  spec: ProductSpecExtended;
  specShorthand: string;
  products: ProductEntity[];
  onHandCount: number;
  onOrderCount: number;
  inTransitCount: number;

  productsCount: number;
  availableProducts: ProductEntity[];
  availableProductsCount: number;
  hasAvailableProducts: boolean;
  hasAllocatedProducts: boolean;
  allocatedProductsCount: number;
  qtyInUom: number;
  qtyInUomWithLabel: string;
  totalCostBasis: number;
  averageCostBasis: number;
  avgCostBasisPerUom: number;
  averageAskPricePerUnit: number;
  askPriceProductsTotal: number;
  profitProductsTotal: number;

  contractUnitsCount: number;
  openContractUnitsCount: number;
  closedContractUnitsCount: number;
  totalContractPrice: number;
  avgContractAgeOfMaterials: number;
  avgContractMargin: number;
  avgContractSoldPrice: number;
  avgContractPurchasePrice: number;
  contractFirstOpenedDate: Date;
  contractFirstClosedDate: Date;
  nearestContractExpirationClosedDate: Date;

  public init(inventoryItem: any) {
    this.products = (inventoryItem.products || []).map(p => new ProductEntity().init(p));
    this.specShorthand = this.products[0].specShorthand;
    this.spec = this.products[0].spec;
    this.setCountByStates();

    ProductsHelper.setSpecs(this, this.spec);
    ProductsHelper.computeContractsData(this, this.products);

    // TODO separate as methods each chunk
    this.productsCount = this.products.length;
    this.availableProducts = this.products.filter(
      p => !p.isAllocated && (!p.isRandomLengthProduct || p.isLengthUnitsFixed)
    );
    this.availableProductsCount = this.availableProducts.length;
    this.hasAvailableProducts = !!this.availableProductsCount;
    this.hasAllocatedProducts = this.products.some(p => p.isAllocated);
    this.allocatedProductsCount = this.products.filter(p => p.isAllocated).length;

    this.qtyInUom = BuychainLibHelper.getUomValue(this.spec) * this.productsCount;
    this.qtyInUomWithLabel = `${this.qtyInUom.toFixed(3)} ${ProductsHelper.getMeasureLabel(this.spec)}`;
    this.totalCostBasis = this.products.reduce((acc, cur) => acc + cur.costBasis, 0);
    this.averageCostBasis = this.productsCount ? this.totalCostBasis / this.productsCount : 0;
    this.avgCostBasisPerUom = ProductsHelper.calcAvgCostBasisPerUom(
      this.spec,
      this.totalCostBasis,
      this.products.length
    );
    this.averageAskPricePerUnit = ProductsHelper.getAvgAskPricePerUnit(this.products);
    this.askPriceProductsTotal = ProductsHelper.getAskPriceTotal(this.products);
    this.profitProductsTotal = ProductsHelper.calcProfitTotal(this.products);

    return this;
  }

  private setCountByStates(): void {
    this.onHandCount = 0;
    this.onOrderCount = 0;
    this.inTransitCount = 0;
    this.products.forEach(p => {
      switch (p.state) {
        case ProductStateEnum.ON_HAND:
          return this.onHandCount++;
        case ProductStateEnum.ON_ORDER:
          return this.onOrderCount++;
        case ProductStateEnum.IN_TRANSIT:
          return this.inTransitCount++;
      }
    });
  }
}

export class ProductEntity implements Product {
  id: string;
  acquiredTransactionId: string;
  soldTransactionId: string;
  purchaseDate: Date;
  custodyDate?: Date;
  landedDate?: Date;
  soldDate?: Date;
  log: any[];
  owner: string;
  costBasis: number;
  purchasePrice: number;
  soldPrice: number;
  purchasedLot: string;
  trackingNumber: string;
  allocatedTransactionId: string;
  allocatedTransactionShortId: string;
  isAllocated: boolean;
  isRandomLengthProduct: boolean;
  isLengthUnitsFixed: boolean;
  state: ProductStateEnum;
  archived: boolean;
  mfgFacilityShortName: string;
  spec: ProductSpecExtended;
  brokerContract?: ContractEntity;
  supplyContract?: ContractEntity;
  contract?: ContractEntity;
  private openContract?: ContractEntity;
  offlineData: ProductOfflineData;
  specShorthand?: string;
  lot?: string;
  inventoryType: ProductPurchaseMethod;
  isContractType: boolean;
  shipWeekEstimate: Date;
  salesData: ProductSalesData;
  priceHistory: ProductPriceHistory;
  dateHistory: ProductDateHistory;
  permission: Product.PermissionEnum;
  onlineData: ProductOnlineData;
  salesNotes?: string;
  contractMargin?: number;
  ageOfMaterials?: number;
  badgeClass: string;

  static getContractBadgeClass(state: ContractStateEnum) {
    switch (state) {
      case ContractStateEnum.DRAFT:
        return Badge.secondary;
      case ContractStateEnum.OPEN:
        return Badge.primary;
      case ContractStateEnum.CLOSED:
        return Badge.success;
    }
  }

  public init(dto: any) {
    Object.assign(this, dto);
    this.spec.specShorthand = this.specShorthand;
    this.purchaseDate = new Date(dto.dateHistory.purchaseDate);
    if (dto.dateHistory.custodyDate) this.custodyDate = new Date(dto.dateHistory.custodyDate);
    if (dto.dateHistory.landedDate) this.landedDate = new Date(dto.dateHistory.landedDate);
    if (dto.dateHistory.soldDate) this.soldDate = new Date(dto.dateHistory.soldDate);
    this.costBasis = dto.priceHistory.costBasis;
    this.purchasePrice = dto.priceHistory.purchasePrice;
    this.soldPrice = dto.priceHistory.soldPrice;
    this.isAllocated = !!this.allocatedTransactionId;
    this.isRandomLengthProduct = this.spec.cutType === Environment.randomLengthCutType;
    this.isLengthUnitsFixed = this.checkIfIsLengthUnitsFixed();
    this.allocatedTransactionShortId = TransformHelper.getShortHexGuid(this.allocatedTransactionId);
    this.state = dto.state;
    if (this.soldTransactionId && this.state === ProductStateEnum.ON_HAND) this.state = ProductStateEnum.SOLD; // TODO define state
    this.archived = !!this.soldTransactionId;
    this.brokerContract = dto.brokerContract ? new ContractEntity().init(dto.brokerContract) : null;
    this.supplyContract = dto.supplyContract ? new ContractEntity().init(dto.supplyContract) : null;
    this.contract = this.getContract();
    this.openContract = this.getOpenContract();
    this.inventoryType = this.openContract?.isOpen ? ProductPurchaseMethod.CONTRACT : ProductPurchaseMethod.CASH;
    this.isContractType = this.inventoryType === ProductPurchaseMethod.CONTRACT;

    if (this.contract) {
      this.contractMargin = this.salesData.priceOfMerit - (this.contract.contractPrice || 0);
      this.ageOfMaterials = differenceInDays(new Date(), new Date(this.purchaseDate));
      this.badgeClass = ProductEntity.getContractBadgeClass(this.contract.state);
    }

    return this;
  }

  private checkIfIsLengthUnitsFixed(): boolean {
    if (!this.isRandomLengthProduct) return false;
    return (
      this.state === ProductStateEnum.ON_HAND ||
      this.state === ProductStateEnum.IN_TRANSIT ||
      this.state === ProductStateEnum.SOLD
    );
  }

  private getContract() {
    if (this.brokerContract && this.supplyContract) {
      return this.brokerContract.isOpen ? this.brokerContract : this.supplyContract;
    }

    return this.brokerContract || this.supplyContract;
  }

  private getOpenContract() {
    if (this.brokerContract?.isOpen) {
      return this.brokerContract;
    } else if (this.supplyContract?.isOpen) {
      return this.supplyContract;
    }

    return null;
  }
}
