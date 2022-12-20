import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { InventorySearchEntity } from '@services/app-layer/entities/inventory-search';
import { MemberEntity } from '@services/app-layer/entities/member';
import { catchError, first, tap } from 'rxjs/operators';
import { InventorySearchHelperService } from '@views/main/common/inventory/inventory-search/inventory-search.helper.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ProductsService } from '@services/app-layer/products/products.service';
import { combineLatest, of } from 'rxjs';
import { NotificationHelperService } from '@services/helpers/notification-helper/notification-helper.service';
import { Environment } from '@services/app-layer/app-layer.environment';
import { ProductsHelper } from '@services/app-layer/products/products-helper';
import { TransformHelper } from '@services/helpers/utils/transform-helper';

@Component({
  selector: 'app-merge-lots-modal',
  templateUrl: './merge-lots-modal.component.html'
})
export class MergeLotsModalComponent implements OnInit {
  compatibilityIssues = {
    specShorthand: false,
    shipFrom: false,
    owner: false,
    availableProducts: false,
    rluProduct: false,
    states: false // warning
  };

  targetLotControl = new FormControl(null, Validators.required);
  formGroup = new FormGroup({ targetLotControl: this.targetLotControl });
  targetLots: any[] = [];
  lotsSummary = { totalWeight: 0, totalMeasure: 0, measureLabel: '', totalUnitsCount: 0, totalCostBasis: 0 };

  isContractsSupported = false;

  constructor(
    private productsService: ProductsService,
    private inventorySearchHelperService: InventorySearchHelperService,
    private notificationHelperService: NotificationHelperService,
    private dialogRef: MatDialogRef<MergeLotsModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { membersList: MemberEntity[]; productLots: InventorySearchEntity[] }
  ) {}

  ngOnInit(): void {
    this.isContractsSupported = Environment.isContractsSupported();
    this.checkCompatibility();
    if (this.noCompatibilityIssues()) {
      this.runSummaryCalculations();
      this.searchTargetLots();
    }
  }

  close(changed?: boolean) {
    this.dialogRef.close(changed);
  }

  submitMerge(): void {
    const targetLotId = this.targetLotControl.value;
    const productsList = this.data.productLots.reduce(
      (acc, cur) => [...acc, ...(cur.lotId === targetLotId ? [] : cur.products)],
      []
    );

    let success = 0;
    let failure = 0;

    const load = productsList.map(product =>
      this.productsService.updateProductLot(product.id, targetLotId).pipe(
        tap(() => success++),
        catchError(err => {
          failure++;
          console.warn(err);
          return of(null);
        })
      )
    );

    combineLatest(load)
      .pipe(first())
      .subscribe(() => {
        failure
          ? this.notificationHelperService.showValidation(
              `Successfully merged ${success} products to the target lot. Failed with ${failure} products.`
            )
          : this.notificationHelperService.showSuccess(
              `Successfully merged all ${success} products to the target lot.`
            );
        this.close(!!success);
      });
  }

  noCompatibilityIssues(): boolean {
    return !(
      this.compatibilityIssues.shipFrom ||
      this.compatibilityIssues.owner ||
      this.compatibilityIssues.specShorthand ||
      this.compatibilityIssues.availableProducts ||
      this.compatibilityIssues.rluProduct
    );
  }

  searchTargetLots(): void {
    const payload = this.getSearchPayload();
    this.inventorySearchHelperService
      .loadInventoryLotsByFilters(payload)
      .pipe(first())
      .subscribe(lots => {
        this.targetLots = this.data.productLots.length === 1 ? lots : [...lots, ...this.data.productLots];

        const sampleProduct =
          this.targetLots[0].sampleProduct || this.targetLots[0].products?.length ? this.targetLots[0].products[0] : {};
        const sampleState = sampleProduct.state;
        this.targetLots.forEach(lot => {
          const sampleProduct = lot.sampleProduct || lot.products?.length ? lot.products[0] : {};
          const owner = this.data.membersList.find(m => m.id === sampleProduct.owner);
          lot.displayValue = `${TransformHelper.getShortHexGuid(sampleProduct.lot)} -
          ${owner ? owner.name + ' - ' : ''}${sampleProduct.permission} -
          ${sampleProduct.salesData.priceOfMerit} -
          ${TransformHelper.stringUnderscoreToSpaceTitleCase(sampleProduct.state)}`;
          if (sampleProduct.state !== sampleState) this.compatibilityIssues.states = true;
        });
      });
  }

  removeLot(lot: InventorySearchEntity): void {
    this.data.productLots = this.data.productLots.filter(l => l.lotId !== lot.lotId);
    this.checkCompatibility();
    if (this.noCompatibilityIssues()) {
      this.runSummaryCalculations();
      this.searchTargetLots();
    }
  }

  private checkCompatibility(): void {
    const sample = this.data.productLots[0];

    this.compatibilityIssues.specShorthand = this.data.productLots.some(
      lot => lot.specShorthand !== sample.specShorthand
    );
    this.compatibilityIssues.shipFrom = this.data.productLots.some(lot => lot.shipFromId !== sample.shipFromId);
    this.compatibilityIssues.owner = this.data.productLots.some(lot => lot.ownerId !== sample.ownerId);
    this.compatibilityIssues.availableProducts = this.data.productLots.some(lot => !lot.hasAvailableProducts);
    this.compatibilityIssues.rluProduct = this.data.productLots.some(lot => lot.isRandomLengthLot);
  }

  private getSearchPayload(): any {
    const payloadFilters = { children: { logicalOperator: 'and', items: [] } };

    // exclude already selected lots to load less
    const idsPayload = {
      children: {
        logicalOperator: 'and',
        items: this.data.productLots.map(lot => ({
          value: { comparisonOperator: 'ne', field: 'lot', fieldValue: lot.lotId }
        }))
      }
    };
    payloadFilters.children.items.push(idsPayload);

    const sample = this.data.productLots[0];

    const shipFrom = { value: { field: 'shipFrom', comparisonOperator: 'eq', fieldValue: sample.shipFromId } };
    payloadFilters.children.items.push(shipFrom);

    const owner = { value: { field: 'owner', comparisonOperator: 'eq', fieldValue: sample.ownerId } };
    payloadFilters.children.items.push(owner);

    const specShorthand = {
      value: { field: 'specShorthand', comparisonOperator: 'cn', fieldValue: sample.specShorthand }
    };
    payloadFilters.children.items.push(specShorthand);

    const hasActiveProducts = { value: { field: 'soldTransactionId', comparisonOperator: 'ex', fieldValue: false } };
    payloadFilters.children.items.push(hasActiveProducts);

    return {
      filters: payloadFilters,
      fields: ['lot', 'permission', 'salesData', 'owner', 'state']
    };
  }

  public runSummaryCalculations(): void {
    Object.keys(this.lotsSummary).forEach(key => (this.lotsSummary[key] = 0));
    this.data.productLots.forEach(lot => {
      this.lotsSummary.totalCostBasis += lot.products.reduce((acc, cur) => (acc += cur.costBasis), 0);
      const measure = ProductsHelper.getProductLotMeasuresInUom(lot.spec, lot.availableProductsCount);
      this.lotsSummary.measureLabel = ProductsHelper.getMeasureLabel(lot.spec);
      this.lotsSummary.totalMeasure += measure;
      this.lotsSummary.totalWeight += measure * 3500; // TODO some time in future need to make weight calculation more formal.
      this.lotsSummary.totalUnitsCount += lot.availableProductsCount;
    });
  }
}
