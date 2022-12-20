import { Injectable } from '@angular/core';
import { FilterBuilderHelper } from '@services/helpers/utils/filter-builder-helper';
import { ObjectUtil } from '@services/helpers/utils/object-util';
import { InventoryAuditGridEntity } from '@services/app-layer/entities/inventory-audit-grid';
import { ProductStateEnum } from '@services/app-layer/app-layer.enums';
import { Product } from '@services/data-layer/http-api/base-api/swagger-gen';
import { ProductLot } from '@services/data-layer/http-api/base-api/swagger-gen/model/productLot';
import StateEnum = ProductLot.StateEnum;

@Injectable({
  providedIn: 'root'
})
export class InventoryAuditService {
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

  public onHandCount = 0;
  public onHandCostBasis = 0;
  public onOrderCount = 0;
  public onOrderCostBasis = 0;
  public inTransitCount = 0;
  public inTransitCostBasis = 0;

  public uniquePriceSystem = null;

  public generateNormalizedData(products: Product[]): InventoryAuditGridEntity[] {
    if (products?.length) this.uniquePriceSystem = products[0].spec.priceSystem;
    this.resetSummaryCalculations();
    return products.map(product => {
      if (this.uniquePriceSystem && product.spec.priceSystem !== this.uniquePriceSystem) this.uniquePriceSystem = null;
      this.countInSummary(product.state, product);
      return new InventoryAuditGridEntity().init(product);
    });
  }

  private countInSummary(state: StateEnum, product: Product): void {
    if (product.state === ProductStateEnum.ON_HAND && product.soldTransactionId) return;
    switch (state) {
      case ProductStateEnum.ON_HAND:
        this.onHandCount++;
        this.onHandCostBasis += product.priceHistory?.costBasis || 0;
        break;
      case ProductStateEnum.IN_TRANSIT:
        this.inTransitCount++;
        this.inTransitCostBasis += product.priceHistory?.costBasis || 0;
        break;
      case ProductStateEnum.ON_ORDER:
        this.onOrderCount++;
        this.onOrderCostBasis += product.priceHistory?.costBasis || 0;
        break;
    }
  }
  private resetSummaryCalculations(): void {
    this.onHandCount = 0;
    this.onHandCostBasis = 0;
    this.inTransitCount = 0;
    this.inTransitCostBasis = 0;
    this.onOrderCount = 0;
    this.onOrderCostBasis = 0;
  }

  public normalizeProductLotSearchPayload(dxFilter, dateTypeFields: string[]): any {
    const filterBuilder = [];
    FilterBuilderHelper.productSoldStateTransform(dxFilter, filterBuilder);
    const advancedFilter: any = {};
    FilterBuilderHelper.parseAdvancedDxFiltersToBack(filterBuilder, advancedFilter, dateTypeFields);
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
      filters: finalFilter
      // fields: ['mfgFacilityShortName', 'owner', 'permission', 'state', 'allocatedTransactionId', 'spec', 'specShorthand', 'ownerId'], // TODO enhance
    };
  }
}
