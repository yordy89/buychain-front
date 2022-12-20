import { Injectable } from '@angular/core';
import { Utils } from '@services/helpers/utils/utils';
import { DashboardHelperService } from '@views/main/dashboard/dashboard-helper.service';
import { DataSourceEnum } from '@views/main/dashboard/dashboard-state.service';
import { forkJoin, Observable, of, Subject } from 'rxjs';
import { debounceTime, first, map } from 'rxjs/operators';
import { Environment } from '@services/app-layer/app-layer.environment';
import { SearchService } from '@services/app-layer/search/search.service';
import { CrmLocationEntity } from '@services/app-layer/entities/crm';
import { CountriesService } from '@services/app-layer/countries/countries.service';
import { CrmService } from '@services/app-layer/crm/crm.service';
import { TransactionAggregated } from '@services/app-layer/entities/transaction';
import { TransactionStateEnum } from '@services/app-layer/app-layer.enums';
import * as usaMapData from 'devextreme/dist/js/vectormap-data/usa.js';
import * as canadaMapData from 'devextreme/dist/js/vectormap-data/canada.js';
import * as worldMapData from 'devextreme/dist/js/vectormap-data/world.js';

@Injectable({
  providedIn: 'root'
})
export class DefaultDashboardHelperService {
  private crmLocations: CrmLocationEntity[];
  private transactions: TransactionAggregated[];
  private resetCacheTimer$ = new Subject<void>();
  private _lastRefreshedTime: Date;

  constructor(
    private searchService: SearchService,
    private countriesService: CountriesService,
    private crmService: CrmService,
    private dashboardHelperService: DashboardHelperService
  ) {
    this.resetCacheTimer$.pipe(debounceTime(Environment.cachedDataResetTime)).subscribe(() => {
      this.resetCache();
    });
  }

  lastUpdatedTimeDiffString(): string {
    return Utils.lastUpdatedTimeDiffString(this._lastRefreshedTime);
  }

  resetCache() {
    this.transactions = null;
    this.crmLocations = null;
  }

  customizeBubbles(elements, productGroups) {
    elements.forEach(element => {
      const productGroupName = element.attribute('productGroup');
      const group = productGroups.find(x => x.name === productGroupName);
      if (group) {
        element.applySettings({ color: group.color });
      }
    });
  }

  customizeText(arg, defaultDashboardData) {
    if (arg.layer.type === 'area') {
      if (!defaultDashboardData) return;

      let resultHtml = '';

      const stateName = arg.attribute('name');
      resultHtml += stateName;

      const stateData = defaultDashboardData.filter(x => x.shipToState === stateName);
      resultHtml += stateData.length ? `<br>Total Order: ${stateData.length}` : '<br>No Orders';

      const countByProductGroup = stateData.reduce((acc, current) => {
        acc[current.productGroup] ? acc[current.productGroup]++ : (acc[current.productGroup] = 1);
        return acc;
      }, {});

      resultHtml += Object.keys(countByProductGroup).map(x => `<br>${x}: ${countByProductGroup[x]}`);

      return { html: resultHtml };
    } else {
      const productGroup = arg.attribute('productGroup');
      const count = arg.attribute('count');
      const facilityNames = arg.attribute('facilityNames');

      return {
        html: `Product Group: ${productGroup}
        <br> Orders Count: ${count}
        <br> Facilities: ${facilityNames}`
      };
    }
  }

