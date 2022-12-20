import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { BuychainLibHelper } from '@services/helpers/utils/buychain-lib-helper';
import { ObjectUtil } from '@services/helpers/utils/object-util';
import { map, startWith, takeUntil } from 'rxjs/operators';
import { RailCarrier, RailCarrierService } from '@app/services/app-layer/rail-carrier/rail-carrier.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { RateTableService } from '@app/services/app-layer/rate-table/rate-table.service';
import { RailRestriction, TransportMethodType } from '@services/app-layer/entities/facility';
import { RoleInTransaction, TransactionStateEnum, TransportTermEnum } from '@app/services/app-layer/app-layer.enums';
import { SelectedTransportMethod, TransactionEntity } from '@services/app-layer/entities/transaction';
import { CountriesService } from '@app/services/app-layer/countries/countries.service';
import { Utils } from '@app/services/helpers/utils/utils';
import { RateTableItem } from '@app/services/app-layer/entities/rate-table';
import { FormGroupHelper } from '@services/helpers/utils/form-group-helper';
import { Environment } from '@services/app-layer/app-layer.environment';

@Component({
  selector: 'app-shipping-transportation',
  templateUrl: './shipping-transportation.component.html',
  styleUrls: ['./shipping-transportation.component.scss']
})
export class ShippingTransportationComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  public isLoaded = false;

  @Input() transactionData: TransactionEntity;
  @Input() selectedShipToFacility$: BehaviorSubject<any> = new BehaviorSubject<any>(null);
  @Input() transportationFormGroup: FormGroup;
  @Input() freightTermsFromControl: FormControl;
  @Input() estimatedShipDateFormControl: FormControl;

  public txTransportMethod: SelectedTransportMethod;
  public TransactionStateEnum = TransactionStateEnum;

  public railCarriers: RailCarrier[] = [];
  public filteredCarriers: Observable<RailCarrier[]>;

  public facilityRateTableEntries = [];
  public rateTableFilteredEntries = [];
  public showFacilityRateTables: boolean;

  public freightTerms = ObjectUtil.enumToArray(TransportTermEnum);
  public transportTypes = ObjectUtil.enumToArray(TransportMethodType);
  public railRestrictions = ObjectUtil.enumToArray(RailRestriction);

  public transportMethod: FormControl;
  public transportType: FormControl;
  public railCarrier: FormControl;
  public railRestriction: FormControl;
  public cost: FormControl;
  public railCarNumber: FormControl;

  public isModifyTransportMode: boolean;

  private maxShippingCost: number;

  isOpenFreightTooltip = false;

  get isOfferOnDelivered(): boolean {
    return (
      this.transactionData.role === RoleInTransaction.Seller &&
      (this.freightTermsFromControl.value === TransportTermEnum.FOB_DEST_PREPAY ||
        this.freightTermsFromControl.value === TransportTermEnum.FOB_ORIGIN_PREPAY)
    );
  }

  constructor(
    private rateTableService: RateTableService,
    private railCarrierService: RailCarrierService,
    private countriesService: CountriesService
  ) {
    this.createFormControls();
  }

  ngOnInit() {
    this.calculateMaxShippingCost();
    this.initializeRailCarriers();
    this.txTransportMethod = this.transactionData.trackingData.selectedTransportMethod || <SelectedTransportMethod>{};
    this.isModifyTransportMode =
      this.transactionData.state === TransactionStateEnum.Confirmed ||
      this.transactionData.state === TransactionStateEnum.InTransit;

    this.handleShipToFacilityChange();
    this.handleFreightTermChange();

    const sellerData = this.transactionData.trackingData.sellerData;
    if (sellerData?.onlineData?.shipFrom?.rateTableId) {
      this.initializeRateTables(sellerData.onlineData.shipFrom.rateTableId);
    }
    this.initializeTransportation();
  }
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.unsubscribe();
  }

  public toggleTransportationSelection(): void {
    this.showFacilityRateTables ? this.initializeTransportationFormGroup() : this.initializeRateTableSelectionFrom();
    this.showFacilityRateTables = !this.showFacilityRateTables;
    this.transportationFormGroup.markAsDirty();
  }

  public railCarrierDisplayExpression(value: RailCarrier) {
    if (value) return `${value.abbreviation} (${value.name})`;
  }

  private calculateMaxShippingCost(): void {
    this.maxShippingCost = Math.min(
      ...this.transactionData.tallyUnits.map(
        item =>
          BuychainLibHelper.getDeliveredPricePerUom(
            item,
            BuychainLibHelper.getDeliveryCostPerUom(
              this.transactionData.tallyUnits,
              this.transactionData.costData.shippingCost
            ),
            this.transactionData.trackingData.transportTerm
          ) * this.transactionData.tallyTotalMeasureTemporary
      )
    );
  }

  private initializeTransportation() {
    if (this.transactionData.trackingData.selectedTransportMethod || this.transactionData.isSellerCrm) {
      this.initializeTransportationFormGroup();
      this.showFacilityRateTables = false;
    } else {
      this.initializeRateTableSelectionFrom();
      this.showFacilityRateTables = true;
    }

    this.handleFormOnFreightTermChange();
    this.isLoaded = true;
  }

  private handleFormOnFreightTermChange(): void {
    this.onTransportTypeChange(this.transportType.value);
    if (this.transactionData.canSetShippingCost(this.freightTermsFromControl.value)) {
      this.cost.enable();
    } else {
      this.transportationFormGroup.markAsDirty();
      this.cost.setValue(0);
      this.cost.disable();
    }

    const maxValidator = this.isOfferOnDelivered
      ? Math.min(this.maxShippingCost, Environment.maxSafeNumber)
      : Environment.maxSafeNumber;
    maxValidator > 0
      ? this.cost.setValidators([Validators.required, Validators.min(0), Validators.max(maxValidator)])
      : this.cost.disable({ emitEvent: false });
    FormGroupHelper.markControlTouchedAndDirty(this.cost);

    this.rateTableFilteredEntries = this.filterRateTableEntriesOnTerm(this.facilityRateTableEntries);
  }

  private initializeRailCarriers() {
    this.railCarriers = this.railCarrierService
      .getRailCarriers()
      .sort((a, b) => a.abbreviation.localeCompare(b.abbreviation));
  }

  private createFormControls(): void {
    this.transportMethod = new FormControl('', [Validators.required]);
    this.transportType = new FormControl('', [Validators.required]);
    this.railCarrier = new FormControl('', [Validators.required]);
    this.railRestriction = new FormControl('', [Validators.required]);
    this.cost = new FormControl(0, [Validators.required, Validators.min(0), Validators.max(Environment.maxSafeNumber)]);
    this.railCarNumber = new FormControl('');
  }

  private initializeRateTableSelectionFrom() {
    this.cleanFormGroup();
    this.transportationFormGroup.setControl('transportMethod', this.transportMethod);
  }

  private initializeTransportationFormGroup() {
    this.transportType.setValue(this.txTransportMethod.type);
    this.railCarrier.setValue(this.railCarriers.find(x => x.abbreviation === this.txTransportMethod.carrier));
    this.railRestriction.setValue(this.txTransportMethod.railRestriction);
    this.railCarNumber.setValue(this.txTransportMethod.railCarNumber);
    if (!(this.txTransportMethod.type === TransportMethodType.Rail)) {
      this.railCarrier.disable({ emitEvent: false });
      this.railRestriction.disable({ emitEvent: false });
      this.railCarNumber.disable({ emitEvent: false });
    }
    this.cost.setValue(this.transactionData.costData.shippingCost || 0);

    this.cleanFormGroup();
    this.transportationFormGroup.setControl('transportType', this.transportType);
    this.transportationFormGroup.addControl('railCarrier', this.railCarrier);
    this.transportationFormGroup.addControl('railRestriction', this.railRestriction);
    this.transportationFormGroup.addControl('cost', this.cost);
    this.transportationFormGroup.addControl('railCarNumber', this.railCarNumber);

    this.filteredCarriers = this.railCarrier.valueChanges.pipe(
      startWith(''),
      map(value => this.railCarriersAutoCompleteFilter(value))
    );

    this.transportType.valueChanges.subscribe(newValue => this.onTransportTypeChange(newValue));
  }
  public cleanFormGroup(): void {
    Object.keys(this.transportationFormGroup.controls).forEach(item =>
      this.transportationFormGroup.removeControl(item)
    );
  }

  private railCarriersAutoCompleteFilter(value) {
    if (!value) return this.railCarriers;

    const filterValue = typeof value === 'object' ? value.abbreviation.toLowerCase() : value.toLowerCase();
    return this.railCarriers.filter(option => option.abbreviation.toLowerCase().includes(filterValue));
  }

  private onTransportTypeChange(newValue: TransportMethodType) {
    if (newValue === TransportMethodType.Rail) {
      this.railCarrier.enable();
      this.railRestriction.enable();
      this.railCarNumber.enable();
    } else {
      this.railCarrier.reset();
      this.railRestriction.reset();
      this.railCarNumber.reset();
      this.railCarrier.disable();
      this.railRestriction.disable();
      this.railCarNumber.disable();
    }
  }

  private initializeRateTables(rateTableId) {
    return this.rateTableService
      .getCompanyRateTableEntries(rateTableId)
      .pipe(takeUntil(this.destroy$))
      .subscribe(rateTableEntries => {
        this.facilityRateTableEntries = rateTableEntries;
        this.rateTableFilteredEntries = this.filterRateTableEntriesOnTerm(rateTableEntries);
      });
  }
  private filterRateTableEntriesOnTerm(entries: RateTableItem[]): RateTableItem[] {
    return entries.filter(entry => !this.isOfferOnDelivered || entry.cost <= this.maxShippingCost);
  }

  private sortByDistanceToFacility(entries: RateTableItem[], selectedFacility: any = null) {
    const selectedFacilityGeolocation = this.getFacilityGeoLocation(selectedFacility);
    if (selectedFacilityGeolocation) {
      this.sortByDistance(entries, selectedFacilityGeolocation);
    }
  }

  private sortByDistance(entries: RateTableItem[], geolocation) {
    entries.sort((a, b) => {
      const aCity = this.countriesService.getCityByName(a.destinationCountry, a.destinationState, a.destinationCity);
      const bCity = this.countriesService.getCityByName(b.destinationCountry, b.destinationState, b.destinationCity);

      const aDistance = Utils.calcStraightLineDistance(aCity, geolocation);
      const bDistance = Utils.calcStraightLineDistance(bCity, geolocation);

      if (aDistance === bDistance) {
        return a.cost - b.cost;
      } else {
        return aDistance - bDistance;
      }
    });
  }

  private getFacilityGeoLocation(facility) {
    let result = null;

    const isGeolocationSet = facility.geolocation && facility.geolocation.latitude && facility.geolocation.longitude;
    if (isGeolocationSet) {
      result = facility.geolocation;
    } else {
      const city = this.countriesService.getCityByName(facility.country, facility.state, facility.city);
      if (city) {
        result = { longitude: city.longitude, latitude: city.latitude };
      }
    }

    return result;
  }

  private handleShipToFacilityChange(): void {
    this.selectedShipToFacility$.pipe(takeUntil(this.destroy$)).subscribe(facility => {
      this.transportationFormGroup.reset();
      this.cost.setValue(0);
      if (facility) {
        this.sortByDistanceToFacility(this.facilityRateTableEntries, facility);
      }
    });
  }
  private handleFreightTermChange(): void {
    this.freightTermsFromControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.handleFormOnFreightTermChange();
    });
  }
}
