import { Injectable } from '@angular/core';
import { TransactionEntity } from '@services/app-layer/entities/transaction';
import { SalesTimeSeriesEnum, TransactionStateEnum } from '@services/app-layer/app-layer.enums';
import { Environment } from '@services/app-layer/app-layer.environment';
import { SalesPerformanceChartEntity } from '@services/app-layer/entities/sales-performance-chart';
import { ObjectUtil } from '@services/helpers/utils/object-util';
import { MemberEntity } from '@services/app-layer/entities/member';
import { FilterBuilderHelper } from '@services/helpers/utils/filter-builder-helper';
import {
  addDays,
  addMonths,
  addQuarters,
  addWeeks,
  endOfDay,
  setDate,
  setMonth,
  startOfDay,
  startOfMonth,
  subDays,
  subMonths
} from 'date-fns';
import { Utils } from '@services/helpers/utils/utils';

const memberSeries = [
  SalesTimeSeriesEnum.PerUserDay,
  SalesTimeSeriesEnum.PerUserWeek,
  SalesTimeSeriesEnum.PerUserMonth,
  SalesTimeSeriesEnum.PerUserQuarter,
  SalesTimeSeriesEnum.PerUserYearToDate
];
const customerSeries = [
  SalesTimeSeriesEnum.PerCustomerDay,
  SalesTimeSeriesEnum.PerCustomerWeek,
  SalesTimeSeriesEnum.PerCustomerMonth,
  SalesTimeSeriesEnum.PerCustomerQuarter,
  SalesTimeSeriesEnum.PerCustomerYearToDate
];

@Injectable({
  providedIn: 'root'
})
export class SalesPerformanceService {
  public readonly monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
  public readonly filterFields: Array<any> = [
    {
      dataField: 'state',
      caption: 'State',
      filterOperations: ['=', '<>'],
      lookup: {
        dataSource: [],
        valueExpr: 'value',
        displayExpr: 'displayValue'
      }
    },
    {
      dataField: 'customerCrm',
      caption: 'Customer (CRM-Company)',
      filterOperations: ['=', '<>'],
      lookup: {
        dataSource: [],
        valueExpr: 'id',
        displayExpr: 'fullName'
      }
    },
    {
      dataField: 'buyerCrm',
      caption: 'Buyer (CRM-Customer)',
      filterOperations: ['=', '<>'],
      lookup: {
        dataSource: [],
        valueExpr: 'id',
        displayExpr: 'fullName'
      }
    },
    {
      dataField: 'sellerOnline',
      caption: 'Seller',
      filterOperations: ['=', '<>'],
      lookup: {
        dataSource: [],
        valueExpr: 'id',
        displayExpr: 'name'
      }
    },
    {
      dataField: 'shipToCrm',
      caption: 'Ship To',
      filterOperations: ['=', '<>'],
      lookup: {
        dataSource: [],
        valueExpr: 'id',
        displayExpr: 'fullName'
      }
    },
    {
      dataField: 'shipFromOnline',
      caption: 'Ship From',
      filterOperations: ['=', '<>'],
      lookup: {
        dataSource: [],
        valueExpr: 'id',
        displayExpr: 'shortName'
      }
    },
    // {
    //   dataField: 'spec',
    //   caption: 'Spec',
    //   dataType: 'string',
    //   filterOperations: ['contains', 'notcontains'],
    // },
    {
      dataField: 'transportMethodType',
      caption: 'Transport Method Type',
      filterOperations: ['=', '<>'],
      lookup: {
        dataSource: [],
        valueExpr: 'value',
        displayExpr: 'displayValue'
      }
    },
    {
      dataField: 'quoteDate',
      caption: 'Quote Date',
      dataType: 'date',
      filterOperations: ['=', '<>', 'between', '<', '>', '>=', '<=']
    },
    {
      dataField: 'reviewDate',
      caption: 'Review Date',
      dataType: 'date',
      filterOperations: ['=', '<>', 'between', '<', '>', '>=', '<=']
    },
    {
      dataField: 'confirmedDate',
      caption: 'Confirmed Date',
      dataType: 'date',
      filterOperations: ['=', '<>', 'between', '<', '>', '>=', '<=']
    },
    {
      dataField: 'inTransitDate',
      caption: 'In-Transit Date',
      dataType: 'date',
      filterOperations: ['=', '<>', 'between', '<', '>', '>=', '<=']
    },
    {
      dataField: 'completeDate',
      caption: 'Complete Date',
      dataType: 'date',
      filterOperations: ['=', '<>', 'between', '<', '>', '>=', '<=']
    }
  ];
  public readonly userBasedSeries = [...memberSeries, ...customerSeries];
  private readonly fiscalYearStart: number;