  mapToMarkers(data) {
    const markers = [];

    const havingGeolocation = data.filter(x => x.latitude);
    const groupedByProduct = this.dashboardHelperService.groupBy(havingGeolocation, 'productGroup');

    Object.keys(groupedByProduct).forEach(productKey => {
      const groupedByLatitude = this.dashboardHelperService.groupBy(groupedByProduct[productKey], 'latitude');

      Object.keys(groupedByLatitude).forEach(latKey => {
        const groupedByLongitude = this.dashboardHelperService.groupBy(groupedByLatitude[latKey], 'longitude');

        Object.keys(groupedByLongitude).forEach(longKey => {
          const facilityNames = groupedByLongitude[longKey].map(x => x.txData?.shipToFacilityName);
          const distinctFacilityNames = Array.from(new Set(facilityNames));
          const count = groupedByLongitude[longKey].length;
          const size = count;

          markers.push({
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [longKey, latKey]
            },
            properties: {
              text: `${productKey} - ${size}`,
              value: size,
              count: count,
              productGroup: productKey,
              long: longKey,
              lat: latKey,
              facilityNames: distinctFacilityNames
            }
          });
        });
      });
    });
    return markers;
  }

  getLayers() {
    return [
      {
        country: 'usa',
        mapData: usaMapData.usa,
        isVisible: true,
        zoomFactor: 8,
        bubbleSizeMin: 5,
        bubbleSizeMax: 30,
        center: [-96.61434375000003, 38.92009283194161]
      },
      {
        country: 'canada',
        mapData: canadaMapData.canada,
        isVisible: false,
        zoomFactor: 6,
        bubbleSizeMin: 5,
        bubbleSizeMax: 30,
        center: [-96.61434375000003, 42]
      },
      {
        country: 'world',
        mapData: worldMapData.world,
        isVisible: false,
        zoomFactor: 1.5,
        bubbleSizeMin: 5,
        bubbleSizeMax: 15,
        center: [0, 44]
      }
    ];
  }

  getDefaultDashboardData(
    sourceType: DataSourceEnum = DataSourceEnum.MOCK,
    period: string,
    onlyCurrentUserData = null
  ): Observable<TransactionAggregated[]> {
    return sourceType === DataSourceEnum.MOCK
      ? this.getMockedAggregatedTransactionsData(onlyCurrentUserData)
      : this.getAggregatedTransactionsData(period, onlyCurrentUserData);
  }

  getAggregatedTransactionsData(period: string, onlyCurrentUserData = null): Observable<TransactionAggregated[]> {
    if (this.transactions && this.crmLocations) {
      this.resetCacheTimer$.next();
      return of(this.transactions);
    }

    return forkJoin([
      this.searchService.fetchTransactionData(this.getSearchTxPayload(period, onlyCurrentUserData)),
      this.crmService.getLocations()
    ]).pipe(
      first(),
      map(([transactions, locations]) => {
        this.crmLocations = locations;
        this.transactions = this.formatTransactionsData(transactions);
        this.resetCacheTimer$.next();
        this.setLastRefreshedTime(new Date());
        return this.transactions;
      })
    );
  }

  private formatTransactionsData(transactions) {
    return transactions
      .filter(tx => tx.trackingData?.buyerData?.crmData?.shipTo?.id)
      .map(tx => ({
        ...tx,
        productGroup: this.getTxProductGroup(tx.costData.soldTally[0]),
        shipToFacilityName: tx?.trackingData?.buyerData?.crmData?.shipTo?.shortName
      }))
      .map(tx => this.getShipToGeolocation(tx));
  }

  private getTxProductGroup(tallyUnit): string {
    return tallyUnit?.lineItem?.spec?.productGroupName;
  }

  private getSearchTxPayload(period: string, onlyCurrentUserData = false): any {
    const statesPayload = {
      children: {
        logicalOperator: 'or',
        items: [
          { value: { comparisonOperator: 'eq', field: 'state', fieldValue: TransactionStateEnum.Confirmed } },
          { value: { comparisonOperator: 'eq', field: 'state', fieldValue: TransactionStateEnum.InTransit } },
          { value: { comparisonOperator: 'eq', field: 'state', fieldValue: TransactionStateEnum.Complete } },
          { value: { comparisonOperator: 'eq', field: 'state', fieldValue: TransactionStateEnum.ChangePending } }
        ]
      }
    };
    const vendorPayload = {
      value: { field: 'vendorOnline', comparisonOperator: 'eq', fieldValue: Environment.getCurrentUser().companyId }
    };
    const sellerPayload = {
      value: { field: 'sellerOnline', comparisonOperator: 'eq', fieldValue: Environment.getCurrentUser().id }
    };
    const date = this.dashboardHelperService.getStartDate(period);
    const startDatePayload = { value: { field: 'confirmedDate', comparisonOperator: 'gte', fieldValue: date } };
    const filters: any = {
      children: {
        logicalOperator: 'and',
        items: [statesPayload, vendorPayload, startDatePayload]
      }
    };
    if (onlyCurrentUserData) filters.children.items.push(sellerPayload);
    return {
      filters: filters,
      fields: ['trackingData', 'costData']
    };
  }

  getMockedAggregatedTransactionsData(onlyCurrentUserData = false): Observable<TransactionAggregated[]> {
    if (onlyCurrentUserData) {
      const userId = 'test1';
      return of(this.buildMockData()).pipe(map(transactions => transactions.filter(x => x.sellerId === userId)));
    } else {
      return of(this.buildMockData());
    }
  }

  private getShipToGeolocation(tx): any {
    return { txData: tx, productGroup: tx.productGroup, ...this.getShipToFacility(tx) };
  }

  private getShipToFacility(tx): any {
    const shipToId = tx.trackingData?.buyerData?.crmData?.shipTo?.id;

    const location = this.crmLocations.find(f => f.id === shipToId);

    if (!location) return undefined;

    const latitude = location.geolocation?.latitude || undefined;
    const longitude = location.geolocation?.longitude || undefined;
    const country = location.country;
    const state = location.state;
    const city = location.city;

    const crmGeoInfo = { latitude, longitude, country, state, city };

    if (country && state && city && !latitude) {
      const cityGeo = this.getCityGeoLocation({ country, state, city });
      crmGeoInfo.latitude = cityGeo?.latitude;
      crmGeoInfo.longitude = cityGeo?.longitude;
    }

    return crmGeoInfo;
  }

  private getCityGeoLocation(facility) {
    const countries = this.countriesService.getCountries();
    const country = countries.find(x => x.name === facility.country);
    if (!country?.states?.length) return <any>{};
    const state = country.states.find(x => x.name === facility.state);
    if (!state?.cities?.length) return <any>{};
    const city = state.cities.find(x => x.name === facility.city);
    return city || <any>{};
  }

  private buildMockData(): any[] {
    const result: any[] = [];

    for (let index = 0; index < 1000; index++) {
      const item: any = {};

      const productGroups = ['Lumber', 'Panel', 'Engineered'];
      item.productGroup = productGroups[Math.floor(Math.random() * productGroups.length)];

      const facilityNames = ['Bend Saw Mill', 'Rivershed Mill', 'Coast Gulf', 'Evergreen', 'Burnout F2', 'Builders F1'];
      item.shipToFacilityName = facilityNames[Math.floor(Math.random() * facilityNames.length)];

      const { lat, long, country, state, city } = this.dashboardHelperService.getRandomGeolocation();

      item.latitude = lat;
      item.longitude = long;

      item.country = country;
      item.state = state;
      item.city = city;

      result.push(item);
    }

    return result;
  }

  private setLastRefreshedTime(time: Date) {
    this._lastRefreshedTime = time;
  }
}
