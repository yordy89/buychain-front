import { OrderStateEnum, OrderTypeEnum, StockSubTypeEnum } from '../app-layer.enums';

export class OrderEntity {
  id: string;
  updatedAt: Date;
  createdAt: Date;
  ownerData: { company: string; user: string };
  state: OrderStateEnum;
  type: OrderTypeEnum;
  subtype: StockSubTypeEnum;
  stockData: {
    transactions: string[];
  };

  init(dto) {
    Object.assign(this, dto);

    return this;
  }
}

export class BasicOrder {
  type: OrderTypeEnum;
  subtype: StockSubTypeEnum;
}
