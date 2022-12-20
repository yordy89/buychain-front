import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DialogModalComponent, DialogType } from '@components/common/modals/dialog-modal/dialog-modal.component';
import { InventoryViewEnum } from '@services/app-layer/app-layer.enums';
import { InventorySearchEntity, ProductEntity } from '@services/app-layer/entities/inventory-search';
import { SearchService } from '@services/app-layer/search/search.service';
import { TransformHelper } from '@services/helpers/utils/transform-helper';
import { MergeLotsModalComponent } from '@views/main/common/inventory/inventory-search/merge-lots-modal/merge-lots-modal.component';
import { BulkAddToOrderModalComponent } from '@views/main/common/modals/bulk-add-to-order-modal/bulk-add-to-order-modal.component';
import { BulkEditProductLotModalComponent } from '@views/main/common/modals/bulk-edit-product-lot-modal/bulk-edit-product-lot-modal.component';
import { CloseContractModalComponent } from '@views/main/common/modals/close-contract-modal/close-contract-modal.component';
import { addDays, startOfDay } from 'date-fns';
import { mergeMap, of } from 'rxjs';
import { first, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class InventoryHelperService {
  constructor(private dialog: MatDialog, private searchService: SearchService) {}

  normalizeInventoryData(data: ProductEntity[]): InventorySearchEntity[] {
    const grouped = data.reduce((acc, cur) => {
      const existingIndex = acc.findIndex(p => p.lot === cur.lot);
      if (existingIndex === -1) {
        acc.push({
          lot: cur.lot,
          spec: cur.spec,
          specShorthand: cur.specShorthand,
          products: [cur],
          productName: cur.spec.productName
        });
      } else acc[existingIndex].products.push(cur);
      return acc;
    }, []);
    return grouped.map(lot => new InventorySearchEntity().init(lot));
  }

  checkForAllocatedProducts(productLots: InventorySearchEntity[]) {
    return this.getAllocatedProducts(productLots).pipe(
      mergeMap(allocatedItems => {
        if (!allocatedItems.length) {
          return of(productLots);
        }

        const idsStr = allocatedItems.map(item => item.lotShortId).join(', ');

        return this.dialog
          .open(DialogModalComponent, {
            width: '450px',
            disableClose: true,
            data: {
              type: DialogType.Confirm,
              content: `Product ${
                allocatedItems.length === 1 ? 'Lot' : 'Lots'
              } [${idsStr}] contains allocated product(s). You have to deallocate them first in order to apply the action, otherwise, they will be skipped. Do you want to continue anyway?`
            }
          })
          .afterClosed()
          .pipe(
            map(shouldSkip => {
              if (shouldSkip) {
                return productLots.filter(item => !allocatedItems.some(elem => elem.lotId === item.lotId));
              }

              return [];
            })
          );
      })
    );
  }

  getAllocatedProducts(productLots: any[]) {
    const set = new Set();

    const products = productLots.reduce((acc, lot) => acc.concat(lot.products), []);
    products.forEach(item => set.add(item.lot));

    const lotIds = Array.from(set);

    return this.loadSimplifiedProducts(lotIds);
  }

  private loadSimplifiedProducts(lotIds) {
    const payload = this.getSimplifiedSearchPayload(lotIds);
    return this.loadSimplifiedInventoryProducts(payload);
  }

  private loadSimplifiedInventoryProducts(payload: any) {
    return this.searchService.fetchInventoryProducts(payload).pipe(
      first(),
      map(data => this.normalizeSimplifiedInventoryData(data))
    );
  }

  private getSimplifiedSearchPayload(lotIds?: string[]): any {
    const filters: any = {
      children: {
        logicalOperator: 'and',
        items: [{ value: { field: 'allocatedTransactionId', comparisonOperator: 'ex', fieldValue: true } }]
      }
    };

    if (lotIds?.length) {
      const idsPayload = {
        children: {
          logicalOperator: 'or',
          items: lotIds.map(id => ({ value: { comparisonOperator: 'eq', field: 'lot', fieldValue: id } }))
        }
      };
      filters.children.items.push(idsPayload);
    }

    return {
      filters,
      fields: ['lot', 'allocatedTransactionId']
    };
  }

  private normalizeSimplifiedInventoryData(data: ProductEntity[]) {
    const grouped = data.reduce((acc, cur) => {
      const existingIndex = acc.findIndex(p => p.lot === cur.lot);
      if (existingIndex === -1) {
        acc.push({
          lot: cur.lot,
          products: [cur]
        });
      } else acc[existingIndex].products.push(cur);
      return acc;
    }, []);
    return grouped.map(item => {
      return {
        lotId: item.lot,
        lotShortId: TransformHelper.getShortHexGuid(item.lot),
        products: item.products
      };
    });
  }

  getMinShipWeekEstimate(): Date {
    return addDays(startOfDay(new Date()), 1);
  }

  bulkEditSelectedGroup(productLots, data) {
    return this.checkForAllocatedProducts(productLots).pipe(
      mergeMap(unallocatedProductLots => {
        if (!unallocatedProductLots?.length) {
          return of([]);
        }

        return this.dialog
          .open(BulkEditProductLotModalComponent, {
            width: '600px',
            disableClose: true,
            data: {
              ...data,
              productLots: unallocatedProductLots
            }
          })
          .afterClosed();
      })
    );
  }

  mergeSelectedLots(productLots, membersList) {
    return this.dialog
      .open(MergeLotsModalComponent, {
        width: '1500px',
        disableClose: true,
        data: {
          productLots,
          membersList
        }
      })
      .afterClosed();
  }

  closeContract(products, crmAccounts) {
    return this.dialog
      .open(CloseContractModalComponent, {
        width: '1500px',
        disableClose: true,
        data: {
          products,
          crmAccounts
        }
      })
      .afterClosed();
  }

  addToOrder(productLots: InventorySearchEntity[], membersList, cartType: InventoryViewEnum) {
    return this.dialog
      .open(BulkAddToOrderModalComponent, {
        width: '1500px',
        disableClose: true,
        data: {
          productLots,
          membersList,
          cartType
        }
      })
      .afterClosed();
  }
}
