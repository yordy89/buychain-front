import { Injectable } from '@angular/core';
import { TransactionStateEnum } from '@services/app-layer/app-layer.enums';
import { Environment } from '@services/app-layer/app-layer.environment';
import { TransactionAggregated, TransactionEntity } from '@services/app-layer/entities/transaction';
import { SearchService } from '@services/app-layer/search/search.service';
import { ObjectUtil } from '@services/helpers/utils/object-util';
import { DataSourceEnum } from '@views/main/dashboard/dashboard-state.service';
import { addDays, endOfDay, startOfDay, subDays, subMonths, subWeeks } from 'date-fns';
import { Observable, of } from 'rxjs';
import { first, map } from 'rxjs/operators';
import { Utils } from '@services/helpers/utils/utils';

@Injectable({
  providedIn: 'root'
})
export class DashboardHelperService {
  constructor(private searchService: SearchService) {}

  getRandomGeolocation() {
    const geolocations = [
      { country: 'USA', state: 'New York', city: 'New York', lat: 40.6635, long: -73.9387 },
      { country: 'USA', state: 'California', city: 'Los Angeles', lat: 41.8376, long: -87.6818 },
      { country: 'USA', state: 'Illinois', city: 'Chicago', lat: 34.0194, long: -118.4108 },
      { country: 'USA', state: 'Houston', city: 'Texas', lat: 29.7866, long: -95.3909 },
      { country: 'USA', state: 'Arizona', city: 'Phoenix', lat: 33.5722, long: -112.0901 },
      { country: 'USA', state: 'Pennsylvania', city: 'Philadelphia', lat: 40.0094, long: -75.1333 },
      { country: 'USA', state: 'Texas', city: 'San Antonio', lat: 29.4724, long: -98.5251 },
      { country: 'USA', state: 'California', city: 'San Diego', lat: 32.8153, long: -117.135 },
      { country: 'USA', state: 'Texas', city: 'Dallas', lat: 32.7933, long: -96.7665 },
      { country: 'USA', state: 'California', city: 'San Jose', lat: 37.2967, long: -121.8189 },
      { country: 'USA', state: 'Texas', city: 'Austin', lat: 30.3039, long: -97.7544 },
      { country: 'USA', state: 'Florida', city: 'Jacksonville', lat: 30.3369, long: -81.6616 },
      { country: 'USA', state: 'Texas', city: 'Fort Worth', lat: 32.7815, long: -97.3467 },
      { country: 'USA', state: 'Ohio', city: 'Columbus', lat: 39.9852, long: -82.9848 },
      { country: 'USA', state: 'California', city: 'San Francisco', lat: 37.7272, long: -123.0322 },
      { country: 'USA', state: 'North Carolina', city: 'Charlotte', lat: 35.2078, long: -80.831 }
    ];

    const rndLocation = Math.floor(Math.random() * geolocations.length);
    return geolocations[rndLocation];
  }

  calcMedian(values: number[]) {
    if (values.length === 0) return 0;
    values.sort(function (a, b) {
      return a - b;
    });
    const half = Math.floor(values.length / 2);
    if (values.length % 2) return values[half];
    return (values[half - 1] + values[half]) / 2.0;
  }

  calcAvg(numbers: number[], ofCount: number = null) {
    const total = ofCount || numbers.length;

    if (!total) {
      return 0;
    }

    const sum = numbers.reduce((acc, current) => acc + current, 0);
    return Math.round((sum / total) * 100) / 100;
  }

  getTransactionsData(sourceType: DataSourceEnum, includeSeller = false): Observable<TransactionEntity[]> {
    return sourceType === DataSourceEnum.MOCK
      ? this.getMockedAggregatedTransactionsData()
      : this.getAggregatedTransactionsData(includeSeller);
  }

  normalizeManagerTxsData(period, txs: TransactionEntity[]): any[] {
    const extendedTxs = txs.map(t => this.extendTransaction(t));

    const groupedByQuoteDate = this.groupBy(extendedTxs, 'quoteDateString');
    const groupedByConfirmedDate = this.groupBy(extendedTxs, 'confirmedDateString');

    const normalizedTxs = [];
    let date = this.getStartDate(period);

    while (date < this.getEndDate()) {
      const dateString = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
      const quoteTxs = groupedByQuoteDate[dateString] ? groupedByQuoteDate[dateString] : [];
      const confirmedTxs = groupedByConfirmedDate[dateString] ? groupedByConfirmedDate[dateString] : [];
      normalizedTxs.push({ date, quoteTxs, confirmedTxs });
      date = addDays(date, 1);
    }

    return normalizedTxs;
  }

