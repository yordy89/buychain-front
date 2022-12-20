import { Injectable } from '@angular/core';
import { ContractStateEnum, ProductPurchaseMethod } from '@services/app-layer/app-layer.enums';
import { Observable, Subject } from 'rxjs';
import { debounceTime, first, map } from 'rxjs/operators';
import { InventoryStreamlineEntity, ProductEntity } from '@services/app-layer/entities/inventory-search';
import { FABAction } from '@app/models';
import { Environment } from '@services/app-layer/app-layer.environment';
import { InventoryFABActions } from '@views/main/common/inventory/inventory-search/inventory-search.helper.service';
import { AccessControlScope } from '@services/app-layer/permission/permission.interface';
import { SearchApiService } from '@services/app-layer/search/search-api.service';
import { Utils } from '@services/helpers/utils/utils';

export class InventoryStreamlineViewState {
  public filters = {
    shipFromId: '',
    productGroup: { name: 'Lumber', isExpanded: false, products: ['Dim'] },
    specShorthand: '',
    owner: '',
    inventoryTypes: [],
    states: [],
    permissions: [],
    contractStatuses: [],
    contractSupplier: '',
    contractBroker: ''
  };
  public filtersState = {
    expandedProducts: true,
    expandedShipFrom: true,
    expandedSpecShorthand: false,
    expandedOwner: false,
    expandedInventoryType: false,
    expandedState: false,
    expandedPermission: false,
    expandedContractStatus: false,
    expandedContractSupplier: false,
    expandedContractBroker: false
  };
  public grid = null;
}

@Injectable({
  providedIn: 'root'
})
export class InventoryStreamlineHelperService {
  _lastRefreshedTime: Date;
  productsCountByFilter: number;
  productsList: ProductEntity[] = [];
  inventoryStreamlineCachedData: InventoryStreamlineEntity[] = [];
  latestFilters: any; // TODO temporary, check bookmark save issue
  private resetTimer$ = new Subject<void>();

  constructor(private searchApi: SearchApiService) {
    this.resetTimer$.pipe(debounceTime(Environment.cachedDataResetTime)).subscribe(() => this.resetCachedData());
  }

  public setLoadedProductsCountByFilters(value: number): void {
    this.productsCountByFilter = value;
    this.resetTimer$.next();
  }
  public getLoadedProductsCountByFilters(): number {
    if (this.productsCountByFilter) this.resetTimer$.next();
    return this.productsCountByFilter;
  }
  public getLoadedProductsByFilters(): InventoryStreamlineEntity[] {
    if (this.inventoryStreamlineCachedData.length) this.resetTimer$.next();
    return this.inventoryStreamlineCachedData;
  }

  public resetCachedData(): void {
    this.productsCountByFilter = null;
    this.productsList = [];
    this.inventoryStreamlineCachedData = [];
    this.latestFilters = null;
  }

  setLastRefreshedTime(time: Date) {
    this._lastRefreshedTime = time;
  }

  lastUpdatedTimeDiffString(): string {
    return Utils.lastUpdatedTimeDiffString(this._lastRefreshedTime);
  }

  loadInventoryProducts(payload: any, isBackground?: boolean): Observable<any> {
    return this.searchApi.searchProducts(payload, isBackground).pipe(
      first(),
      map(products => {
        const data = products.map(p => new ProductEntity().init(p));
        this.productsList.push(...data);
        this.setInventoryStreamlineCachedData();
        return this.inventoryStreamlineCachedData;
      })
    );
  }

  updateInventoryProducts(payload: any, isBackground?: boolean): Observable<any> {
    return this.searchApi.searchProducts(payload, isBackground).pipe(
      first(),
      map(products => {
        const data = products.map(p => new ProductEntity().init(p));
        const objMap = {};
        data.forEach(item => (objMap[item.id] = item));
        this.productsList = this.productsList.map(item => (objMap[item.id] ? objMap[item.id] : item));
        this.setInventoryStreamlineCachedData();
        return this.inventoryStreamlineCachedData;
      })
    );
  }

