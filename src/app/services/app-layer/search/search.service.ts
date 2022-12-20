import { Injectable } from '@angular/core';
import { JournalEntryEntity } from '@services/app-layer/entities/journal-entries';
import { Observable } from 'rxjs';
import { first, map, mergeMap } from 'rxjs/operators';
import { FacilityEntity } from '@app/services/app-layer/entities/facility';
import { FacilitiesService } from '@app/services/app-layer/facilities/facilities.service';
import { RateTableService } from '../rate-table/rate-table.service';
import { Utils } from '@app/services/helpers/utils/utils';
import { ObjectUtil } from '@app/services/helpers/utils/object-util';
import { CountriesService } from '@app/services/app-layer/countries/countries.service';
import { CrmLocationEntity } from '@services/app-layer/entities/crm';
import { MarketSearchEntity } from '@services/app-layer/entities/market-search';
import {
  AdvancedFilterPayload,
  MarketSearchPayload,
  SearchApiService
} from '@services/app-layer/search/search-api.service';

export interface ProductDeliveryPricing {
  min?: any;
  max?: any;
  avg?: any;
  bestEstimate?: any;
  mbfCost?: any;
  mbfCostPlusBestEstimate?: any;
}
export interface ProductLotDeliveryPricing {
  min?: any;
  max?: any;
  avg?: any;
  closestDeliveryRate?: any;
}

