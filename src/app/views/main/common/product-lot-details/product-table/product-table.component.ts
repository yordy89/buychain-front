import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Optional,
  Output,
  SimpleChanges
} from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { FABAction } from '@app/models';
import { CrmAccountEntity } from '@services/app-layer/entities/crm';
import { InventorySearchEntity, ProductEntity } from '@services/app-layer/entities/inventory-search';
import { MemberEntity } from '@services/app-layer/entities/member';
import { ProductsHelper } from '@services/app-layer/products/products-helper';
import { ProductsService } from '@services/app-layer/products/products.service';
import { GridHelperService } from '@services/helpers/grid-helper/grid-helper.service';
import { NavigationHelperService } from '@services/helpers/navigation-helper/navigation-helper.service';
import { NotificationHelperService } from '@services/helpers/notification-helper/notification-helper.service';
import { CloseContractModalComponent } from '@views/main/common/modals/close-contract-modal/close-contract-modal.component';
import { LogEntriesModalComponent } from '@views/main/common/modals/log-entries-modal/log-entries-modal.component';
import { differenceInDays } from 'date-fns';
import { combineLatest, of, Subject, Observable } from 'rxjs';
import { catchError, map, takeUntil, tap } from 'rxjs/operators';
import { EditProductLotModalComponent } from '../../modals/edit-product-lot-modal/edit-product-lot-modal.component';
import { SelectProductLotModalComponent } from '../select-product-lot-modal/select-product-lot-modal.component';

enum GetProductsType {
  CONTRACT,
  MOVE_TO_LOT
}

enum FABActions {
  MOVE_TO_NEW_PRODUCT_LOT,
  MOVE_TO_EXISTING_PRODUCT_LOT,
  CLOSE_CONTRACT,
  CLEAR_ALL
}