  setInventoryStreamlineCachedData(): void {
    this.inventoryStreamlineCachedData = this.groupProductsBySpec(this.productsList).map(item =>
      new InventoryStreamlineEntity().init(item)
    );
    this.resetTimer$.next();
  }

  groupProductsBySpec(products): { specShorthand: string; products: ProductEntity[] }[] {
    const grouped = products.reduce((acc, cur) => {
      acc[cur.specShorthand] ? acc[cur.specShorthand].push(cur) : (acc[cur.specShorthand] = [cur]);
      return acc;
    }, {});
    return Object.keys(grouped).map(s => ({ specShorthand: s, products: grouped[s] }));
  }

  getSearchPayload(viewState: InventoryStreamlineViewState): any {
    const filters: any = {
      children: {
        logicalOperator: 'and',
        items: []
      }
    };

    filters.children.items.push({ value: { field: 'soldTransactionId', comparisonOperator: 'ex', fieldValue: false } });

    filters.children.items.push({
      value: { field: 'productGroupName', comparisonOperator: 'eq', fieldValue: viewState.filters.productGroup.name }
    });

    if (viewState.filters.productGroup?.products?.length) {
      const productGroups = {
        children: {
          logicalOperator: 'or',
          items: viewState.filters.productGroup.products.map(p => ({
            value: { comparisonOperator: 'eq', field: 'productName', fieldValue: p }
          }))
        }
      };
      filters.children.items.push(productGroups);
    }

    filters.children.items.push({
      value: { field: 'shipFrom', comparisonOperator: 'eq', fieldValue: viewState.filters.shipFromId }
    });

    if (viewState.filters?.specShorthand) {
      const specShorthandPayload = {
        value: { comparisonOperator: 'cn', field: 'specShorthand', fieldValue: viewState.filters?.specShorthand }
      };
      filters.children.items.push(specShorthandPayload);
    }

    if (viewState.filters?.owner) {
      const ownerPayload = {
        value: { field: 'owner', comparisonOperator: 'eq', fieldValue: Environment.getCurrentUser().id }
      };
      filters.children.items.push(ownerPayload);
    }

    if (Environment.isContractsSupported() && viewState.filters?.inventoryTypes?.length === 1) {
      const selectedOne = viewState.filters.inventoryTypes[0];
      let purchaseMethodPayload;
      if (selectedOne === ProductPurchaseMethod.CASH) {
        purchaseMethodPayload = {
          children: {
            logicalOperator: 'and',
            items: [
              {
                children: {
                  logicalOperator: 'or',
                  items: [
                    { value: { comparisonOperator: 'ex', field: 'brokerContract', fieldValue: false } },
                    {
                      value: {
                        comparisonOperator: 'eq',
                        field: 'brokerContractState',
                        fieldValue: ContractStateEnum.CLOSED
                      }
                    }
                  ]
                }
              },
              {
                children: {
                  logicalOperator: 'or',
                  items: [
                    { value: { comparisonOperator: 'ex', field: 'supplyContract', fieldValue: false } },
                    {
                      value: {
                        comparisonOperator: 'eq',
                        field: 'supplyContractState',
                        fieldValue: ContractStateEnum.CLOSED
                      }
                    }
                  ]
                }
              }
            ]
          }
        };
      }
      if (selectedOne === ProductPurchaseMethod.CONTRACT) {
        purchaseMethodPayload = {
          children: {
            logicalOperator: 'or',
            items: [
              { value: { comparisonOperator: 'eq', field: 'brokerContractState', fieldValue: ContractStateEnum.OPEN } },
              { value: { comparisonOperator: 'eq', field: 'supplyContractState', fieldValue: ContractStateEnum.OPEN } }
            ]
          }
        };
      }
      filters.children.items.push(purchaseMethodPayload);
    }

    if (viewState.filters.states?.length) {
      const statesPayload = {
        children: {
          logicalOperator: 'or',
          items: viewState.filters.states.map(state => ({
            value: { comparisonOperator: 'eq', field: 'state', fieldValue: state }
          }))
        }
      };
      filters.children.items.push(statesPayload);
    }

    if (viewState.filters.permissions?.length) {
      const permissionsPayload = {
        children: {
          logicalOperator: 'or',
          items: viewState.filters.permissions.map(p => ({
            value: { comparisonOperator: 'eq', field: 'permission', fieldValue: p }
          }))
        }
      };
      filters.children.items.push(permissionsPayload);
    }

    if (viewState.filters?.contractStatuses?.length) {
      const brokerStatuses = viewState.filters.contractStatuses.map(p => ({
        value: { comparisonOperator: 'eq', field: 'brokerContractState', fieldValue: p }
      }));
      const supplyStatuses = viewState.filters.contractStatuses.map(p => ({
        value: { comparisonOperator: 'eq', field: 'supplyContractState', fieldValue: p }
      }));

      const contractStatusPayload = {
        children: {
          logicalOperator: 'or',
          items: [...brokerStatuses, ...supplyStatuses]
        }
      };
      filters.children.items.push(contractStatusPayload);
    }

    if (viewState.filters?.contractSupplier) {
      filters.children.items.push({
        value: {
          comparisonOperator: 'eq',
          field: 'brokerContractSupplier',
          fieldValue: viewState.filters.contractSupplier
        }
      });
    } else if (viewState.filters?.contractBroker) {
      filters.children.items.push({
        value: { comparisonOperator: 'eq', field: 'supplyContractBroker', fieldValue: viewState.filters.contractBroker }
      });
    }

    return { filters };
  }

