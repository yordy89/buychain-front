import { ProductsHelper } from '@services/app-layer/products/products-helper';
import { BuychainLibHelper } from '@services/helpers/utils/buychain-lib-helper';
import { SpecHelper } from '@services/helpers/utils/spec-helper';
import { TransformHelper } from '@services/helpers/utils/transform-helper';
import { Product, ProductsUpdatePermissionBulkPayload } from '@services/data-layer/http-api/base-api/swagger-gen';
import PermissionEnum = ProductsUpdatePermissionBulkPayload.PermissionEnum;
import { ProductSpecExtended } from '@services/app-layer/entities/product';

export class InventoryAuditGridEntity {
  productLotId: string;
  productLot: any;
  productId: string;
  trackingNumber: string;
  originMfg: string;
  state: string;
  specShorthand: string;
  spec: ProductSpecExtended;
  qty: number;
  allocated: string; // yes or no boolean
  permission: PermissionEnum;
  costBasisPerUOM: number;
  priceSystem: string;
  value: number; // cost basis
  purchaseDate: Date;
  landedDate: Date;
  custodyDate?: Date;
  soldDate: Date;
  ownerId: string;

  seasoning: string;
  pattern: string;
  species: string;
  subspecies: string;
  grade: string;
  subGrade: string;
  cutType: string;
  thickness: number | '';
  length: string;
  lengthInInch: number | '';
  width: number | '';

  public init(product: Product) {
    this.trackingNumber = product.trackingNumber;
    this.productLotId = TransformHelper.getShortHexGuid(product.lot);
    this.productLot = product.lot;
    this.productId = product.id;
    this.originMfg = product.mfgFacilityShortName;
    this.state = TransformHelper.stringUnderscoreToSpaceTitleCase(product.state);
    this.specShorthand = product.specShorthand;
    this.spec = { ...product.spec, specShorthand: this.specShorthand };
    this.qty = Math.round(BuychainLibHelper.getUomValue(product.spec) * 1000) / 1000;
    this.priceSystem = product.spec.priceSystem;
    this.allocated = product.allocatedTransactionId ? 'Yes' : 'No';
    this.permission = product.permission;
    this.value = Math.round(product.priceHistory.costBasis * 100) / 100;
    this.costBasisPerUOM =
      Math.round((product.priceHistory.costBasis / BuychainLibHelper.getUomValue(product.spec)) * 100) / 100;
    this.purchaseDate = product.dateHistory?.purchaseDate ? new Date(product.dateHistory.purchaseDate) : null;
    this.landedDate = product.dateHistory?.landedDate ? new Date(product.dateHistory.landedDate) : null;
    this.custodyDate = product.dateHistory?.custodyDate ? new Date(product.dateHistory.custodyDate) : null;
    this.soldDate = product.dateHistory?.soldDate ? new Date(product.dateHistory.soldDate) : null;

    this.seasoning = product.spec.seasoning;
    this.pattern = product.spec.pattern;
    this.species = product.spec.species;
    this.subspecies = product.spec.subspecies;
    this.grade = product.spec.grade;
    this.subGrade = product.spec.subGrade;
    this.cutType = product.spec.cutType;
    this.thickness = ProductsHelper.getValeFromTargetDimension(product.spec.thickness);
    this.length = product.spec.length
      ? product.spec.length.name + SpecHelper.getUomSymbol(product.spec.length.uom)
      : '';
    this.lengthInInch = ProductsHelper.getValeFromTargetDimension(product.spec.length);
    this.width = ProductsHelper.getValeFromTargetDimension(product.spec.width);
    this.ownerId = product.owner;

    return this;
  }
}