  groupBy(items, key) {
    return items.reduce(
      (result, item) => ({
        ...result,
        [item[key]]: [...(result[item[key]] || []), item]
      }),
      {}
    );
  }

  private getSearchTxPayload(period, includeSeller = false): any {
    const statesPayload = {
      value: { comparisonOperator: 'ne', field: 'state', fieldValue: TransactionStateEnum.Draft }
    };
    const vendorPayload = {
      value: { field: 'vendorOnline', comparisonOperator: 'eq', fieldValue: Environment.getCurrentUser().companyId }
    };
    const sellerPayload = {
      value: { field: 'sellerOnline', comparisonOperator: 'eq', fieldValue: Environment.getCurrentUser().id }
    };
    const nonCanceledPayload = Utils.getSearchTxCancelStateExcludePayload();
    const nonArchivedPayload = Utils.getSearchTxExcludeArchivedPayload();

    const date = this.getStartDate(period);
    const startDatePayload = {
      children: {
        logicalOperator: 'or',
        items: [
          { value: { field: 'confirmedDate', comparisonOperator: 'gte', fieldValue: date } },
          { value: { field: 'quoteDate', comparisonOperator: 'gte', fieldValue: date } }
        ]
      }
    };

    const filters: any = {
      children: {
        logicalOperator: 'and',
        items: includeSeller
          ? [statesPayload, vendorPayload, startDatePayload, nonCanceledPayload, nonArchivedPayload, sellerPayload]
          : [statesPayload, vendorPayload, startDatePayload, nonCanceledPayload, nonArchivedPayload]
      }
    };
    return {
      filters: filters,
      fields: ['trackingData', 'costData', 'state', 'register', 'tally']
    };
  }

  private getAggregatedTransactionsData(includeSeller = false): Observable<TransactionEntity[]> {
    const payload = this.getSearchTxPayload(includeSeller);
    return this.searchService.fetchTransactionData(payload).pipe(
      first(),
      map(txs => txs.map(t => new TransactionEntity().init(t)))
    );
  }

  private getMockedAggregatedTransactionsData(onlyCurrentUserData = false): Observable<TransactionEntity[]> {
    if (onlyCurrentUserData) {
      const userId = 'test1';
      return of(this.buildMockData()).pipe(map(transactions => transactions.filter(x => x.sellerId === userId)));
    } else {
      return of(this.buildMockData());
    }
  }

