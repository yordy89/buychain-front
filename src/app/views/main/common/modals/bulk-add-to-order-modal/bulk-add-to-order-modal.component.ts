import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { InventoryStreamlineEntity, ProductEntity } from '@services/app-layer/entities/inventory-search';
import { MemberEntity } from '@services/app-layer/entities/member';
import { ProductLotSearchBase } from '@services/app-layer/entities/product';
import { catchError, first, map, switchMap, takeUntil, tap } from 'rxjs/operators';
import { InventorySearchHelperService } from '@views/main/common/inventory/inventory-search/inventory-search.helper.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ProductsService } from '@services/app-layer/products/products.service';
import { NotificationHelperService } from '@services/helpers/notification-helper/notification-helper.service';
import { SearchService } from '@services/app-layer/search/search.service';
import { InventoryOverviewService } from '@views/main/inventory/inventory-overview/inventory-overview.service';
import { AccessControlScope } from '@services/app-layer/permission/permission.interface';
import { Environment } from '@services/app-layer/app-layer.environment';
import { IntegerValidator } from '@validators/integer.validator/integer.validator';
import { InventoryViewEnum, OrderTypeEnum, StockSubTypeEnum } from '@services/app-layer/app-layer.enums';
import { TransactionsService } from '@services/app-layer/transactions/transactions.service';
import { combineLatest, EMPTY, Observable, of, Subject } from 'rxjs';
import { ProductsHelper } from '@services/app-layer/products/products-helper';
import { FormGroupHelper } from '@services/helpers/utils/form-group-helper';
import { InventoryStreamlineHelperService } from '@views/main/common/inventory/inventory-streamline/inventory-streamline.helper.service';
import { ShoppingCartService } from '@views/main/common/shopping-cart/shopping-cart.service';

class ProductLotSearchExtendedEntity extends ProductLotSearchBase {
  unitsToAddControl: FormControl;
  isAlreadyInTx: boolean;
}

class InventoryStreamlineExtendedEntity extends InventoryStreamlineEntity {
  unitsToAddControl: FormControl;
  maxAvailableForTargetTx: number;
}

