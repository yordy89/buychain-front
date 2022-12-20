import { Injectable } from '@angular/core';
import { Environment } from '@services/app-layer/app-layer.environment';
import { Utils } from '@services/helpers/utils/utils';
import { DashboardHelperService } from '@views/main/dashboard/dashboard-helper.service';
import { DataSourceEnum } from '@views/main/dashboard/dashboard-state.service';
import { Observable, of, Subject } from 'rxjs';
import { TransactionEntity } from '@services/app-layer/entities/transaction';
import { debounceTime, tap } from 'rxjs/operators';

export interface TradersMetrics {
  totalMargin: { current: number; previous: number };
  averageMarginPercentage: { current: number; previous: number };
  averageMargin: { current: number; previous: number };
  todayMargin: { current: number; previous: number };
  medianOrdersPerDay: number;
}

@Injectable({
  providedIn: 'root'
})
export class TradersDashboardHelperService {
  private resetCacheTimer$ = new Subject<void>();
  private transactions: TransactionEntity[];
  private _lastRefreshedTime: Date;

  constructor(private dashboardHelperService: DashboardHelperService) {
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

  normalizeManagerTxsData(period: string, txs: TransactionEntity[]): any[] {
    return this.dashboardHelperService.normalizeManagerTxsData(period, txs);
  }

  calculateMetrics(tradersDashboardData: any[]): TradersMetrics {
    const result: TradersMetrics = this.getDefaultMetrics();
    const currentRange = tradersDashboardData.map(i => i);
    currentRange.shift();
    const previousRange = tradersDashboardData.map(i => i);
    previousRange.pop();
    result.totalMargin.current = this.calcTotalMargin(
      currentRange.reduce((acc, cur) => [...acc, ...cur.confirmedTxs], [])
    );
    result.totalMargin.previous = this.calcTotalMargin(
      previousRange.reduce((acc, cur) => [...acc, ...cur.confirmedTxs], [])
    );

    result.averageMarginPercentage.current = this.avgMarginPercentage(
      currentRange.reduce((acc, cur) => [...acc, ...cur.confirmedTxs], [])
    );
    result.averageMarginPercentage.previous = this.avgMarginPercentage(
      previousRange.reduce((acc, cur) => [...acc, ...cur.confirmedTxs], [])
    );

    result.averageMargin.current = this.dashboardHelperService.calcAvg(
      currentRange.reduce((acc, cur) => [...acc, ...cur.confirmedTxs.map(t => t.profit)], [])
    );
    result.averageMargin.previous = this.dashboardHelperService.calcAvg(
      previousRange.reduce((acc, cur) => [...acc, ...cur.confirmedTxs.map(t => t.profit)], [])
    );

    result.todayMargin.current = currentRange[currentRange.length - 1].confirmedTxs.reduce(
      (acc, cur) => acc + cur.profit,
      0
    );
    result.todayMargin.previous = previousRange[previousRange.length - 1].confirmedTxs.reduce(
      (acc, cur) => acc + cur.profit,
      0
    );

    result.medianOrdersPerDay = this.dashboardHelperService.calcMedian(
      currentRange.map(item => item.confirmedTxs.length)
    );

    return result;
  }

  private avgMarginPercentage(data: TransactionEntity[]) {
    if (!data.length) return 0;
    const avgMargin = this.calcTotalMargin(data) / this.calcTotalRevenue(data);
    return Math.round(avgMargin * 100) / 100;
  }

  private calcTotalMargin(data: TransactionEntity[]) {
    return data.reduce((sum, current) => sum + current.profit, 0);
  }

  private calcTotalRevenue(data: TransactionEntity[]) {
    return data.reduce((sum, current) => sum + current.totalPrice, 0);
  }

  getDefaultMetrics(): TradersMetrics {
    return {
      totalMargin: { current: 0, previous: 0 },
      averageMarginPercentage: { current: 0, previous: 0 },
      averageMargin: { current: 0, previous: 0 },
      todayMargin: { current: 0, previous: 0 },
      medianOrdersPerDay: 0
    };
  }

  getTradersDashboardData(sourceType: DataSourceEnum = DataSourceEnum.MOCK): Observable<TransactionEntity[]> {
    if (this.transactions) {
      this.resetCacheTimer$.next();
      return of(this.transactions);
    }

    return this.dashboardHelperService.getTransactionsData(sourceType, true).pipe(
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