  private buildMockData(): any[] {
    const result: TransactionAggregated[] = [];

    for (let index = 0; index < 1000; index++) {
      const item = new TransactionAggregated();

      const txNumbers = ['at4kx', '3ofw', 'adfpo', '13oih', 'xtrt'];
      item.transactionNumber = txNumbers[Math.floor(Math.random() * txNumbers.length)] + Math.floor(Math.random() * 99);

      const descriptionTexts = [
        'As it so contrasted oh estimating instrument',
        'Size like body some one had',
        'Far far away, behind the word mountains',
        'The Big Oxmox advised her not to do so',
        'Pityful a rethoric question ran over her cheek',
        'The quick, brown fox jumps over a lazy dog.',
        'Few quips galvanized the mock jury box.',
        'A wizard’s job is to vex chumps quickly in fog.',
        'Quick wafting zephyrs vex bold Jim.',
        'A small river named Duden flows by their place',
        'Even the all-powerful Pointing has no control about the blind texts'
      ];
      item.description = descriptionTexts[Math.floor(Math.random() * descriptionTexts.length)];

      const states = ObjectUtil.enumToArray(TransactionStateEnum).filter(
        x =>
          x !== TransactionStateEnum.Draft &&
          x !== TransactionStateEnum.Canceled &&
          x !== TransactionStateEnum.ChangePending
      );
      item.state = states[Math.floor(Math.random() * states.length)];

      item.isConfirmedOrHigherState =
        item.state === TransactionStateEnum.Confirmed ||
        item.state === TransactionStateEnum.InTransit ||
        item.state === TransactionStateEnum.Complete;

      item.profit = Math.abs(Math.floor(Math.random() * 10001) - 5000);
      item.totalCost = Math.abs(Math.floor(Math.random() * 1000001) - 500000);
      item.totalPrice = Math.abs(Math.floor(Math.random() * 1000001) - 500000);

      const rangeEnd = new Date();
      const rangeStart = subDays(new Date(), 40);
      let rndDate = new Date(rangeStart.getTime() + Math.random() * (rangeEnd.getTime() - rangeStart.getTime()));

      item.date = startOfDay(rndDate);
      item.year = rndDate.getFullYear();
      item.month = rndDate.getMonth() + 1;
      item.day = rndDate.getDate();
      item.dateString = `${item.year}-${item.month}-${item.day}`;
      item.quoteDateString = `${item.year}-${item.month}-${item.day}`;
      rndDate = addDays(rndDate, Math.floor(Math.random() * 6) + 1);
      item.year = rndDate.getFullYear();
      item.month = rndDate.getMonth() + 1;
      item.day = rndDate.getDate();
      item.confirmedDateString = `${item.year}-${item.month}-${item.day}`;

      const plusOneMonth = subDays(new Date(), 5);
      const minusOneMonth = addDays(new Date(), 15);
      const rndEstShipDate = new Date(
        minusOneMonth.getTime() + Math.random() * (plusOneMonth.getTime() - minusOneMonth.getTime())
      );
      const isWeekend = rndEstShipDate.getDay() === 6 || rndEstShipDate.getDay() === 0;
      item.estimatedShipDate = isWeekend ? new Date(rndEstShipDate.getDate() + 2) : rndEstShipDate;

      const productGroups = ['Lumber', 'Panel', 'Engineered'];
      item.productGroup = productGroups[Math.floor(Math.random() * productGroups.length)];

      const persons = [
        {
          id: 'test1',
          name: 'Astrid',
          photo: '/assets/images/profile-photos/astrid.png'
        },
        {
          id: 'test2',
          name: 'Frida',
          photo: '/assets/images/profile-photos/frida.png'
        },
        {
          id: 'test3',
          name: 'Hilda',
          photo: '/assets/images/profile-photos/hilda.png'
        },
        {
          id: 'test4',
          name: 'Arne',
          photo: '/assets/images/profile-photos/arne.png'
        },
        {
          id: 'test5',
          name: 'Halfdan',
          photo: '/assets/images/profile-photos/halfdan.png'
        },
        {
          id: 'test6',
          name: 'Knud',
          photo: '/assets/images/profile-photos/knud.png'
        },
        {
          id: 'test7',
          name: 'Torsten',
          photo: '/assets/images/profile-photos/torsten.png'
        },
        {
          id: 'test8',
          name: 'Frode',
          photo: '/assets/images/profile-photos/frode.png'
        },
        {
          id: 'test9',
          name: 'George',
          photo: '/assets/images/profile-photos/george.png'
        },
        {
          id: 'test10',
          name: 'Andrew',
          photo: '/assets/images/profile-photos/andrew.png'
        }
      ];

      const rndPersonIndex = Math.floor(Math.random() * persons.length);
      item.sellerId = persons[rndPersonIndex].id;
      item.sellerName = persons[rndPersonIndex].name;
      item.sellerProfilePictureUrl = persons[rndPersonIndex].photo;

      item.getSeller = () => ({
        id: item.sellerId,
        name: item.sellerName,
        profilePictureUrl: item.sellerProfilePictureUrl
      });

      const companyNames = ['Atlantic', 'Seaboard', 'Gulf Coast', 'Evergreen', 'Burnout Wood', 'House Builders'];
      item.buyingCompanyName = companyNames[Math.floor(Math.random() * companyNames.length)];

      const facilityNames = ['Bend Saw Mill', 'Rivershed Mill', 'Coast Gulf', 'Evergreen', 'Burnout F2', 'Builders F1'];
      item.shipToFacilityName = facilityNames[Math.floor(Math.random() * facilityNames.length)];

      item.producer = companyNames[Math.floor(Math.random() * companyNames.length)];

      const { country, state, city, lat, long } = this.getRandomGeolocation();
      item.shipToLatitude = lat;
      item.shipToLongitude = long;

      item.shipToCountry = country;
      item.shipToState = state;
      item.shipToCity = city;
      item.getShipTo = () => ({ country: item.shipToCountry, state: item.shipToState, city: item.shipToCity });

      result.push(item);
    }

    return result;
  }

  private extendTransaction(tx: TransactionEntity): any {
    tx['quoteDateString'] =
      tx['quoteDateString'] || `${tx.quoteDate.getFullYear()}-${tx.quoteDate.getMonth() + 1}-${tx.quoteDate.getDate()}`;
    tx['confirmedDateString'] =
      tx['confirmedDateString'] ||
      (tx.confirmedDate
        ? `${tx.confirmedDate.getFullYear()}-${tx.confirmedDate.getMonth() + 1}-${tx.confirmedDate.getDate()}`
        : null);
    return tx;
  }

  getStartDate(period: string): Date {
    switch (period) {
      case 'lastWeek':
        return subWeeks(startOfDay(new Date()), 1);

      case 'lastMonth':
        return subMonths(startOfDay(new Date()), 1);

      default:
        return startOfDay(new Date());
    }
  }

  private getEndDate(): Date {
    return endOfDay(new Date());
  }
}
