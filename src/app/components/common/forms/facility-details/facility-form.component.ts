import { Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { BehaviorSubject, noop, Subject } from 'rxjs';
import { FacilityEntity } from '@app/services/app-layer/entities/facility';
import { ImageResourceType } from '@app/services/app-layer/media/media.service';
import { CountriesService } from '@app/services/app-layer/countries/countries.service';
import { City } from '@app/services/app-layer/entities/country';
import { CrmLocationEntity } from '@services/app-layer/entities/crm';
import { takeUntil } from 'rxjs/operators';
import { FormGroupHelper } from '@services/helpers/utils/form-group-helper';
import { DxMapComponent } from 'devextreme-angular';

@Component({
  selector: 'app-facility-form',
  templateUrl: './facility-form.component.html',
  styleUrls: ['./facility-form.component.scss']
})
export class FacilityFormComponent implements OnInit, OnDestroy {
  @Input() parentForm: FormGroup;

  private _facilityData: FacilityEntity | CrmLocationEntity | any;
  @Input() set facilityData(value: FacilityEntity | CrmLocationEntity | any) {
    this._facilityData = value;
    if (value) {
      this.setFormData(value);
    }
  }
  get facilityData(): FacilityEntity | CrmLocationEntity | any {
    return this._facilityData;
  }
  @Input() readonlyMode$: BehaviorSubject<boolean> = new BehaviorSubject(true);

  @Input() isCrm = false;
  @ViewChild(DxMapComponent) mapElem: DxMapComponent;

  public isMapReady = false;

  public form: FormGroup;
  public shortName: FormControl;
  public streetAddress: FormControl;
  public country: FormControl;
  public state: FormControl;
  public city: FormControl;
  public zipCode: FormControl;
  public careOf: FormControl;
  public generalHours: FormControl;
  public generalNotes: FormControl;
  public logoUrl: FormControl;
  public latitude: FormControl;
  public longitude: FormControl;

  public ImageResourceType = ImageResourceType;
  public mapMarkers = [];
  readonly mapDefaultView = '47.746681982187646, -97.7795432001953';

  private destroy$ = new Subject<void>();

  public initialCountry: any;
  public initialState: any;
  public initialCity: any;
  public initialZipCode: any;

  constructor(public countriesService: CountriesService) {
    this.createFormControls();
    this.createForm();
  }

  ngOnInit() {
    this.extendParentFormGroup(this.parentForm);
    this.readonlyMode$.pipe(takeUntil(this.destroy$)).subscribe(() => this.setFormData(this.facilityData));
  }

  onCityChange(city: City) {
    if (!city) {
      return;
    }

    if (city.latitude && city.longitude) {
      this.updateLocation(city.latitude, city.longitude);
    } else {
      this.setAddressMapMarker();
    }
  }

  public onMapReady(event) {
    const v8Map = event.originalMap.getV8Map();

    let longPressTimer;
    v8Map.pointerPressed.add(e => {
      longPressTimer = setTimeout(() => {
        this.updateLocation(e.location.latitude, e.location.longitude);
      }, 450);
    });
    v8Map.pointerReleased.add(() => {
      clearTimeout(longPressTimer);
    });
    v8Map.pointerMoved.add(() => {
      clearTimeout(longPressTimer);
    });

    this.isMapReady = true;
  }

  public updateLocation(lat, lng) {
    this.latitude.setValue(lat);
    this.longitude.setValue(lng);
    this.setGeolocationControlsDirty();
    this.setGeolocationMapMarker();
  }

  private setGeolocationControlsDirty(): void {
    this.longitude.value === this.facilityData?.geolocation?.longitude
      ? FormGroupHelper.markControlUntouchedAndPristine(this.longitude)
      : FormGroupHelper.markControlTouchedAndDirty(this.longitude);
    this.latitude.value === this.facilityData?.geolocation?.latitude
      ? FormGroupHelper.markControlUntouchedAndPristine(this.latitude)
      : FormGroupHelper.markControlTouchedAndDirty(this.latitude);
  }

  public ngOnDestroy(): void {
    // a hack to suppress throwing an error from DxMap component  when we leave from a page before map emitted onReady event
    if (!this.isMapReady) {
      this.mapElem.instance['_triggerReadyAction'] = noop;
    }
    this.destroy$.next();
    this.destroy$.unsubscribe();
  }

  /*
   * private helpers
   * */
  private createFormControls(): void {
    this.shortName = new FormControl('', [Validators.required, Validators.maxLength(35)]);
    this.streetAddress = new FormControl('', [Validators.maxLength(50)]);
    this.country = new FormControl('', [Validators.maxLength(30)]);
    this.state = new FormControl('', [Validators.maxLength(30)]);
    this.city = new FormControl('', [Validators.maxLength(20)]);
    this.zipCode = new FormControl('', [Validators.maxLength(30)]);

    this.careOf = new FormControl('', [Validators.maxLength(100)]);
    this.generalHours = new FormControl('', [Validators.maxLength(1000)]);
    this.generalNotes = new FormControl('', [Validators.maxLength(1000)]);
    this.logoUrl = new FormControl();
    this.latitude = new FormControl();
    this.longitude = new FormControl();
  }

  private createForm(): void {
    this.form = new FormGroup({
      streetAddress: this.streetAddress,
      country: this.country,
      state: this.state,
      city: this.city,
      zipCode: this.zipCode,
      careOf: this.careOf,
      generalHours: this.generalHours,
      generalNotes: this.generalNotes,
      logoUrl: this.logoUrl,
      geolocation: new FormGroup({
        latitude: this.latitude,
        longitude: this.longitude
      }),
      shortName: this.shortName
    });
  }

  private setFormData(data: FacilityEntity): void {
    if (!data) return;

    this.streetAddress.setValue(data.streetAddress);
    this.careOf.setValue(data.careOf);
    this.generalHours.setValue(data.generalHours);
    this.generalNotes.setValue(data.generalNotes);
    this.country.setValue(data.country);
    this.state.setValue(data.state);
    this.city.setValue(data.city);
    this.zipCode.setValue(data.zipCode);
    this.logoUrl.setValue(data.logoUrl);
    this.shortName.setValue(data.shortName);

    this.initialCountry = data.country;
    this.initialState = data.state;
    this.initialCity = data.city;
    this.initialZipCode = data.zipCode;

    if (data.geolocation && data.geolocation.latitude && data.geolocation.longitude) {
      this.latitude.setValue(data.geolocation.latitude);
      this.longitude.setValue(data.geolocation.longitude);
      this.setGeolocationControlsDirty();
      this.setGeolocationMapMarker();
    } else {
      this.setAddressMapMarker();
    }
  }

  private loadCountryFields(): void {
    if (this.country.value || !this.facilityData) return;
    const facilityCountry = this.facilityData.country;
    const currentCountry = this.countriesService.getCountries().find(country => country.name === facilityCountry);

    if (currentCountry) {
      this.country.setValue(currentCountry.name);
      const currentState = currentCountry.states.find(state => state.name === this.state.value);

      if (currentState) {
        this.state.setValue(currentState.name);
      }
    }
  }

  private extendParentFormGroup(parentForm: FormGroup): void {
    parentForm.addControl('facility', this.form || new FormGroup({}));
  }

  private setGeolocationMapMarker() {
    if (this.latitude.value && this.longitude.value) {
      this.mapMarkers = [
        {
          location: [this.latitude.value, this.longitude.value],
          tooltip: {
            isShown: true,
            text: this.shortName.value
          }
        }
      ];
    }
  }

  private setAddressMapMarker() {
    const city = this.city.value ? this.city.value + ', ' : '';
    const state = this.state.value ? this.state.value + ', ' : '';
    const country = this.country.value ? this.country.value : '';
    const address = `${city}${state}${country}`;
    if (!address) return (this.mapMarkers = []);
    this.mapMarkers = [
      {
        location: address,
        tooltip: {
          isShown: true,
          text: address
        }
      }
    ];
  }
}
