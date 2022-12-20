import { Injectable } from '@angular/core';
import { Environment } from '@services/app-layer/app-layer.environment';
import { Utils } from '@services/helpers/utils/utils';
import { DashboardHelperService } from '@views/main/dashboard/dashboard-helper.service';
import { DataSourceEnum } from '@views/main/dashboard/dashboard-state.service';
import { Observable, of, Subject } from 'rxjs';
import { SearchService } from '@services/app-layer/search/search.service';
import { TransactionAggregated, TransactionEntity } from '@services/app-layer/entities/transaction';
import { debounceTime, tap } from 'rxjs/operators';

export interface ManagersMetrics {
  medianOrdersPerDay: { current: number; previous: number };
  averageOrdersPerDay: { current: number; previous: number };
  averageRevenuePerDay: { current: number; previous: number };
  averageMarginPerDay: { current: number; previous: number };
  averageOrdersPerPerson: { current: number; previous: number };
}

@Injectable({
  providedIn: 'root'
})
export class ManagersDashboardHelperService {
  private resetCacheTimer$ = new Subject<void>();
  private transactions: TransactionEntity[];
  private _lastRefreshedTime: Date;

  constructor(private searchService: SearchService, private dashboardHelperService: DashboardHelperService) {
    this.resetCacheTimer$.pipe(debounceTime(Environment.cachedDataResetTime)).subscribe(() => {
      this.resetCache();
    });
  }

  lastUpdatedTimeDiffString(): string {
    return Utils.lastUpdatedTimeDiffString(this._lastRefreshedTime);
  }

  resetCache() {
    this.transactions = null;
  }

  getDefaultMetrics(): ManagersMetrics {
    return {
      medianOrdersPerDay: { current: 0, previous: 0 },
      averageOrdersPerDay: { current: 0, previous: 0 },
      averageRevenuePerDay: { current: 0, previous: 0 },
      averageMarginPerDay: { current: 0, previous: 0 },
      averageOrdersPerPerson: { current: 0, previous: 0 }
    };
  }

  calculateMetrics(dataArr: any[]): ManagersMetrics {
    const result: ManagersMetrics = this.getDefaultMetrics();
    const currentRange = dataArr.map(i => i);
    currentRange.shift();
    const previousRange = dataArr.map(i => i);
    previousRange.pop();
    result.medianOrdersPerDay.current = this.dashboardHelperService.calcMedian(
      currentRange.map(item => item.confirmedTxs.length)
    );
    result.medianOrdersPerDay.previous = this.dashboardHelperService.calcMedian(
      previousRange.map(item => item.confirmedTxs.length)
    );

    result.averageOrdersPerDay.current = this.dashboardHelperService.calcAvg(
      currentRange.map(item => item.confirmedTxs.length)
    );
    result.averageOrdersPerDay.previous = this.dashboardHelperService.calcAvg(
      previousRange.map(item => item.confirmedTxs.length)
    );

    result.averageRevenuePerDay.current = this.dashboardHelperService.calcAvg(
      currentRange.map(item => item.confirmedTxs.reduce((acc, cur) => acc + cur.totalPrice, 0))
    );
    result.averageRevenuePerDay.previous = this.dashboardHelperService.calcAvg(
      previousRange.map(item => item.confirmedTxs.reduce((acc, cur) => acc + cur.totalPrice, 0))
    );

    result.averageMarginPerDay.current = this.dashboardHelperService.calcAvg(
      currentRange.map(item => item.confirmedTxs.reduce((acc, cur) => acc + cur.profit, 0))
    );
    result.averageMarginPerDay.previous = this.dashboardHelperService.calcAvg(
      previousRange.map(item => item.confirmedTxs.reduce((acc, cur) => acc + cur.profit, 0))
    );

    result.averageOrdersPerPerson.current = this.calcAvgOrdersPerPerson(
      currentRange.reduce((acc, cur) => [...acc, ...cur.confirmedTxs], [])
    );
    result.averageOrdersPerPerson.previous = this.calcAvgOrdersPerPerson(
      previousRange.reduce((acc, cur) => [...acc, ...cur.confirmedTxs], [])
    );

    return result;
  }

  normalizeManagerTxsData(period: string, txs: TransactionEntity[]): any[] {
    return this.dashboardHelperService.normalizeManagerTxsData(period, txs);
  }

  private calcAvgOrdersPerPerson(data: TransactionAggregated[]) {
    const groupedByDate = this.dashboardHelperService.groupBy(data, 'sellerName');
    const orderCountByPerson = Object.keys(groupedByDate).map(key => groupedByDate[key].length);
    if (orderCountByPerson.length) {
      return this.dashboardHelperService.calcAvg(orderCountByPerson);
    } else {
      return null;
    }
  }

  getManagersDashboardData(sourceType: DataSourceEnum = DataSourceEnum.MOCK): Observable<TransactionEntity[]> {
    if (this.transactions) {
      this.resetCacheTimer$.next();
      return of(this.transactions);
    }
    return this.dashboardHelperService.getTransactionsData(sourceType, false).pipe(
      tap(transactions => {
        this.transactions = transactions;
        this.resetCacheTimer$.next();
        this.setLastRefreshedTime(new Date());
        return this.transactions;
      })
    );
  }

  private setLastRefreshedTime(time: Date) {
    this._lastRefreshedTime = time;
  }
}
