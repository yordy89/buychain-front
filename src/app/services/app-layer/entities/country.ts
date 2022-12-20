export class Country {
  name: string;
  countryCallingCodes: string[];
  nameAbbreviations: string[];
  states: State[];
}
export class State {
  name: string;
  nameAbbreviation: string;
  cities: City[];
}
export class City {
  name: string;
  latitude: number;
  longitude: number;
  zipCodes: string[];
}