const deliveryUnitNotAvailableMessage = 'No Matching Rate Table Entries';

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  constructor(
    private searchApi: SearchApiService,
    private facilitiesService: FacilitiesService,
    private rateTableService: RateTableService,
    private countriesService: CountriesService
  ) {}

  private rateTableEntryDistanceMap = new Map();

  public fetchJournalEntriesData(filters: AdvancedFilterPayload): Observable<JournalEntryEntity[]> {
    return this.searchApi
      .searchJournalEntries(filters)
      .pipe(map((items: unknown[]) => items.map(item => new JournalEntryEntity().init(item))));
  }

  public fetchMarketData(
    filters: MarketSearchPayload,
    shipToFacility?: FacilityEntity
  ): Observable<MarketSearchEntity[]> {
    filters = ObjectUtil.deleteEmptyProperties(filters);

    return this.searchApi.searchProductsMarket(filters).pipe(
      first(),
      mergeMap(async data => {
        const normalizedData = data.map(lot => new MarketSearchEntity().init(lot));
        if (shipToFacility) {
          for (const productLot of normalizedData) {
            productLot.deliveryPricing = await this.calcProductDeliveryPricing(productLot, shipToFacility);
          }
        }
        return normalizedData;
      })
    );
  }

  public fetchTransactionsByIds(ids: string[], isBackgroundRequest?: boolean): Observable<any> {
    const payload = {
      filters: {
        children: {
          logicalOperator: 'or',
          items: ids.map(id => ({ value: { comparisonOperator: 'eq', field: 'id', fieldValue: id } }))
        }
      }
    };
    return this.fetchTransactionData(payload, isBackgroundRequest);
  }

  public fetchTransactionData(payload: any, isBackgroundRequest?: boolean): Observable<any[]> {
    const cleanPayload = ObjectUtil.deleteEmptyProperties(payload);
    cleanPayload.limit = 1000;
    return this.fetchTransactionsListByOffset(cleanPayload, 0, [], isBackgroundRequest);
  }

  // recursively loads all the transactions chunk by chunk
  public fetchTransactionsListByOffset(
    payload: any,
    offset: number,
    transactions: any[],
    isBackgroundRequest: boolean
  ): Observable<any[]> {
    payload.offset = offset;
    return this.searchApi.searchTransactions(payload, isBackgroundRequest).pipe(
      first(),
      mergeMap(async (data: any[]) => {
        if (data.length === 1000) {
          const chunk = await this.fetchTransactionsListByOffset(
            payload,
            offset + 1000,
            data,
            isBackgroundRequest
          ).toPromise();
          data = data.concat(chunk);
        }
        return data;
      })
    );
  }

  public getInventoryProductsCountByFilters(payload: any): Observable<number> {
    return this.searchApi.searchProductsCount(payload).pipe(first());
  }

  public listInventoryLotsByFilters(payload: any): Observable<string[]> {
    return this.searchApi.searchProductsLot(payload).pipe(first());
  }

  public fetchInventoryProducts(payload: any, isBackgroundRequest?: boolean): Observable<any[]> {
    payload.limit = 1000;
    return this.fetchInventoryProductsListByOffset(payload, 0, [], isBackgroundRequest);
  }

  // recursively loads all the productLots chunk by chunk
  public fetchInventoryProductsListByOffset(
    payload: any,
    offset: number,
    products: any[],
    isBackgroundRequest: boolean
  ): Observable<any[]> {
    payload.offset = offset;
    return this.searchApi.searchProducts(payload, isBackgroundRequest).pipe(
      first(),
      mergeMap(async (data: any[]) => {
        products.push(...data);
        if (data.length === 1000) {
          await this.fetchInventoryProductsListByOffset(
            payload,
            offset + 1000,
            products,
            isBackgroundRequest
          ).toPromise();
        }
        return products;
      })
    );
  }

  /*
   * Private Helpers
   * */

  public async calcProductDeliveryPricing(
    productLot,
    shipToFacility: FacilityEntity | CrmLocationEntity
  ): Promise<ProductDeliveryPricing> {
    const result: ProductDeliveryPricing = {};

    const shipToCompanyId = productLot.organizationId;
    const shipToFacilityId = productLot.shipFromId;
    const lotPricing = await this.calcProductLotDeliveryPrice(shipToCompanyId, shipToFacilityId, shipToFacility);

    result.min = lotPricing.min || deliveryUnitNotAvailableMessage;
    result.max = lotPricing.max || deliveryUnitNotAvailableMessage;

    if (lotPricing.closestDeliveryRate) {
      result.bestEstimate = lotPricing.closestDeliveryRate || deliveryUnitNotAvailableMessage;
      result.mbfCostPlusBestEstimate = productLot.priceOfMerit + result.bestEstimate || deliveryUnitNotAvailableMessage;
    } else {
      result.bestEstimate = deliveryUnitNotAvailableMessage;
      result.mbfCostPlusBestEstimate = deliveryUnitNotAvailableMessage;
    }

    const availableCosts = [result.min, result.max, result.bestEstimate].filter(x => x > 0);
    availableCosts.length
      ? (result.avg = availableCosts.reduce((a, c) => a + c) / availableCosts.length)
      : (result.avg = deliveryUnitNotAvailableMessage);

    return result;
  }

  private async calcProductLotDeliveryPrice(
    shipFromCompanyId,
    shipFromFacilityId,
    shipTo: FacilityEntity | CrmLocationEntity
  ): Promise<ProductLotDeliveryPricing> {
    const result: ProductLotDeliveryPricing = {};

    const shipFrom = await this.facilitiesService.getCompanyFacility(shipFromCompanyId, shipFromFacilityId).toPromise();

    if (!shipFrom?.rateTableId) {
      return result;
    }

    const rateTableEntries = await this.rateTableService.getCompanyRateTableEntries(shipFrom.rateTableId).toPromise();
    if (!rateTableEntries?.length) {
      return result;
    }

    let shipToGeolocation = shipTo.geolocation;
    if (!shipToGeolocation) {
      const facilityCity = await this.countriesService.getCityByName(shipTo.country, shipTo.state, shipTo.city);
      if (facilityCity && facilityCity.latitude && facilityCity.longitude) {
        shipToGeolocation = {
          latitude: facilityCity.latitude,
          longitude: facilityCity.longitude
        };
      }
    }

    if (shipToGeolocation?.latitude) {
      await this.populateRateTableDistanceMap(rateTableEntries, shipTo);

      if (this.rateTableEntryDistanceMap.size) {
        const distanceMap = Array.from(this.rateTableEntryDistanceMap.values());
        const closestDestination = distanceMap.sort((a, b) => a.distance - b.distance)[0];
        result.closestDeliveryRate = closestDestination.entry.cost;
      }
    }

    const matchRateTableEntries = rateTableEntries.filter(
      x =>
        (x.destinationCountry === shipTo.country &&
          x.destinationState === shipTo.state &&
          x.destinationCity === shipTo.city) ||
        (x.destinationCountry === shipTo.country && x.destinationState === shipTo.state)
    );

    if (matchRateTableEntries.length) {
      const sortedByCost = matchRateTableEntries.sort((a, b) => a.cost - b.cost);
      result.min = sortedByCost[0].cost;
      result.max = sortedByCost[sortedByCost.length - 1].cost;
    }

    return result;
  }

  private async populateRateTableDistanceMap(rateTableEntries, shipTo) {
    for (const entry of rateTableEntries) {
      if (!this.rateTableEntryDistanceMap.has(entry.id)) {
        const entryCity = await this.countriesService.getCityByName(
          entry.destinationCountry,
          entry.destinationState,
          entry.destinationCity
        );
        if (entryCity && entryCity.latitude && entryCity.longitude) {
          const distance = Utils.calcStraightLineDistance(
            { latitude: shipTo.geolocation.latitude, longitude: shipTo.geolocation.longitude },
            { latitude: entryCity.latitude, longitude: entryCity.longitude }
          );
          this.rateTableEntryDistanceMap.set(entry.id, { entry, distance });
        }
      }
    }
  }
}
