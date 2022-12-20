import { Facility, TransportMethod } from '@app/services/data-layer/http-api/base-api/swagger-gen';

export enum FacilityPersonnelType {
  Loading = 'LOADING',
  Receiving = 'RECEIVING'
}

export enum TransportMethodType {
  Truck = 'TRUCK',
  Rail = 'RAIL',
  HeavyTruck = 'HEAVY_TRUCK',
  ShipFreeOnBoard = 'SHIP_FREE_ON_BOARD',
  ShipCargo = 'SHIP_CARGO'
}

export enum RailRestriction {
  Open = 'OPEN',
  Closed = 'CLOSED'
}

export class Geolocation {
  longitude: number = null;
  latitude: number = null;
}

export class TransportMethodEntity {
  id?: string;
  type: TransportMethodType;
  carrier?: string;
  railRestriction?: RailRestriction;
  updatedAt?: string;
  createdAt?: string;
  cost: any;

  constructor(dto: TransportMethod) {
    Object.assign(this, dto);
  }
}

export class FacilityPersonnelEntity {
  id: string;
  userId: string;
  description: string;
  department: FacilityPersonnelType;

  constructor(dto: any) {
    Object.assign(this, dto);
  }
}

export class FacilityEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
  shortName: string;
  description: string;
  origin: boolean;
  streetAddress: string;
  country: string;
  state: string;
  city: string;
  zipCode: string;
  personnel: FacilityPersonnelEntity[];
  transportMethods: TransportMethodEntity[];
  rateTableId?: string;
  generalHours?: string;
  generalNotes?: string;
  loadingHours?: string;
  loadingNotes?: string;
  receivingHours?: string;
  receivingNotes?: string;
  careOf?: string;
  archived: boolean;
  logoUrl: string;
  geolocation = new Geolocation();
  hasGeolocation: boolean;

  constructor(data: Facility) {
    Object.assign(this, data);
    this.hasGeolocation = this.checkIfHasGeolocation();
  }

  public checkIfHasGeolocation(): boolean {
    return !!(this.geolocation.latitude && this.geolocation.longitude);
  }
}
