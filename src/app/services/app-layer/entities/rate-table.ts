import { TransportMethodEntity } from './facility';
import { RateTableUom } from '../app-layer.enums';

export class RateTableComplete {
  id: string;
  companyId: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  entries: RateTableItem[];

  init(dto) {
    Object.assign(this, dto);
    return this;
  }
}

export class RateTable {
  id?: string;
  name: string;
  description: string;
  createdAt?: string;
  updatedAt?: string;
  numberEntries?: number;

  init(dto) {
    Object.assign(this, dto);
    return this;
  }
}

export class RateTableItem {
  id?: string;
  createdAt?: string;
  updatedAt?: string;
  destinationShortName: string;
  destinationDescription: string;
  cost: number;
  transportMethod: TransportMethodEntity;
  destinationState: string;
  destinationCity: string;
  destinationCountry: string;
  capacity: number;
  uom: RateTableUom;

  init(dto) {
    Object.assign(this, dto);
    return this;
  }
}