  private selectedSeries: SalesTimeSeriesEnum = null;
  private selectedTxState: TransactionStateEnum = null;
  public uniquePriceSystem = null;

  constructor() {
    this.fiscalYearStart = this.monthNames.findIndex(
      m => m.toLowerCase() === Environment.getCurrentCompany().accountingPractices.fiscalYearStart.toLowerCase()
    );
  }

  public filterTransactionsByState(
    transactions: TransactionEntity[],
    selectedState: TransactionStateEnum
  ): TransactionEntity[] {
    switch (selectedState) {
      case TransactionStateEnum.Confirmed:
        return transactions.filter(t => t.passedTheState(TransactionStateEnum.Review));
      case TransactionStateEnum.InTransit:
        return transactions.filter(t => t.passedTheValidState(TransactionStateEnum.Confirmed));
      case TransactionStateEnum.Complete:
        return transactions.filter(t => t.passedTheState(TransactionStateEnum.InTransit));
      case TransactionStateEnum.Review:
        return transactions.filter(t => t.passedTheState(TransactionStateEnum.Quote));
      case TransactionStateEnum.Quote:
        return transactions.filter(t => t.passedTheState(TransactionStateEnum.Draft));
      default:
        return transactions;
    }
  }

  public generateNormalizedData(
    txs: TransactionEntity[],
    selectedTxState: TransactionStateEnum,
    selectedArgumentField: SalesTimeSeriesEnum,
    usersList?: MemberEntity[]
  ): SalesPerformanceChartEntity[] {
    this.selectedSeries = selectedArgumentField;
    this.selectedTxState = selectedTxState;
    let arrayWithDistributedTxs;
    switch (selectedArgumentField) {
      case SalesTimeSeriesEnum.Daily:
        arrayWithDistributedTxs = this.generateDailyArray(txs);
        break;
      case SalesTimeSeriesEnum.Weekly:
        arrayWithDistributedTxs = this.generateWeeklyArray(txs);
        break;
      case SalesTimeSeriesEnum.Monthly:
        arrayWithDistributedTxs = this.generateMonthlyArray(txs);
        break;
      case SalesTimeSeriesEnum.Quarterly:
        arrayWithDistributedTxs = this.generateQuarterlyArray(txs);
        break;
      case SalesTimeSeriesEnum.PerUserDay:
      case SalesTimeSeriesEnum.PerCustomerDay:
        arrayWithDistributedTxs = this.generatePerUserArrayDay(txs, usersList);
        break;
      case SalesTimeSeriesEnum.PerUserWeek:
      case SalesTimeSeriesEnum.PerCustomerWeek:
        arrayWithDistributedTxs = this.generatePerUserArrayWeek(txs, usersList);
        break;
      case SalesTimeSeriesEnum.PerUserMonth:
      case SalesTimeSeriesEnum.PerCustomerMonth:
        arrayWithDistributedTxs = this.generatePerUserArrayMonth(txs, usersList);
        break;
      case SalesTimeSeriesEnum.PerUserQuarter:
      case SalesTimeSeriesEnum.PerCustomerQuarter:
        arrayWithDistributedTxs = this.generatePerUserArrayQuarter(txs, usersList);
        break;
      case SalesTimeSeriesEnum.PerUserYearToDate:
      case SalesTimeSeriesEnum.PerCustomerYearToDate:
        arrayWithDistributedTxs = this.generatePerUserArrayYearToDate(txs, usersList);
        break;
    }
    const chartData = this.normalizeToSalesChartEntity(arrayWithDistributedTxs);
    this.detectUniquePriceSystem(chartData);
    return chartData;
  }

