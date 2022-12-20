import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import { FormGroup } from '@angular/forms';
import { CountriesService } from '@services/app-layer/countries/countries.service';
import { City, Country, State } from '@services/app-layer/entities/country';
import { Subject } from 'rxjs';
import { distinctUntilChanged, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-address-form',
  templateUrl: 'address-form.component.html',
  styleUrls: ['./address-form.component.scss']
})
export class AddressFormComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() isRequired = false;
  @Input() form: FormGroup;
  @Input() isReadonly = false;
  @Input() countryRequired = false;
  @Input() stateRequired = false;
  @Input() cityRequired = false;
  @Input() zipCodeRequired = false;
  @Output() cityChange = new EventEmitter();

  countryList: Country[] = [];
  states: State[] = [];
  cities: City[] = [];
  zipCodes: string[] = [];

  private destroy$ = new Subject<void>();

  constructor(private countriesService: CountriesService, private cd: ChangeDetectorRef) {}

  ngOnInit() {
    this.populateLists();
  }

  ngAfterViewInit() {
    this.handleCountryChange();
    this.handleStateChange();
    this.handleCityChange();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onEnter(event) {
    event.preventDefault();

    const items = this.getOrderedControlNodes();
    let targetIndex = items.findIndex(item => item === event.target);

    targetIndex++;
    items[targetIndex]?.focus();
  }

  private getOrderedControlNodes() {
    return Array.from(document.querySelectorAll('.address-form input')).filter(
      item => !item['disabled']
    ) as HTMLElement[];
  }

  get country() {
    return this.form.get('country');
  }

  get state() {
    return this.form.get('state');
  }

  get city() {
    return this.form.get('city');
  }

  get zipCode() {
    return this.form.get('zipCode');
  }

  private handleCountryChange() {
    this.country.valueChanges.pipe(distinctUntilChanged(), takeUntil(this.destroy$)).subscribe(countryName => {
      const country = this.countryList.find(item => item.name === countryName);

      if (!country) {
        this.state.setValue('');
        this.state.disable();
      } else if (country.states) {
        this.state.enable();
        this.state.setValue('');
        this.states = country.states;
        this.cd.markForCheck();
      }
    });
  }

  private handleStateChange() {
    this.state.valueChanges.pipe(distinctUntilChanged(), takeUntil(this.destroy$)).subscribe(stateName => {
      const state = this.states.find(item => item.name === stateName);

      if (!state) {
        this.city.setValue('');
        this.city.disable();
        return;
      } else {
        this.city.enable();
      }

      if (state.cities) {
        this.city.setValue('');
        this.cities = state.cities;
        this.cd.markForCheck();
      }
    });
  }

  private handleCityChange() {
    this.city.valueChanges.pipe(distinctUntilChanged(), takeUntil(this.destroy$)).subscribe(cityName => {
      const city = this.cities.find(item => item.name === cityName);
      this.cityChange.emit(city);

      if (!cityName) {
        this.zipCode.setValue('');
        this.zipCode.disable();
        return;
      } else {
        this.zipCode.enable();
      }

      if (city?.zipCodes) {
        this.zipCode.setValue('');
        this.zipCodes = city.zipCodes;
        this.cd.markForCheck();
      }
    });
  }

  private populateLists(): void {
    this.countryList = this.countriesService.getCountries();
    const country = this.form.value.country;
    this.states = country ? this.countryList.find(c => c.name === country)?.states : [];
    const state = this.form.value.state;
    this.cities = state ? this.states.find(s => s.name === state).cities : [];
    const city = this.form.value.city;

    if (!country) {
      this.state.setValue('');
      this.state.disable();
    }

    if (!state) {
      this.city.setValue('');
      this.city.disable();
    }

    if (!city) {
      this.zipCode.setValue('');
      this.zipCode.disable();
    }
  }
}