  getProductLotsPayload(viewState: InventoryStreamlineViewState, lotIds) {
    const payload = this.getSearchPayload(viewState);

    const item = {
      children: {
        logicalOperator: 'or',
        items: lotIds.map(id => ({ value: { comparisonOperator: 'eq', field: 'lot', fieldValue: id } }))
      }
    };

    payload.filters.children.items.push(item);

    return payload;
  }

  public getInventoryFABActions(): FABAction[] {
    return [
      {
        label: 'Bulk Update Owner',
        icon: 'person',
        value: InventoryFABActions.BULK_UPDATE_OWNER
      },
      {
        label: 'Bulk Update Permission',
        icon: 'lock_open',
        value: InventoryFABActions.BULK_UPDATE_PERMISSION
      },
      {
        label: 'Bulk Update Price of Merit',
        icon: 'monetization_on',
        value: InventoryFABActions.BULK_UPDATE_PRICE_OF_MERIT
      },
      {
        label: 'Bulk Update Ship Week Estimate',
        icon: 'event',
        value: InventoryFABActions.BULK_UPDATE_SHIP_WEEK_ESTIMATE
      },
      {
        label: 'Bulk Update Sales Notes',
        icon: 'notes',
        value: InventoryFABActions.BULK_UPDATE_SALES_NOTES
      },
      {
        label: 'Merge Lots',
        icon: 'merge_type',
        value: InventoryFABActions.MERGE_LOTS
      },
      {
        label: 'Add to Cart',
        icon: 'add_shopping_cart',
        value: InventoryFABActions.ADD_TO_CART,
        isHidden: !this.getTxAccessRoles().canReadTx || !this.getTxAccessRoles().canUpdateTally
      },
      {
        label: 'Add to Order',
        icon: 'shopping_cart',
        value: InventoryFABActions.BULK_ADD_TO_ORDER,
        isHidden: !this.getTxAccessRoles().canReadTx || !this.getTxAccessRoles().canUpdateTally
      },
      {
        label: 'Convert to Cash',
        icon: 'check',
        value: InventoryFABActions.CLOSE_CONTRACT,
        isHidden: !Environment.isContractsSupported()
      },
      {
        label: 'Clear Selection',
        icon: 'clear_all',
        value: InventoryFABActions.CLEAR_SELECTION
      }
    ];
  }

  private getTxAccessRoles(): any {
    const txPermissions =
      Environment.getCurrentUser().normalizedAccessControlRoles.TRANSACTION.transactionSection.sectionGroup;
    return {
      canReadTx:
        txPermissions.readList.value === AccessControlScope.Company ||
        txPermissions.readList.value === AccessControlScope.Owner,
      canUpdateTally:
        txPermissions.updateTally.value === AccessControlScope.Company ||
        txPermissions.updateTally.value === AccessControlScope.Owner
    };
  }
}
