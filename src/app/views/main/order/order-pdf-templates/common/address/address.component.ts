import { Component, Input } from '@angular/core';
import { CountriesService } from '@app/services/app-layer/countries/countries.service';
import { CrmLocationEntity } from '@app/services/app-layer/entities/crm';
import { FacilityEntity } from '@app/services/app-layer/entities/facility';

@Component({
  selector: 'app-address',
  templateUrl: './address.component.html',
  styleUrls: ['./address.component.scss']
})
export class AddressComponent {
  @Input() Address1Header: string;
  @Input() Address2Header: string;
  @Input() Address3Header: string;
  @Input() Account1: any = {};
  @Input() Account2: any = {};
  @Input() Account3: any = {};
  @Input() Location1: any = {};
  @Input() Contact1: any = {};
  @Input() Location2: any = {};
  @Input() Contact2: any = {};
  @Input() Location3: any = {};
  @Input() Contact3: any = {};

  constructor(private countryService: CountriesService) {}

  public buildAddressLine2(location: CrmLocationEntity | FacilityEntity): string {
    const availableAddressParts = [];

    if (location.city) availableAddressParts.push(location.city);
    if (location.state)
      availableAddressParts.push(this.countryService.getStateAbbreviation(location.country, location.state));
    if (location.country) availableAddressParts.push(this.countryService.getCountryAbbreviation(location.country));
    if (location.zipCode) availableAddressParts.push(location.zipCode);

    return availableAddressParts.join(', ');
  }
}