@Component({
  selector: 'app-product-table',
  templateUrl: './product-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductTableComponent implements OnInit, OnDestroy, OnChanges {
  @Input() productLot: InventorySearchEntity;
  @Input() lotUnitMeasure: number;
  @Input() lotUnitMeasureLabel: string;
  @Input() canMoveProduct = false;
  @Input() companyMembers: MemberEntity[] = [];
  @Input() crmAccounts: CrmAccountEntity[] = [];
  @Input() productsList: ProductEntity[] = [];
  @Output() updated = new EventEmitter<ProductEntity[]>();

  hasClosedBrokerContract = false;
  hasClosedSupplyContract = false;
  allDisabled = true;
  selectedProductsIds: string[] = [];
  fabActions: FABAction[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    private productsService: ProductsService,
    private navigationService: NavigationHelperService,
    private notificationService: NotificationHelperService,
    @Optional() private dialogRef: MatDialogRef<EditProductLotModalComponent>,
    private dialog: MatDialog,
    private cd: ChangeDetectorRef,
    private gridHelperService: GridHelperService
  ) {}

  ngOnInit(): void {
    this.initFABTableActions();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnChanges({ productsList }: SimpleChanges) {
    if (productsList?.currentValue) {
      this.handleFlags();
    }
  }

  calculateCostBasisUoMValue = (data: ProductEntity) => (data.costBasis || 0) / (this.lotUnitMeasure || 1);

  customizeAvgAcquiredAgeText = () => {
    const age = ProductsHelper.getAveragePurchaseAge(this.productsList);
    return `Avg Age: ${age} ${age === 1 ? 'day' : 'days'}`;
  };

  customizeAvgLandedAgeText = () => {
    const age = ProductsHelper.getAverageLandedAge(this.productsList);
    return `Avg Age: ${age} ${age === 1 ? 'day' : 'days'}`;
  };

  goToTransaction(event, txId: string) {
    event.preventDefault();
    this.navigationService.navigateToTransactionById(txId);
    if (this.dialogRef?.close) this.dialogRef.close();
  }

  calculateSummaries = e => {
    if (e.name === 'averagePurchaseAge' || e.name === 'averageLandedAge') {
      if (e.summaryProcess === 'start') {
        e.totalValue = {
          totalPurchaseDaysCount: this.productsList.filter(item => !!item.purchaseDate).length,
          totalLandedDaysCount: this.productsList.filter(item => !!item.landedDate).length,
          avgAcquiredAge: 0,
          avgLandedAge: 0
        };
      } else if (e.summaryProcess === 'calculate') {
        if (e.value.purchaseDate) {
          e.totalValue.avgAcquiredAge += differenceInDays(new Date(), new Date(e.value.purchaseDate));
        }

        if (e.value.landedDate) {
          e.totalValue.avgLandedAge += differenceInDays(new Date(), new Date(e.value.landedDate));
        }
      } else if (e.summaryProcess === 'finalize') {
        e.totalValue.avgAcquiredAge = e.totalValue.avgAcquiredAge / e.totalValue.totalPurchaseDaysCount;
        e.totalValue.avgLandedAge = e.totalValue.avgLandedAge / e.totalValue.totalLandedDaysCount;
      }
    }
  };

  showProductLog(product: ProductEntity) {
    this.dialog.open(LogEntriesModalComponent, {
      width: '800px',
      disableClose: true,
      data: { logs: product.log, members: this.companyMembers, name: 'Product' }
    });
  }

  onFABAction(value: FABActions) {
    switch (value) {
      case FABActions.MOVE_TO_NEW_PRODUCT_LOT:
        this.moveToNewProductLot();
        break;

      case FABActions.MOVE_TO_EXISTING_PRODUCT_LOT:
        this.moveToExistingProductLot();
        break;

      case FABActions.CLOSE_CONTRACT:
        this.closeContract();
        break;

      case FABActions.CLEAR_ALL:
        this.clearSelection();
        break;
    }
  }

  getSelectedProducts(type?: GetProductsType) {
    return this.productsList.filter(item => {
      if (!this.selectedProductsIds.includes(item.id)) {
        return false;
      }

      switch (type) {
        case GetProductsType.CONTRACT:
          return this.isAllowedCloseContractAction(item);

        case GetProductsType.MOVE_TO_LOT:
          return this.isAllowedMoveProductAction(item);

        default:
          return this.canSelectCell(item);
      }
    });
  }

  onCellPrepared(e: any) {
    const cb = (data: ProductEntity) => !this.canSelectCell(data);
    this.gridHelperService.disableCheckboxes(e, cb);
  }

  private handleFlags() {
    this.allDisabled = true;
    this.hasClosedBrokerContract = false;
    this.hasClosedSupplyContract = false;

    this.productsList.forEach(item => {
      if (this.allDisabled && this.canSelectCell(item)) {
        this.allDisabled = false;
      }

      if (!this.hasClosedBrokerContract && item.brokerContract?.isClosed) {
        this.hasClosedBrokerContract = true;
      }

      if (!this.hasClosedSupplyContract && item.supplyContract?.isClosed) {
        this.hasClosedSupplyContract = true;
      }
    });
  }

  private canSelectCell = (item: ProductEntity) =>
    this.isAllowedMoveProductAction(item) || this.isAllowedCloseContractAction(item);

  private isAllowedCloseContractAction = (item: ProductEntity) =>
    item.isContractType && ProductsHelper.canCloseContractForProduct(item);

  private isAllowedMoveProductAction = (item: ProductEntity) =>
    !item.archived && !item.isAllocated && this.canMoveProduct && !ProductsHelper.isRandomLengthProduct(item);

  private clearSelection() {
    this.selectedProductsIds = [];
  }

  private moveToNewProductLot(): void {
    const selectedProducts = this.getSelectedProducts(GetProductsType.MOVE_TO_LOT);

    if (selectedProducts.length === 0) {
      return;
    }

    this.productsService
      .splitProductFromLot(selectedProducts[0].id)
      .pipe(takeUntil(this.destroy$))
      .subscribe(updatedProductData => {
        this.productsList = this.productsList.filter(x => x.id !== selectedProducts[0].id);
        selectedProducts.shift();
        if (selectedProducts.length === 0) {
          this.updated.emit(this.productsList);
        } else {
          this.doMoveProducts(updatedProductData.lot)
            .pipe(takeUntil(this.destroy$))
            .subscribe(result =>
              this.notificationService.showSuccess(
                `${result.success + 1} of ${result.total + 1} selected products moved, ${result.failure} failed.`
              )
            );
        }
        this.cd.markForCheck();
      });
  }

  private closeContract() {
    this.dialog
      .open(CloseContractModalComponent, {
        width: '1500px',
        disableClose: true,
        data: {
          products: this.getSelectedProducts(GetProductsType.CONTRACT),
          crmAccounts: this.crmAccounts
        }
      })
      .afterClosed()
      .subscribe(refresh => {
        if (refresh) {
          this.updated.emit([]);
          this.cd.markForCheck();
        }
      });
  }

  private moveToExistingProductLot(): void {
    this.dialog
      .open(SelectProductLotModalComponent, {
        width: '600px',
        disableClose: true,
        data: { productLot: this.productLot, membersList: this.companyMembers }
      })
      .afterClosed()
      .subscribe(selectedProductLot => {
        if (selectedProductLot?.lot) {
          this.doMoveProducts(selectedProductLot.lot)
            .pipe(takeUntil(this.destroy$))
            .subscribe(result =>
              this.notificationService.showSuccess(
                `${result.success} of ${result.total} selected products moved, ${result.failure} failed.`
              )
            );
          this.cd.markForCheck();
        }
      });
  }

  private doMoveProducts(targetLotId: string): Observable<any> {
    const selectedProducts = this.getSelectedProducts(GetProductsType.MOVE_TO_LOT);
    const total = selectedProducts.length;
    if (total === 0) return;

    let success = 0;
    let failure = 0;

    const load = selectedProducts.map(product =>
      this.productsService.updateProductLot(product.id, targetLotId).pipe(
        tap(() => {
          this.productsList = this.productsList.filter(x => x.id !== product.id);
          success++;
        }),
        catchError(err => {
          failure++;
          console.warn(err);
          return of(null);
        })
      )
    );
    return combineLatest(load).pipe(
      map(() => {
        this.updated.emit(this.productsList);
        return { success, failure, total };
      })
    );
  }

  private initFABTableActions() {
    this.fabActions = [
      {
        label: 'Move to New Product Lot',
        icon: 'open_with',
        value: FABActions.MOVE_TO_NEW_PRODUCT_LOT,
        isHidden: () => !this.getSelectedProducts(GetProductsType.MOVE_TO_LOT).length
      },
      {
        label: 'Move to Existing Product Lot',
        icon: 'input',
        value: FABActions.MOVE_TO_EXISTING_PRODUCT_LOT,
        isHidden: () => !this.getSelectedProducts(GetProductsType.MOVE_TO_LOT).length
      },
      {
        label: 'Convert To Cash',
        icon: 'check',
        value: FABActions.CLOSE_CONTRACT,
        isHidden: () => !this.getSelectedProducts(GetProductsType.CONTRACT).length
      },
      {
        label: 'Clear All',
        icon: 'clear_all',
        value: FABActions.CLEAR_ALL
      }
    ];
  }
}
