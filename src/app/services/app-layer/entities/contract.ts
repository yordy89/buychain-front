import { ContractStateEnum, ProductStateEnum } from '@services/app-layer/app-layer.enums';
import { ProductLotSearchBase } from '@services/app-layer/entities/product';
import { ProductsHelper } from '@services/app-layer/products/products-helper';
import { ProductPriceHistory } from '@services/data-layer/http-api/base-api/swagger-gen';
import { BuychainLibHelper } from '@services/helpers/utils/buychain-lib-helper';
import { differenceInDays } from 'date-fns';

export class ContractProductEntity extends ProductLotSearchBase {
  productId: string;
  contractUnitsCount: number;
  openContractUnitsCount: number;
  closedContractUnitsCount: number;
  qtyPerProduct: number;
  qtyInUom: number;
  uomLabel: string;
  terms: string;
  contractPrice: number;
  ageOfMaterials: number;
  margin: number;
  supplier: string;
  broker: string;
  openedDate: string;
  closedDate: string;
  expirationDate: string;
  allProductsAreInActiveState: boolean;
  isAvailableForSelection: boolean;
  priceHistory: ProductPriceHistory;

  init(item: any) {
    this.productId = item.productId;
    super.init(item);

    this.computeUnitsCount();
    this.initDataFromFirstUnit();

    this.allProductsAreInActiveState = this.products.every(product =>
      [ProductStateEnum.ON_HAND, ProductStateEnum.ON_ORDER, ProductStateEnum.IN_TRANSIT].includes(product.state)
    );
    this.isAvailableForSelection =
      (!this.hasAllocatedProducts && this.allProductsAreInActiveState) || !!this.openContractUnitsCount;

    return this;
  }

  protected initDataFromFirstUnit() {
    super.initDataFromFirstUnit();

    const sampleProduct = this.products[0];
    const contract = sampleProduct.contract;

    if (!contract) {
      return;
    }

    this.supplier = contract.supplier;
    this.broker = contract.broker;
    this.openedDate = contract.openedDate;
    this.closedDate = contract.closedDate;
    this.expirationDate = contract.expirationDate;
    this.contractPrice = contract.contractPrice;
    this.margin = this.priceOfMerit - (this.contractPrice || 0);
    this.priceHistory = sampleProduct.priceHistory;
    this.ageOfMaterials = differenceInDays(new Date(), new Date(sampleProduct.dateHistory.purchaseDate));
  }

  private computeUnitsCount() {
    const contracts = this.products.map(product => product.contract).filter(val => !!val);

    if (!contracts.length) {
      return;
    }

    this.contractUnitsCount = contracts.length;
    this.closedContractUnitsCount = contracts.filter(contract => contract.isClosed).length;
    this.terms = contracts[0].terms;
    this.openContractUnitsCount = this.contractUnitsCount - this.closedContractUnitsCount;
    this.qtyPerProduct = BuychainLibHelper.getUomValue(this.spec);
    this.qtyInUom = this.qtyPerProduct * this.products.length;
    this.uomLabel = ProductsHelper.getMeasureLabel(this.spec);
  }
}

export class ContractEntity {
  state: ContractStateEnum;
  supplier: string;
  broker: string;
  number: string;
  readonly internalRefNumber: number;
  openedDate: string;
  closedDate: string;
  contractPrice: number;
  expirationDate: string;
  terms: string;
  isDraft: boolean;
  isOpen: boolean;
  isClosed: boolean;

  init(dto) {
    Object.assign(this, dto);
    this.isDraft = this.state === ContractStateEnum.DRAFT;
    this.isOpen = this.state === ContractStateEnum.OPEN;
    this.isClosed = this.state === ContractStateEnum.CLOSED;
    return this;
  }
}
