import { Injectable } from '@angular/core';
import { InventorySearchEntity } from '@services/app-layer/entities/inventory-search';
import { Environment } from '@services/app-layer/app-layer.environment';
import { FacilityEntity } from '@services/app-layer/entities/facility';
import { InventoryHelperService } from '@views/main/common/inventory/inventory.helper.service';
import { debounceTime, first, map, mergeMap } from 'rxjs/operators';
import { SearchService } from '@services/app-layer/search/search.service';
import { ContractStateEnum, ProductPurchaseMethod, ProductStateEnum } from '@services/app-layer/app-layer.enums';
import { ProductsHelper } from '@services/app-layer/products/products-helper';
import { FABAction } from '@app/models';
import { addDays, startOfDay } from 'date-fns';
import { Observable, Subject } from 'rxjs';
import { AccessControlScope } from '@services/app-layer/permission/permission.interface';
import { Utils } from '@services/helpers/utils/utils';

export class InventoryViewState {
  public filters = {
    owner: false,
    states: [],
    inventoryTypes: [],
    permissions: [],
    shipFromIds: [],
    specShorthand: '',
    productGroups: [{ name: 'Lumber', isExpanded: false, products: ['Dim'] }],
    contractStatuses: [],
    contractSupplier: '',
    contractBroker: ''
  };
  filtersState = {
    expandedOwner: true,
    expandedState: false,
    expandedInventoryType: false,
    expandedPermission: false,
    expandedShipFrom: false,
    expandedSpecShorthand: true,
    expandedProducts: true,
    expandedDeliveredPricing: true,
    contractStatusExpanded: false,
    contractSupplierExpanded: false,
    contractBrokerExpanded: false
  };
  expandedRows = [];
  public shipToAccountId = '';
  public shipToLocationId = '';
  public grid = null;
}

export enum InventoryFABActions {
  BULK_UPDATE_OWNER,
  BULK_UPDATE_PERMISSION,
  BULK_UPDATE_PRICE_OF_MERIT,
  BULK_UPDATE_SHIP_WEEK_ESTIMATE,
  BULK_UPDATE_SALES_NOTES,
  MERGE_LOTS,
  CLEAR_SELECTION,
  ADD_TO_CART,
  BULK_ADD_TO_ORDER,
  CLOSE_CONTRACT
}

enum EditableColumns {
  ownerId = 'ownerId',
  shipWeekEstimate = 'shipWeekEstimate',
  priceOfMerit = 'priceOfMerit',
  permission = 'permission',
  salesNotes = 'salesNotes'
}
// TODO class for filters input

@Injectable({
  providedIn: 'root'
})
export class InventorySearchHelperService {
  private _lastRefreshedTime: Date;
  private resetTimer$ = new Subject<void>();
  private loadedLotIdsByLatestFilters: string[] = [];
  private loadedLotsByLatestFilters: InventorySearchEntity[] = [];
  public latestFilters: any; // TODO temporary, as bookmark save issue still there

  lastUpdatedTimeDiffString(): string {
    return Utils.lastUpdatedTimeDiffString(this._lastRefreshedTime);
  }

  setLastRefreshedTime(time: Date) {
    this._lastRefreshedTime = time;
  }

  constructor(private searchService: SearchService, private inventoryHelperService: InventoryHelperService) {
    this.resetTimer$.pipe(debounceTime(Environment.cachedDataResetTime)).subscribe(() => this.resetCachedData());
  }

  public resetCachedData(): void {
    this.loadedLotIdsByLatestFilters = [];
    this.loadedLotsByLatestFilters = [];
  }

  public setLoadedLotIdsByFilters(value: string[]): void {
    this.loadedLotIdsByLatestFilters = value;
    this.resetTimer$.next();
  }
  public getLoadedLotIdsByFilters(): string[] {
    if (this.loadedLotIdsByLatestFilters.length) this.resetTimer$.next();
    return this.loadedLotIdsByLatestFilters;
  }
  public setLoadedLotsByFilters(value: InventorySearchEntity[]): void {
    this.loadedLotsByLatestFilters = value;
    this.resetTimer$.next();
  }
  public updateLoadedLots(value: InventorySearchEntity[]): void {
    this.loadedLotsByLatestFilters = value;
  }
  public getLoadedLotsByFilters(): InventorySearchEntity[] {
    if (this.loadedLotsByLatestFilters.length) this.resetTimer$.next();
    return this.loadedLotsByLatestFilters;
  }

  // helper methods