@Component({
  selector: 'app-bulk-add-to-order-modal',
  templateUrl: './bulk-add-to-order-modal.component.html'
})
export class BulkAddToOrderModalComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  compatibilityIssues = {
    priceSystem: false,
    shipFrom: false,
    availableProducts: false,
    productsToAddCount: false
  };

  targetTxControl = new FormControl(null, Validators.required);
  formGroup = new FormGroup({ targetTxControl: this.targetTxControl });
  targetTxs: any[];

  userPermissions = { canCreateTransactions: false, canReadOnlyOwnTx: false };
  isContractsSupported = false;
  masterViewSummary = {
    totalWeight: 0,
    totalMeasure: 0,
    measureLabel: '',
    totalCostBasis: 0,
    totalSalesPrice: 0,
    totalProfit: 0
  };
  productViewSummary = {
    totalWeight: 0,
    totalMeasure: 0,
    measureLabel: '',
    totalCostBasis: 0,
    totalSalesPrice: 0,
    totalProfit: 0
  };

  isVisibleInventoryTypeColumn = false;

  inventoryView: InventoryViewEnum = InventoryViewEnum.MasterView;
  InventoryViewEnum = InventoryViewEnum;
  productViewData: InventoryStreamlineExtendedEntity[] = [];

  constructor(
    private productsService: ProductsService,
    private searchService: SearchService,
    private transactionsService: TransactionsService,
    private inventoryOverviewService: InventoryOverviewService,
    private inventorySearchHelperService: InventorySearchHelperService,
    private inventoryStreamlineHelperService: InventoryStreamlineHelperService,
    private notificationHelperService: NotificationHelperService,
    private shoppingCartService: ShoppingCartService,
    private dialogRef: MatDialogRef<BulkAddToOrderModalComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      membersList: MemberEntity[];
      productLots: ProductLotSearchExtendedEntity[];
      hideInventoryTypeColumn: boolean;
      cartType: InventoryViewEnum;
    }
  ) {}

  ngOnInit(): void {
    this.userPermissions = this.inventoryOverviewService.getUserPermissionsForInventory();
    this.isContractsSupported = Environment.isContractsSupported();
    this.isVisibleInventoryTypeColumn = this.isContractsSupported && !this.data.hideInventoryTypeColumn;
    this.inventoryView = this.data.cartType;
    this.addControls();
    this.refreshSupportingData();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.unsubscribe();
  }

  onChangeInventoryView(e): void {
    this.inventoryView = e.value;
    this.checkCompatibility();
    this.checkProductsCountCompatibility();
  }

  close(transactionId?: string) {
    this.dialogRef.close(transactionId);
  }

  createTxWithLots(): void {
    this.targetTxControl.reset();
    const entities = this.inventoryView === InventoryViewEnum.MasterView ? this.data.productLots : this.productViewData;
    if (entities.some(l => l.unitsToAddControl.invalid)) {
      return this.notificationHelperService.showValidation('Please provide proper inputs for units to add.');
    }

    const products = this.adjustOwnerSorting(this.extractProductsToAdd());

    this.transactionsService
      .createTransaction({
        type: OrderTypeEnum.Stock,
        subtype: StockSubTypeEnum.SalesOrder
      })
      .pipe(switchMap(transaction => this.addProductsToTransaction(products, transaction.id)))
      .pipe(
        catchError(err => {
          console.log('here', err);
          this.notificationHelperService.showValidation(
            'Something unexpected happened. Please reload the page and try again.'
          );
          throw EMPTY;
        })
      )
      .subscribe(transactionId => {
        this.notificationHelperService.showSuccess('The Transaction with specified products got successfully created.');
        this.close(transactionId);
      });
  }

  submitToAdd(): void {
    const entities = this.inventoryView === InventoryViewEnum.MasterView ? this.data.productLots : this.productViewData;
    if (entities.some(l => l.unitsToAddControl.invalid)) {
      return this.notificationHelperService.showValidation('Please provide proper inputs for units to add.');
    }

    const products = this.adjustOwnerSorting(this.extractProductsToAdd());

    if (
      this.inventoryView === InventoryViewEnum.ProductView &&
      products.length < this.productViewData.reduce((acc, cur) => acc + cur.unitsToAddControl.value, 0)
    ) {
      return this.notificationHelperService.showValidation(
        'Some of selected products are already added to the target transaction.'
      );
    }
    const targetTxId = this.targetTxControl.value;
    this.addProductsToTransaction(products, targetTxId)
      .pipe(
        catchError(() => {
          this.notificationHelperService.showValidation(
            'Something unexpected happened. Please reload the page and try again.'
          );
          throw EMPTY;
        })
      )
      .subscribe(transactionId => {
        this.notificationHelperService.showSuccess('The products got successfully added to the selected transaction.');
        this.close(transactionId);
      });
  }

  noCompatibilityIssues(): boolean {
    return !(
      this.compatibilityIssues.shipFrom ||
      this.compatibilityIssues.priceSystem ||
      this.compatibilityIssues.productsToAddCount
    );
  }

  txContainsSomeOfLots(): boolean {
    if (!this.targetTxControl.value || this.inventoryView === InventoryViewEnum.ProductView) return false;
    return this.data.productLots.some(l => l.isAlreadyInTx);
  }

  removeLot(lot: ProductLotSearchExtendedEntity): void {
    this.data.productLots = this.data.productLots.filter(l => l.lotId !== lot.lotId);
    this.refreshSupportingData();
    this.updateCartUnits();
  }
  removeLine(entry: InventoryStreamlineExtendedEntity): void {
    this.data.productLots = this.data.productLots.filter(l => l.specShorthand !== entry.specShorthand);
    this.refreshSupportingData();
    this.updateCartUnits();
  }
  private refreshSupportingData(): void {
    this.groupForProductView();
    this.checkCompatibility();
    if (this.noCompatibilityIssues()) {
      this.runSummaryCalculations();
      this.searchTargetTransactions();
    }
    this.handleTargetTxValueChange();
  }

  private updateCartUnits(): void {
    if (this.data.cartType === InventoryViewEnum.MasterView) {
      this.shoppingCartService.setCartUnitsForMasterView(
        this.shoppingCartService.masterViewCartUnits$
          .getValue()
          .filter(item => this.data.productLots.some(lot => lot.lotId === item.lotId))
      );
    } else if (this.data.cartType === InventoryViewEnum.ProductView) {
      this.shoppingCartService.setCartUnitsForProductView(this.productViewData);
    }
  }

  private addProductsToTransaction(products: ProductEntity[], transactionId): Observable<any> {
    let load = products.map(p =>
      this.transactionsService.addTransactionTallyUnit(transactionId, {
        product: p.id,
        offer: p.salesData.priceOfMerit
      })
    );

    const firstElement = load.shift();
    if (!load.length) load = [of(null)];
    return firstElement.pipe(switchMap(() => combineLatest(load))).pipe(
      takeUntil(this.destroy$),
      map(() => transactionId)
    );
  }

  private adjustOwnerSorting(products: ProductEntity[]): ProductEntity[] {
    if (this.userPermissions.canReadOnlyOwnTx) {
      const index = products.findIndex(p => p.owner === Environment.getCurrentUser().id);
      if (index !== -1) products.unshift(products.splice(index, 1)[0]);
    }
    return products;
  }

  private extractProductsToAdd(): ProductEntity[] {
    let products = [];
    if (this.inventoryView === InventoryViewEnum.MasterView) {
      this.data.productLots.forEach(lot => {
        products = [
          ...products,
          ...ProductsHelper.sortProductsBySelectionCriteria(lot.availableProducts).slice(0, lot.unitsToAddControl.value)
        ];
      });
    } else {
      const targetTx = this.targetTxs.find(t => t.id === this.targetTxControl.value);
      this.productViewData.forEach(entity => {
        products = [
          ...products,
          ...ProductsHelper.sortProductsBySelectionCriteria(entity.availableProducts)
            .filter(p => !targetTx || !targetTx.tally?.units.some(u => u.product.id === p.id))
            .slice(0, entity.unitsToAddControl.value)
        ];
      });
    }
    return products;
  }

  private searchTargetTransactions(): void {
    const payload = this.inventoryOverviewService.getSearchTxInventoryPayload();
    this.searchService
      .fetchTransactionData(payload)
      .pipe(
        first(),
        tap(transactions => {
          this.targetTxs = transactions
            .map(t => this.inventoryOverviewService.normalizeTransaction(t))
            .filter(transaction => this.isTransactionValid(transaction));
        })
      )
      .subscribe();
  }

  private checkCompatibility(): void {
    const sample = this.data.productLots[0];
    this.compatibilityIssues.priceSystem = this.data.productLots.some(
      lot => lot.spec.priceSystem !== sample.spec.priceSystem
    );
    this.compatibilityIssues.shipFrom = this.data.productLots.some(lot => lot.shipFromId !== sample.shipFromId);
    this.compatibilityIssues.availableProducts =
      this.inventoryView === InventoryViewEnum.MasterView
        ? this.data.productLots.some(lot => !lot.hasAvailableProducts)
        : this.productViewData.some(entity => !entity.hasAvailableProducts);
  }

  private isTransactionValid(transaction): boolean {
    const sampleLot = this.data.productLots[0];
    const shipFromId = transaction.getShipFrom.id;
    if (shipFromId && shipFromId !== sampleLot.shipFromId) return false;

    const txPriceSystem = transaction?.tally?.units?.length
      ? transaction.tally.units[0].product?.spec?.priceSystem
      : null;
    if (txPriceSystem && txPriceSystem !== sampleLot.spec.priceSystem) return false;

    const txPermissions =
      Environment.getCurrentUser().normalizedAccessControlRoles.TRANSACTION.transactionSection.sectionGroup;
    const canUpdateOnlyOwnTally = txPermissions.updateTally.value === AccessControlScope.Owner;
    if (canUpdateOnlyOwnTally && !transaction.isResourceOwner) return false;

    const canReadOnlyOwnTx = txPermissions.readList.value === AccessControlScope.Owner;
    return !(
      canReadOnlyOwnTx &&
      !transaction?.tally?.units?.length &&
      !this.data.productLots.some(l => l.ownerId === Environment.getCurrentUser().id)
    );
  }

  private addControls(): void {
    this.data.productLots.forEach(lot => {
      lot.unitsToAddControl = new FormControl(1, [
        Validators.required,
        Validators.min(0),
        IntegerValidator(),
        Validators.max(lot.availableProductsCount)
      ]);
    });
  }

  private handleTargetTxValueChange(): void {
    this.targetTxControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(txId => {
      const transaction = this.targetTxs.find(tx => tx.id === txId);
      this.data.productLots.forEach(
        lot => (lot.isAlreadyInTx = !!transaction && transaction?.tally?.tallyLots?.some(u => u.lot === lot.lotId))
      );
      this.productViewData.forEach(entity => {
        entity.maxAvailableForTargetTx = entity.availableProducts.filter(
          p => !transaction || !transaction.tally?.units.some(u => u.product.id === p.id)
        ).length;
      });
    });
  }

  public runSummaryCalculations(): void {
    Object.keys(this.masterViewSummary).forEach(key => (this.masterViewSummary[key] = 0));
    Object.keys(this.productViewSummary).forEach(key => (this.productViewSummary[key] = 0));
    this.checkProductsCountCompatibility();

    this.data.productLots.forEach(lot => {
      this.masterViewSummary.totalCostBasis += lot.averageCostBasis * lot.unitsToAddControl.value;
      this.masterViewSummary.totalSalesPrice += lot.askPricePerUnit * lot.unitsToAddControl.value;
      this.masterViewSummary.totalProfit += ProductsHelper.calcProfitTotal(
        lot.products.slice(0, lot.unitsToAddControl.value)
      );
      // TODO apply sorting maybe later
      const measure = ProductsHelper.getProductLotMeasuresInUom(lot.spec, lot.unitsToAddControl.value);
      this.masterViewSummary.measureLabel = ProductsHelper.getMeasureLabel(lot.spec);
      this.masterViewSummary.totalMeasure += measure;
      this.masterViewSummary.totalWeight += measure * 3500; // TODO some time in future need to make weight calculation more formal.
      FormGroupHelper.markControlUntouchedAndPristine(lot.unitsToAddControl);
    });

    this.productViewData.forEach(entity => {
      this.productViewSummary.totalCostBasis += entity.averageCostBasis * entity.unitsToAddControl.value;
      this.productViewSummary.totalSalesPrice += entity.averageAskPricePerUnit * entity.unitsToAddControl.value;
      this.productViewSummary.totalProfit += ProductsHelper.calcProfitTotal(
        ProductsHelper.sortProductsBySelectionCriteria(entity.availableProducts).slice(
          0,
          entity.unitsToAddControl.value
        )
      );
      const measure = ProductsHelper.getProductLotMeasuresInUom(entity.spec, entity.unitsToAddControl.value);
      this.productViewSummary.measureLabel = ProductsHelper.getMeasureLabel(entity.spec);
      this.productViewSummary.totalMeasure += measure;
      this.productViewSummary.totalWeight += measure * 3500;
      FormGroupHelper.markControlUntouchedAndPristine(entity.unitsToAddControl);
    });
  }

  private checkProductsCountCompatibility(): void {
    this.compatibilityIssues.productsToAddCount =
      this.inventoryView === InventoryViewEnum.MasterView
        ? this.data.productLots.every(lot => lot.unitsToAddControl.value === 0)
        : this.productViewData.every(entity => entity.unitsToAddControl.value === 0);
  }

  private groupForProductView(): void {
    const products = this.data.productLots.reduce((acc, cur) => [...acc, ...cur.products], []);
    this.productViewData = this.inventoryStreamlineHelperService
      .groupProductsBySpec(products)
      .map(item => new InventoryStreamlineExtendedEntity().init(item));

    this.productViewData.forEach(
      entity =>
        (entity.unitsToAddControl = new FormControl(1, [
          Validators.required,
          Validators.min(0),
          IntegerValidator(),
          Validators.max(entity.availableProductsCount)
        ]))
    );
  }
}