  public isCustomerSeries(series): boolean {
    return customerSeries.includes(series);
  }
  private generateDailyArray(transactions: TransactionEntity[]): any[] {
    const dailyData = [];
    const currentDate = startOfDay(new Date());
    const currentTime = currentDate.getTime();

    transactions.forEach(t => {
      const txDate = startOfDay(this.getTransactionDate(t));
      const txTime = txDate.getTime();
      const index = Math.trunc((currentTime - txTime) / (1000 * 60 * 60 * 24));
      dailyData[index] ? dailyData[index].txsList.push(t) : (dailyData[index] = { txsList: [t] });
    });

    return dailyData.reverse();
  }
  private generateWeeklyArray(transactions: TransactionEntity[]): any[] {
    const weeklyData = [];
    const currentDate = endOfDay(new Date());
    const currentTime = currentDate.getTime();

    transactions.forEach(t => {
      const txDate = endOfDay(this.getTransactionDate(t));
      const txTime = txDate.getTime();

      const index = Math.floor((currentTime - txTime) / (1000 * 3600 * 24 * 7));
      weeklyData[index] ? weeklyData[index].txsList.push(t) : (weeklyData[index] = { txsList: [t] });
    });

    return weeklyData.reverse();
  }
  private generateMonthlyArray(transactions: TransactionEntity[]): any[] {
    const monthlyData = [];
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();

    transactions.forEach(t => {
      const txDate = this.getTransactionDate(t);
      const txYear = txDate.getFullYear();

      const yearDifference = currentYear - txYear;
      const index =
        yearDifference > 1
          ? yearDifference * 12 + 12 - txDate.getMonth() + currentDate.getMonth()
          : yearDifference === 1
          ? 12 - txDate.getMonth() + currentDate.getMonth()
          : currentDate.getMonth() - txDate.getMonth();
      // const index = differenceInMonths(new Date(), txDate); // TODO test
      monthlyData[index] ? monthlyData[index].txsList.push(t) : (monthlyData[index] = { txsList: [t] });
    });

    return monthlyData.reverse();
  }
  private generateQuarterlyArray(transactions: TransactionEntity[]): any[] {
    const quarterlyData = [];
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const currentMonthNumberInQuarter =
      currentMonth > this.fiscalYearStart
        ? ((currentMonth - this.fiscalYearStart) % 3) + 1
        : 3 - ((this.fiscalYearStart - 1 - currentMonth) % 3);

    transactions.forEach(t => {
      const txDate = this.getTransactionDate(t);
      const txMonth = txDate.getMonth();
      const txYear = txDate.getFullYear();
      const yearDifference = currentYear - txYear;

      const index = yearDifference
        ? Math.ceil((12 - txMonth + 1 + currentMonth - currentMonthNumberInQuarter) / 3) +
          (yearDifference > 1 ? (yearDifference - 1) * 4 : 0)
        : Math.ceil((currentMonth - currentMonthNumberInQuarter - txMonth + 1) / 3);
      quarterlyData[index] ? quarterlyData[index].txsList.push(t) : (quarterlyData[index] = { txsList: [t] });
    });

    return quarterlyData.reverse();
  }

  // per user data array
  private generatePerUserArrayDay(transactions: TransactionEntity[], usersList: MemberEntity[]) {
    const startDate = startOfDay(new Date());

    return this.getChartArrayWithDistributedTxs(transactions, startDate, usersList);
  }
  private generatePerUserArrayWeek(transactions: TransactionEntity[], usersList: MemberEntity[]) {
    const startDate = subDays(startOfDay(new Date()), 6);
    return this.getChartArrayWithDistributedTxs(transactions, startDate, usersList);
  }
  private generatePerUserArrayMonth(transactions: TransactionEntity[], usersList: MemberEntity[]) {
    let startDate = startOfDay(subMonths(addDays(new Date(), 1), 1));

    if (new Date().getMonth() === startDate.getMonth()) startDate = setDate(startDate, 1); // march 31 to february 28 pass

    return this.getChartArrayWithDistributedTxs(transactions, startDate, usersList);
  }
  private generatePerUserArrayQuarter(transactions: TransactionEntity[], usersList: MemberEntity[]) {
    let startDate = new Date();
    const currentMonth = startDate.getMonth();
    const currentMonthNumberInQuarter =
      currentMonth >= this.fiscalYearStart
        ? ((currentMonth - this.fiscalYearStart) % 3) + 1
        : 3 - ((this.fiscalYearStart - 1 - currentMonth) % 3);

    startDate = startOfMonth(subMonths(startDate, currentMonthNumberInQuarter - 1));

    return this.getChartArrayWithDistributedTxs(transactions, startDate, usersList);
  }
  private generatePerUserArrayYearToDate(transactions: TransactionEntity[], usersList: MemberEntity[]): any[] {
    const currentDate = startOfMonth(setMonth(new Date(), this.fiscalYearStart));

    if (new Date().getMonth() < this.fiscalYearStart) currentDate.setFullYear(currentDate.getFullYear() - 1);

    return this.getChartArrayWithDistributedTxs(transactions, currentDate, usersList);
  }