  listInventoryLotsByFilter(payload: any): Observable<string[]> {
    return this.searchService.listInventoryLotsByFilters(payload).pipe(first());
  }

  loadInventoryLots(
    payload: any,
    shipToFacility?: FacilityEntity,
    isBackgroundRequest?: boolean
  ): Observable<InventorySearchEntity[]> {
    return this.searchService.fetchInventoryProducts(payload, isBackgroundRequest).pipe(
      first(),
      mergeMap(async data => {
        const normalizedData = this.inventoryHelperService.normalizeInventoryData(data);

        if (shipToFacility) {
          for (const productLot of normalizedData) {
            // TODO check with current lot data structure;
            productLot.deliveryPricing = await this.searchService.calcProductDeliveryPricing(
              productLot,
              shipToFacility
            );
          }
        }
        return normalizedData;
      })
    );
  }

  loadInventoryLotsByFilters(payload: any): Observable<any[]> {
    if (payload.fields && !payload.fields.some(f => f === 'lot')) payload.fields.push('lot');
    return this.searchService.fetchInventoryProducts(payload).pipe(
      first(),
      map(data =>
        data.reduce((acc, cur) => {
          const existingIndex = acc.findIndex(p => p.lot === cur.lot);
          if (existingIndex === -1) {
            acc.push({
              lot: cur.lot,
              sampleProduct: cur,
              products: [cur]
            });
          } else acc[existingIndex].products.push(cur);
          return acc;
        }, [])
      )
    );
  }

  loadLotById(lotId: string): Observable<InventorySearchEntity> {
    return this.loadLotsByIds([lotId]).pipe(map(lots => (lots.length ? lots[0] : null)));
  }

  loadLotsByIds(lotIds: string[], fields?: string[]): Observable<InventorySearchEntity[]> {
    const payload = {
      filters: {
        children: {
          logicalOperator: 'and',
          items: [
            {
              children: {
                logicalOperator: 'or',
                items: lotIds.map(id => ({ value: { comparisonOperator: 'eq', field: 'lot', fieldValue: id } }))
              }
            },
            {
              children: {
                logicalOperator: 'or',
                items: [
                  ProductStateEnum.ON_HAND,
                  ProductStateEnum.ON_ORDER,
                  ProductStateEnum.IN_TRANSIT,
                  ProductStateEnum.SOLD
                ].map(state => ({ value: { comparisonOperator: 'eq', field: 'state', fieldValue: state } }))
              }
            }
          ]
        }
      }
    };

    if (fields?.length) {
      payload['fields'] = fields;
    }
    return this.searchService.fetchInventoryProducts(payload).pipe(
      first(),
      map(data => this.inventoryHelperService.normalizeInventoryData(data))
    );
  }

  setMinShipWeekEstimate(): Date {
    return addDays(startOfDay(new Date()), 1);
  }

  canUpdateCell(lot: InventorySearchEntity, dataField: EditableColumns): boolean {
    const isEditable = Object.values(EditableColumns).includes(dataField);
    const accessRoles = ProductsHelper.getProductLotAccessRoles(lot);
    return (
      (isEditable && dataField === EditableColumns.permission && accessRoles.canUpdatePermission) ||
      (dataField === EditableColumns.ownerId && accessRoles.canUpdateOwner) ||
      (dataField === EditableColumns.salesNotes && accessRoles.canUpdateSalesNotes) ||
      (dataField === EditableColumns.priceOfMerit && accessRoles.canUpdatePriceOfMerit) ||
      (dataField === EditableColumns.shipWeekEstimate && accessRoles.canUpdateShipWeekEstimate)
    );
  }

