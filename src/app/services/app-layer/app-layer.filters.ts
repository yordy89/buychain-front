import { ObjectUtil } from '@services/helpers/utils/object-util';
import { RoleInTransaction, ProductStateEnum, ProductLotPermissionEnum, TransactionStateEnum } from './app-layer.enums';
import { endOfDay, startOfDay, subDays } from 'date-fns';

export class TransactionFilter {
  owner = false;
  role?: RoleInTransaction;
  states: TransactionStateEnum[] = [];
  startDate?: any;
  endDate?: any;

  constructor() {
    this.states = ObjectUtil.enumToArray(TransactionStateEnum).filter(
      x => x !== TransactionStateEnum.Complete && x !== TransactionStateEnum.Canceled
    );
    this.role = null;
    this.startDate = subDays(startOfDay(new Date()), 30);
  }

  public init(dto) {
    Object.assign(this, dto);
    if (this.startDate) this.startDate = startOfDay(new Date(this.startDate));
    if (this.endDate) this.endDate = endOfDay(new Date(this.endDate));

    return this;
  }
}

export class InventoryFilter {
  shipFromIds?: Array<string>;
  states?: Array<ProductStateEnum>;
  permissions?: Array<ProductLotPermissionEnum>;
  allocated?: boolean;
  owner?: boolean;
  productGroups?: Array<{ name: string; products: string[] }>;
}

export class MarketFilter {
  shipFromIds?: Array<string>;
  organizationIds?: Array<string>;
  productGroups?: Array<{ name: string; products: string[] }>;
}
