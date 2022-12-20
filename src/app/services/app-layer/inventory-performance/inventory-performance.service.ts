import { Injectable } from '@angular/core';
import { Environment } from '@services/app-layer/app-layer.environment';
import { FilterBuilderHelper } from '@services/helpers/utils/filter-builder-helper';
import { InventoryTimeSeriesEnum, ProductStateEnum } from '@services/app-layer/app-layer.enums';
import { InventoryPerformanceChartEntity } from '@services/app-layer/entities/inventory-performance-chart';
import { ObjectUtil } from '@services/helpers/utils/object-util';
import { Product } from '@services/data-layer/http-api/base-api/swagger-gen';
import { addDays, addMonths, addQuarters, addWeeks, endOfDay } from 'date-fns';

@Injectable({
  providedIn: 'root'
})
export class InventoryPerformanceService {
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
      dataField: 'permission',
      caption: 'Permission',
      filterOperations: ['=', '<>'],
      lookup: {
        dataSource: [],
        valueExpr: 'value',
        displayExpr: 'displayValue'
      }
    },
    {
      dataField: 'shipFrom',
      caption: 'Ship From',
      filterOperations: ['=', '<>'],
      lookup: {
        dataSource: [],
        valueExpr: 'id',
        displayExpr: 'shortName'
      }
    },
    {
      dataField: 'mfgFacilityShortName',
      caption: 'Mfg Facility',
      dataType: 'string',
      filterOperations: ['contains', 'notcontains']
    },
    {
      dataField: 'specShorthand',
      caption: 'Spec',
      dataType: 'string',
      filterOperations: ['contains', 'notcontains']
    },
    {
      dataField: 'owner',
      caption: 'Owner',
      filterOperations: ['=', '<>'],
      lookup: {
        dataSource: [],
        valueExpr: 'id',
        displayExpr: 'name'
      }
    },
    {
      dataField: 'shipWeekEstimate',
      caption: 'Ship Week Estimate',
      dataType: 'date',
      filterOperations: ['=', '<>', 'between', '<', '>', '>=', '<=']
    },
    {
      dataField: 'purchaseDate',
      caption: 'Purchase Date',
      dataType: 'date',
      filterOperations: ['=', '<>', 'between', '<', '>', '>=', '<=']
    },
    {
      dataField: 'landedDate',
      caption: 'Landed Date',
      dataType: 'date',
      filterOperations: ['=', '<>', 'between', '<', '>', '>=', '<=']
    },
    {
      dataField: 'custodyDate',
      caption: 'Custody Date',
      dataType: 'date',
      filterOperations: ['=', '<>', 'between', '<', '>', '>=', '<=']
    },
    {
      dataField: 'soldDate',
      caption: 'Sold Date',
      dataType: 'date',
      filterOperations: ['=', '<>', 'between', '<', '>', '>=', '<=']
    }
  ];
  private readonly fiscalYearStart: number;
  private selectedArgumentField: InventoryTimeSeriesEnum;
  public uniquePriceSystem = null;

  constructor() {
    this.fiscalYearStart = this.monthNames.findIndex(
      m => m.toLowerCase() === Environment.getCurrentCompany().accountingPractices.fiscalYearStart.toLowerCase()
    );
  }

  public generateNormalizedData(
    products: any[],
    selectedArgumentField: InventoryTimeSeriesEnum
  ): InventoryPerformanceChartEntity[] {
    this.selectedArgumentField = selectedArgumentField;
    const arrayWithDistributedProducts = this.generateArray(products, selectedArgumentField);
    return this.normalizeToInventoryChartEntity(arrayWithDistributedProducts);
  }

  private generateArray(products: any[], selectedArgumentField: InventoryTimeSeriesEnum): any[] {
    const arrayData = [];
    let isUnique = true;
    const priceSystem = products[0]?.spec.priceSystem;

    products.forEach(p => {
      if (isUnique && p.spec.priceSystem !== priceSystem) isUnique = false;
      const productDate = this.getProductDate(p);
      if (productDate) {
        const index = this.getProductIndex(productDate, selectedArgumentField);
        arrayData[index]
          ? arrayData[index].productList.push({ ...p, spec: p.spec })
          : (arrayData[index] = { productList: [{ ...p, spec: p.spec }] });
      }
    });

    this.uniquePriceSystem = isUnique ? priceSystem : null;

    return arrayData.reverse();
  }

  private getProductIndex(productDate, selectedArgumentField: InventoryTimeSeriesEnum): number {
    const currentDate = endOfDay(new Date());
    const currentTime = currentDate.getTime();
    productDate = endOfDay(productDate);
    const productTime = productDate.getTime();
    let index;
    switch (selectedArgumentField) {
      case InventoryTimeSeriesEnum.DailyPurchased:
      case InventoryTimeSeriesEnum.DailyLanded:
      case InventoryTimeSeriesEnum.DailyCustody:
      case InventoryTimeSeriesEnum.DailySold:
        index = Math.trunc((currentTime - productTime) / (1000 * 3600 * 24));
        break;
      case InventoryTimeSeriesEnum.WeeklyPurchased:
      case InventoryTimeSeriesEnum.WeeklyLanded:
      case InventoryTimeSeriesEnum.WeeklyCustody:
      case InventoryTimeSeriesEnum.WeeklySold:
        index = Math.floor((currentTime - productTime) / (1000 * 3600 * 24 * 7));
        break;
      case InventoryTimeSeriesEnum.MonthlyPurchased:
      case InventoryTimeSeriesEnum.MonthlyLanded:
      case InventoryTimeSeriesEnum.MonthlyCustody:
      case InventoryTimeSeriesEnum.MonthlySold:
        index = this.getMonthlyIndex(productDate);
        break;
      case InventoryTimeSeriesEnum.QuarterlyPurchased:
      case InventoryTimeSeriesEnum.QuarterlyLanded:
      case InventoryTimeSeriesEnum.QuarterlyCustody:
      case InventoryTimeSeriesEnum.QuarterlySold:
        index = this.getQuarterlyIndex(productDate);
        break;
    }
    return index;
  }

  private getMonthlyIndex(productDate) {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const productYear = productDate.getFullYear();
    const yearDifference = currentYear - productYear;

    return yearDifference > 1
      ? yearDifference * 12 + 12 - productDate.getMonth() + currentDate.getMonth()
      : yearDifference === 1
      ? 12 - productDate.getMonth() + currentDate.getMonth()
      : currentDate.getMonth() - productDate.getMonth();
  }

  private getQuarterlyIndex(productDate) {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const currentMonthNumberInQuarter =
      currentMonth > this.fiscalYearStart
        ? ((currentMonth - this.fiscalYearStart) % 3) + 1
        : 3 - ((this.fiscalYearStart - 1 - currentMonth) % 3);
    const productMonth = productDate.getMonth();
    const productYear = productDate.getFullYear();
    const yearDifference = currentYear - productYear;

    return yearDifference
      ? Math.ceil((12 - productMonth + 1 + currentMonth - currentMonthNumberInQuarter) / 3) +
          (yearDifference > 1 ? yearDifference * 4 : 0)
      : Math.ceil((currentMonth - currentMonthNumberInQuarter - productMonth + 1) / 3);
  }

  private normalizeToInventoryChartEntity(chartData: any[]): InventoryPerformanceChartEntity[] {
    const normalizedData: any[] = [];
    if (!chartData || !chartData.length) return [];
    const startDate = this.getProductDate(chartData[0].productList[0]);
    for (let i = 0; i < chartData.length; i++) {
      normalizedData.push(
        new InventoryPerformanceChartEntity().init({
          index: i,
          time: this.getTimeSeriesUnitDate(startDate, i),
          productList: chartData[i] ? chartData[i].productList : []
        })
      );
    }
    return normalizedData;
  }

  public getTimeSeriesUnitDate(startDate: Date, index: number): Date {
    const date = new Date(startDate);
    switch (this.selectedArgumentField) {
      case InventoryTimeSeriesEnum.DailyPurchased:
      case InventoryTimeSeriesEnum.DailyLanded:
      case InventoryTimeSeriesEnum.DailyCustody:
      case InventoryTimeSeriesEnum.DailySold:
        return addDays(date, index);
      case InventoryTimeSeriesEnum.WeeklyPurchased:
      case InventoryTimeSeriesEnum.WeeklyLanded:
      case InventoryTimeSeriesEnum.WeeklyCustody:
      case InventoryTimeSeriesEnum.WeeklySold:
        return addWeeks(date, index);
      case InventoryTimeSeriesEnum.MonthlyPurchased:
      case InventoryTimeSeriesEnum.MonthlyLanded:
      case InventoryTimeSeriesEnum.MonthlyCustody:
      case InventoryTimeSeriesEnum.MonthlySold:
        return addMonths(date, index);
      case InventoryTimeSeriesEnum.QuarterlyPurchased:
      case InventoryTimeSeriesEnum.QuarterlyLanded:
      case InventoryTimeSeriesEnum.QuarterlyCustody:
      case InventoryTimeSeriesEnum.QuarterlySold:
        return addQuarters(date, index);
    }
  }

  public getProductDate(product: Product): Date {
    switch (this.selectedArgumentField) {
      case InventoryTimeSeriesEnum.DailyPurchased:
      case InventoryTimeSeriesEnum.WeeklyPurchased:
      case InventoryTimeSeriesEnum.MonthlyPurchased:
      case InventoryTimeSeriesEnum.QuarterlyPurchased:
        return product.dateHistory?.purchaseDate ? new Date(product.dateHistory?.purchaseDate) : null;
      case InventoryTimeSeriesEnum.DailyLanded:
      case InventoryTimeSeriesEnum.WeeklyLanded:
      case InventoryTimeSeriesEnum.MonthlyLanded:
      case InventoryTimeSeriesEnum.QuarterlyLanded:
        return product.dateHistory?.landedDate ? new Date(product.dateHistory?.landedDate) : null;
      case InventoryTimeSeriesEnum.DailyCustody:
      case InventoryTimeSeriesEnum.WeeklyCustody:
      case InventoryTimeSeriesEnum.MonthlyCustody:
      case InventoryTimeSeriesEnum.QuarterlyCustody:
        return product.dateHistory?.custodyDate ? new Date(product.dateHistory?.custodyDate) : null;
      case InventoryTimeSeriesEnum.DailySold:
      case InventoryTimeSeriesEnum.WeeklySold:
      case InventoryTimeSeriesEnum.MonthlySold:
      case InventoryTimeSeriesEnum.QuarterlySold:
        return product.dateHistory?.soldDate ? new Date(product.dateHistory?.soldDate) : null;
    }
  }

  public normalizeProductLotSearchPayload(dxFilter, dateTypeFields): any {
    const filterBuilder = [];
    FilterBuilderHelper.productSoldStateTransform(dxFilter, filterBuilder);
    const advancedFilter: any = {};
    FilterBuilderHelper.parseAdvancedDxFiltersToBack(filterBuilder, advancedFilter, dateTypeFields);
    // To exclude canceled state (because no migration happened)
    const finalFilter = {
      children: {
        logicalOperator: 'and',
        items: [
          {
            children: {
              logicalOperator: 'or',
              items: [
                ProductStateEnum.ON_HAND,
                ProductStateEnum.ON_ORDER,
                ProductStateEnum.IN_TRANSIT,
                ProductStateEnum.SOLD
              ].map(state => ({ value: { field: 'state', comparisonOperator: 'eq', fieldValue: state } }))
            }
          }
        ]
      }
    };
    if (!ObjectUtil.isEmptyObject(advancedFilter)) finalFilter.children.items.push(advancedFilter);
    return {
      filters: finalFilter,
      fields: ['spec', 'state', 'dateHistory', 'priceHistory']
    };
  }
}