  private getChartArrayWithDistributedTxs(transactions: TransactionEntity[], startDate: Date, usersList: any[]): any[] {
    const chartArray: any[] = usersList.map(user => ({ time: `${user.firstName} ${user.lastName}`, txsList: [] }));
    transactions.forEach(t => {
      const index = usersList.findIndex(user => user.id === this.getTxUser(t));
      if (index !== -1 && this.isTransactionDateValid(t, startDate)) chartArray[index].txsList.push(t);
    });
    return chartArray;
  }

  private isTransactionDateValid(transaction: TransactionEntity, startDate: Date): boolean {
    const txDate = this.getTransactionDate(transaction);
    return txDate.getTime() > startDate.getTime();
  }

  private getTxUser(tx: TransactionEntity): string {
    return this.isCustomerSeries(this.selectedSeries) ? tx.buyer.id : tx.seller.id;
  }

  private normalizeToSalesChartEntity(chartData: any[]): SalesPerformanceChartEntity[] {
    const normalizedData: any[] = [];
    if (!chartData || !chartData.length) return [];
    const startDate = this.getTransactionDate(chartData[0].txsList[0]);
    for (let i = 0; i < chartData.length; i++) {
      normalizedData.push(
        new SalesPerformanceChartEntity().init({
          index: i,
          time: this.userBasedSeries.includes(this.selectedSeries)
            ? chartData[i].time
            : this.getTimeSeriesUnitDate(startDate, i),
          txsList: chartData[i] ? chartData[i].txsList : []
        })
      );
    }
    return normalizedData;
  }

  private detectUniquePriceSystem(chartData: SalesPerformanceChartEntity[]): void {
    let isPriceSystemUnique = true;
    let priceSystem = '';

    chartData.forEach(entity => {
      if (!isPriceSystemUnique) {
        return;
      }

      if (priceSystem) {
        if (
          (entity.isPriceSystemUnique && entity.priceSystem && entity.priceSystem !== priceSystem) ||
          !entity.isPriceSystemUnique
        ) {
          isPriceSystemUnique = false;
        }
      } else {
        if (!entity.isPriceSystemUnique) {
          isPriceSystemUnique = false;
        } else if (entity.priceSystem) {
          priceSystem = entity.priceSystem;
        }
      }
    });
    this.uniquePriceSystem = isPriceSystemUnique ? priceSystem : null;
  }

  private getTimeSeriesUnitDate(startDate: Date, index: number): Date {
    const date = new Date(startDate);
    switch (this.selectedSeries) {
      case SalesTimeSeriesEnum.Daily:
        return addDays(date, index);
      case SalesTimeSeriesEnum.Weekly:
        return addWeeks(date, index);
      case SalesTimeSeriesEnum.Monthly:
        return setDate(addMonths(date, index), 1);
      case SalesTimeSeriesEnum.Quarterly:
        return setDate(addQuarters(date, index), 1);
    }
  }

  private getTransactionDate(transaction: TransactionEntity): Date {
    if (!transaction) return null;
    switch (this.selectedTxState) {
      case TransactionStateEnum.Confirmed:
        return transaction.confirmedDate;
      case TransactionStateEnum.InTransit:
        return transaction.inTransitDate;
      case TransactionStateEnum.Complete:
        return transaction.completeDate;
      case TransactionStateEnum.Review:
        return transaction.reviewDate;
      case TransactionStateEnum.Quote:
        return transaction.quoteDate;
      default:
        return transaction.draftDate;
    }
  }

  public normalizeTransactionSearchPayload(filterBuilder, dateTypeFields: string[]): any {
    const advancedFilter = {};
    const filterWithDefaultVendor: any = {
      children: {
        logicalOperator: 'and',
        items: [
          {
            value: { field: 'vendorOnline', comparisonOperator: 'eq', fieldValue: Environment.getCurrentCompany().id }
          },
          Utils.getSearchTxExcludeArchivedPayload(),
          Utils.getSearchTxCancelStateExcludePayload()
        ]
      }
    };
    FilterBuilderHelper.parseAdvancedDxFiltersToBack(filterBuilder, advancedFilter, dateTypeFields);
    if (!ObjectUtil.isEmptyObject(advancedFilter)) filterWithDefaultVendor.children.items.push(advancedFilter);
    return {
      filters: filterWithDefaultVendor,
      fields: ['costData', 'state', 'trackingData', 'tally', 'register']
    };
  }
}