  getSearchPayload(inventoryFilters: any, fixedFilters?: any, lotIds?: string[]): any {
    const filters: any = { children: { logicalOperator: 'and', items: [] } };

    if (lotIds?.length) {
      const idsPayload = {
        children: {
          logicalOperator: 'or',
          items: lotIds.map(id => ({ value: { comparisonOperator: 'eq', field: 'lot', fieldValue: id } }))
        }
      };
      filters.children.items.push(idsPayload);
    }

    filters.children.items.push(this.getSearchStatePayload(inventoryFilters));

    if (inventoryFilters.owner) {
      const ownerPayload = {
        value: { field: 'owner', comparisonOperator: 'eq', fieldValue: Environment.getCurrentUser().id }
      };
      filters.children.items.push(ownerPayload);
    }

    if (inventoryFilters.permissions?.length) {
      const permissionsPayload = {
        children: {
          logicalOperator: 'or',
          items: inventoryFilters.permissions.map(p => ({
            value: { comparisonOperator: 'eq', field: 'permission', fieldValue: p }
          }))
        }
      };
      filters.children.items.push(permissionsPayload);
    }

    if (inventoryFilters.productGroups?.length) {
      const productGroups = {
        children: {
          logicalOperator: 'or',
          items: inventoryFilters.productGroups.reduce(
            (acc, cur) => [
              ...acc,
              ...cur.products.map(p => ({ value: { comparisonOperator: 'eq', field: 'productName', fieldValue: p } }))
            ],
            []
          )
        }
      };
      filters.children.items.push(productGroups);
    }

    if (fixedFilters?.shipFromId || inventoryFilters.shipFromIds?.length) {
      const shipFromIds = fixedFilters?.shipFromId ? [fixedFilters?.shipFromId] : inventoryFilters.shipFromIds;
      const shipFromIdsPayload = {
        children: {
          logicalOperator: 'or',
          items: shipFromIds.map(id => ({ value: { field: 'shipFrom', comparisonOperator: 'eq', fieldValue: id } }))
        }
      };
      filters.children.items.push(shipFromIdsPayload);
    }

    if (inventoryFilters?.specShorthand) {
      const specShorthandPayload = {
        value: { comparisonOperator: 'cn', field: 'specShorthand', fieldValue: inventoryFilters.specShorthand }
      };
      filters.children.items.push(specShorthandPayload);
    }

    this.addContractRelatedFilters(filters, inventoryFilters);

    return { filters };
  }

  getSearchStatePayload(inventoryFilters: any): any {
    if (!inventoryFilters.states?.length) {
      inventoryFilters.states = [ProductStateEnum.ON_HAND, ProductStateEnum.ON_ORDER, ProductStateEnum.IN_TRANSIT];
    }

    if (inventoryFilters.states.some(s => s === ProductStateEnum.SOLD) && inventoryFilters.states.length > 1) {
      inventoryFilters.states = inventoryFilters.states.filter(s => s !== ProductStateEnum.SOLD);
    }

    let statesPayload;
    if (inventoryFilters.states.some(s => s === ProductStateEnum.SOLD)) {
      statesPayload = {
        children: {
          logicalOperator: 'and',
          items: [
            {
              children: {
                // to exclude canceled state
                logicalOperator: 'or',
                items: [
                  ProductStateEnum.ON_HAND,
                  ProductStateEnum.ON_ORDER,
                  ProductStateEnum.IN_TRANSIT,
                  ProductStateEnum.SOLD
                ].map(state => ({ value: { comparisonOperator: 'eq', field: 'state', fieldValue: state } }))
              }
            },
            { value: { field: 'soldTransactionId', comparisonOperator: 'ex', fieldValue: true } }
          ]
        }
      };
    } else {
      statesPayload = {
        children: {
          logicalOperator: 'and',
          items: [
            {
              children: {
                logicalOperator: 'or',
                items: inventoryFilters.states.map(state => ({
                  value: { comparisonOperator: 'eq', field: 'state', fieldValue: state }
                }))
              }
            },
            { value: { field: 'soldTransactionId', comparisonOperator: 'ex', fieldValue: false } }
          ]
        }
      };
    }
    return statesPayload;
  }

  private addContractRelatedFilters(filters, inventoryFilters) {
    if (!Environment.isContractsSupported()) {
      return;
    }

    if (inventoryFilters?.inventoryTypes?.length === 1) {
      const selectedOne = inventoryFilters.inventoryTypes[0];
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

    if (inventoryFilters?.contractStatuses?.length) {
      const brokerStatuses = inventoryFilters.contractStatuses.map(p => ({
        value: { comparisonOperator: 'eq', field: 'brokerContractState', fieldValue: p }
      }));
      const supplyStatuses = inventoryFilters.contractStatuses.map(p => ({
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

    if (inventoryFilters?.contractSupplier) {
      filters.children.items.push({
        value: {
          comparisonOperator: 'eq',
          field: 'brokerContractSupplier',
          fieldValue: inventoryFilters.contractSupplier
        }
      });
    } else if (inventoryFilters?.contractBroker) {
      filters.children.items.push({
        value: { comparisonOperator: 'eq', field: 'supplyContractBroker', fieldValue: inventoryFilters.contractBroker }
      });
    }
  }

  /*
   * Private Helpers
   * */

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
