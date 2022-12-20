import { Component, OnInit, ChangeDetectionStrategy, Input } from '@angular/core';
import { BillOfLadingEntity } from '@app/services/app-layer/entities/bill-of-lading';
import { CrmLocationEntity } from '@app/services/app-layer/entities/crm';
import { FacilityEntity } from '@app/services/app-layer/entities/facility';
import { CountriesService } from '@app/services/app-layer/countries/countries.service';

@Component({
  selector: 'app-bill-of-lading',
  templateUrl: './bill-of-lading.component.html',
  styleUrls: ['../common/pdf-templates.common.scss', './bill-of-lading.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BillOfLadingComponent implements OnInit {
  @Input() billOfLadingData: BillOfLadingEntity;

  public currentDate = new Date();

  public sellerCompany: any = {};
  public shipToLocation: any = {};
  public buyerContact: any = {};

  public receivingHours = '';
  public receivingNotes = '';
  public receivingPersonnel: any[] = [];

  public shipFromFacility: any = {};
  public sellerContact: any = {};

  public loadingHours = '';
  public loadingNotes = '';
  public loadingPersonnel: any[] = [];

  constructor(private countryService: CountriesService) {}

  ngOnInit() {
    this.sellerCompany = this.billOfLadingData.sellerCompany;
    this.shipToLocation = this.billOfLadingData.shipTo;
    this.buyerContact = this.billOfLadingData.buyer;

    this.receivingHours = this.shipToLocation.link
      ? this.shipToLocation.link.receivingHours
      : this.shipToLocation.receivingHours;
    this.receivingNotes = this.shipToLocation.link
      ? this.shipToLocation.link.receivingNotes
      : this.shipToLocation.receivingNotes;
    this.receivingPersonnel = this.extractReceivingPersonnel(this.shipToLocation);

    this.shipFromFacility = this.billOfLadingData.shipFrom;
    this.sellerContact = this.billOfLadingData.seller;

    this.loadingHours = this.shipFromFacility.link
      ? this.shipFromFacility.link.loadingHours
      : this.shipFromFacility.loadingHours;
    this.loadingNotes = this.shipFromFacility.link
      ? this.shipFromFacility.link.loadingNotes
      : this.shipFromFacility.loadingNotes;
    this.loadingPersonnel = this.extractLoadingPersonnel(this.shipFromFacility);
  }

  public spacerRowHeight() {
    return Math.max(300 - 50 * this.billOfLadingData.availableTallyUnits.length, 0);
  }

  public extractReceivingPersonnel(locationOrFacility): any[] {
    const facility = locationOrFacility.link || locationOrFacility;
    return facility.personnel ? facility.personnel.filter(x => x.department === 'RECEIVING') : [];
  }

  public extractLoadingPersonnel(locationOrFacility): any[] {
    const facility = locationOrFacility.link || locationOrFacility;
    return facility.personnel ? facility.personnel.filter(x => x.department === 'LOADING') : [];
  }

  public buildAddress(location: CrmLocationEntity | FacilityEntity): string {
    const availableAddressParts = [];

    if (location.streetAddress) availableAddressParts.push(location.streetAddress);
    if (location.city) availableAddressParts.push(location.city);
    if (location.state)
      availableAddressParts.push(this.countryService.getStateAbbreviation(location.country, location.state));
    if (location.country) availableAddressParts.push(this.countryService.getCountryAbbreviation(location.country));
    if (location.zipCode) availableAddressParts.push(location.zipCode);

    return availableAddressParts.join(', ');
  }
}
