import { Injectable } from '@angular/core';
import { ConstantDataHelperService } from '@services/helpers/constant-data-helper/constant-data-helper.service';
import { Country, City } from '../entities/country';

@Injectable({
  providedIn: 'root'
})
export class CountriesService {
  private countries: Country[];

  constructor(private constantDataHelperService: ConstantDataHelperService) {}

  public getCountries(): Country[] {
    if (!this.countries) {
      this.countries = this.constantDataHelperService.getCountries().map(country => {
        if (country.name === 'United States') {
          country.nameAbbreviations = ['USA', 'US'];
        } else if (country.name === 'Canada') {
          country.nameAbbreviations = ['CA'];
        }
        return country;
      });
    }
    return this.countries;
  }

  public getCityByName(countryName: string, stateName: string, cityName: string): City {
    const country = this.getCountries().find(x => x.name === countryName);
    if (!country) return null;
    const state = country.states.find(x => x.name === stateName);
    if (!state) return null;
    return state.cities.find(x => x.name === cityName);
  }

  public getCountryAbbreviation(name: string) {
    const country = this.getCountries().find(x => x.name === name);
    if (!country) throw new Error(`no any country found with ${name}`);
    return country.nameAbbreviations[0];
  }

  public getStateAbbreviation(countryName: string, stateName: string) {
    const country = this.getCountries().find(x => x.name === countryName);
    if (!country) throw new Error(`country with ${countryName} not found`);

    const state = country.states.find(x => x.name === stateName);
    if (!state) throw new Error(`state with ${stateName} not found`);

    return state.nameAbbreviation;
  }
}
