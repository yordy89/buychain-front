import { Injectable } from '@angular/core';
import { ConstantDataHelperService } from '@services/helpers/constant-data-helper/constant-data-helper.service';

export interface RailCarrier {
  name: string;
  abbreviation: string;
}

@Injectable({
  providedIn: 'root'
})
export class RailCarrierService {
  constructor(private constantDataHelperService: ConstantDataHelperService) {}

  getRailCarriers(): RailCarrier[] {
    return this.constantDataHelperService.getRailCarriers();
  }
}
