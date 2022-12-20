import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { TransactionSummaryService } from '@views/main/order/order-details/transaction-summary/transaction-summary.service';
import { Subject } from 'rxjs';
import { DialogModalComponent, DialogType } from '@components/common/modals/dialog-modal/dialog-modal.component';
import { InventoryViewEnum, RoleInTransaction } from '@app/services/app-layer/app-layer.enums';
import { TransactionEntity } from '@app/services/app-layer/entities/transaction';
import { Environment } from '@services/app-layer/app-layer.environment';
import { NotificationHelperService } from '@services/helpers/notification-helper/notification-helper.service';
import { Router } from '@angular/router';
import { OrderEntity } from '@app/services/app-layer/entities/order';
import { AddTallyUnitModalComponent } from '@views/main/common/modals/add-tally-unit-modal/add-tally-unit-modal.component';
import { TransactionsService } from '@services/app-layer/transactions/transactions.service';
import { InventorySearchEntity, ProductEntity } from '@services/app-layer/entities/inventory-search';
import { AccessControlScope } from '@services/app-layer/permission/permission.interface';
import { first, tap } from 'rxjs/operators';

@Component({
  selector: 'app-add-product-lot-modal',
  templateUrl: './add-product-lot-modal.component.html',
  styleUrls: ['./add-product-lot-modal.component.scss']
})
export class AddProductLotModalComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  public fixedFilters: any;
  public order: OrderEntity;

  public RoleInTransaction = RoleInTransaction;

  public selectedProductLot: InventorySearchEntity; // TODO what if market? something common
  public productActions: { onProductLotSelect: (productLot: InventorySearchEntity) => void };

  lots: InventorySearchEntity[] = [];
  transactionData: TransactionEntity;

  readonly InventoryViewEnum = InventoryViewEnum;
  inventoryView: InventoryViewEnum = InventoryViewEnum.ProductView;

  constructor(
    private dialog: MatDialog,
    private notificationHelperService: NotificationHelperService,
    private dialogRef: MatDialogRef<AddProductLotModalComponent>,
    private router: Router,
    private transactionsService: TransactionsService,
    private transactionSummaryService: TransactionSummaryService,
    @Inject(MAT_DIALOG_DATA) private data: { transactionData: TransactionEntity; lots: InventorySearchEntity[] }
  ) {
    this.closeOnRouteChange(dialogRef);
  }

  ngOnInit() {
    this.lots = this.data.lots;
    this.transactionData = this.data.transactionData;
    this.setInitialFilters();
    this.setActions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.unsubscribe();
  }

  inventoryViewChanged(e): void {
    this.inventoryView = e;
  }

  headerText(): string {
    return `Add From ${this.transactionData.role === RoleInTransaction.Seller ? 'Inventory' : 'Market'}`;
  }

  close(): void {
    this.dialogRef.close();
  }

  /*
   * private helpers
   * */

  private handleTxShipFromFix(): void {
    const organizationId = this.selectedProductLot.organizationId;
    const shipFromId = this.selectedProductLot.shipFromId;
    const organizationName = this.selectedProductLot.organizationName;
    const shipFromShortName = this.selectedProductLot.shipFromShortName;

    const isChanged =
      this.fixedFilters?.organizationId !== organizationId || this.fixedFilters?.shipFromId !== shipFromId;
    if (!isChanged) return;

    this.dialog.open(DialogModalComponent, {
      width: '450px',
      disableClose: true,
      data: {
        type: DialogType.Alert,
        title: 'Attention Please!',
        content:
          'As a transaction can contain product lots only from one company and facility, your ' +
          (this.transactionData.isSales ? 'inventory' : 'market') +
          ' data is filtered with current product lot company and ship from facility'
      }
    });
    this.fixedFilters = {
      organizationId: organizationId,
      organizationName: organizationName,
      shipFromId: shipFromId,
      shipFromShortName: shipFromShortName
    };
  }

  private isProductLotInvalid(): boolean {
    if (
      this.transactionData.role === RoleInTransaction.Buyer &&
      this.selectedProductLot?.organizationId === Environment.getCurrentUser().companyId
    ) {
      this.notificationHelperService.showValidation('You cannot buy products that your company already owns');
      return true;
    }
    if (
      this.selectedProductLot.isRandomLengthLot &&
      this.selectedProductLot.products.some(p => !p.isLengthUnitsFixed)
    ) {
      this.notificationHelperService.showValidation('The product lot random length units are not defined');
      return true;
    }
    if (this.transactionData.tally.hasUnitWithLotId(this.selectedProductLot.lotId)) {
      this.selectedProductLot.availableProducts = this.selectedProductLot.availableProducts.filter(
        p => !this.transactionData.tally.units.some(u => u.product.id === p.id)
      );
      this.selectedProductLot.hasAvailableProducts = !!this.selectedProductLot.availableProducts.length;
      if (!this.selectedProductLot.hasAvailableProducts) {
        this.notificationHelperService.showValidation('The product lot is already added to tally');
        return true;
      }
    }
    if (!this.selectedProductLot.hasAvailableProducts) {
      this.notificationHelperService.showValidation('The product lot does not have available products');
      return true;
    }

    // TODO later move these checks to a helper service.
    const txPermissions =
      Environment.getCurrentUser().normalizedAccessControlRoles.TRANSACTION.transactionSection.sectionGroup;
    const canReadOnlyOwnTx = txPermissions.create.value === AccessControlScope.Owner;
    if (
      canReadOnlyOwnTx &&
      this.selectedProductLot.ownerId !== Environment.getCurrentUser().id &&
      !this.transactionData.tallyUnits.length
    ) {
      this.notificationHelperService.showValidation('You do not have enough access roles.');
      return true;
    }

    // TODO remove later
    const priceSystem = this.transactionData.tally.priceSystem;
    if (priceSystem && this.selectedProductLot.spec.priceSystem !== priceSystem) {
      this.notificationHelperService.showValidation('Price system should be unique across the Transaction tally');
      return true;
    }
    return false;
  }

  private closeOnRouteChange(dialogRef: MatDialogRef<AddProductLotModalComponent>) {
    this.router.events.subscribe(() => {
      dialogRef.close();
    });
  }

  public setInitialFilters(): void {
    const sellerCompany = this.transactionData.sellerCompany;
    const shipFrom = this.transactionData.shipFrom;
    if (sellerCompany && sellerCompany.id) {
      const filters = {
        organizationId: sellerCompany.id,
        organizationName: sellerCompany.name,
        shipFromId: null,
        shipFromShortName: null
      };
      if (this.transactionData.tally.units.length) {
        filters.shipFromId = shipFrom?.id || null;
        filters.shipFromShortName = shipFrom?.shortName || null;
      }

      this.fixedFilters = filters;
    }
  }

  public onNoTallyUnitsLeft(): void {
    this.fixedFilters = { ...this.fixedFilters, shipFromId: null, shipFromShortName: null };
  }

  private setActions(): void {
    this.productActions = {
      onProductLotSelect: (productLot: InventorySearchEntity) => {
        this.selectedProductLot = productLot;
        if (this.isProductLotInvalid()) return;
        const availableProducts = this.transactionData.isSales
          ? this.selectedProductLot.availableProducts
          : this.selectedProductLot.products;
        this.openAddToTallyModal(availableProducts);
      }
    };
  }

  streamlineRowSelected(e: ProductEntity[]): void {
    const sampleProduct = e[0];
    const priceSystem = this.transactionData.tally.priceSystem;
    if (priceSystem && sampleProduct.spec.priceSystem !== priceSystem) {
      return this.notificationHelperService.showValidation(
        'Price system should be unique across the Transaction tally'
      );
    }
    this.selectedProductLot = new InventorySearchEntity().init({
      lot: sampleProduct.lot,
      spec: sampleProduct.spec,
      specShorthand: sampleProduct.specShorthand,
      products: [sampleProduct],
      productName: sampleProduct.spec.productName
    });
    const availableProductsList = e.filter(
      p =>
        !p.isAllocated &&
        (!p.isRandomLengthProduct || p.isLengthUnitsFixed) &&
        !this.transactionData.tallyUnits.some(u => u.product.id === p.id)
    );
    if (!availableProductsList.length)
      return this.notificationHelperService.showValidation('No available products to add to this transaction');
    this.openAddToTallyModal(availableProductsList);
  }

  private openAddToTallyModal(availableProducts: ProductEntity[]): void {
    this.dialog
      .open(AddTallyUnitModalComponent, {
        width: '450px',
        disableClose: false,
        data: { transaction: this.transactionData, availableProductsList: availableProducts }
      })
      .afterClosed()
      .subscribe((added: boolean) => {
        if (added) {
          this.handleTxShipFromFix();
          this.reloadTransaction();
        }
      });
  }

  public reloadTransaction(): void {
    this.transactionSummaryService.loadTransactionById(this.transactionData.id).subscribe(tx => {
      this.transactionData = new TransactionEntity().init(tx);
      this.loadTransactionTallyLotsForSeller();
    });
  }

  private loadTransactionTallyLotsForSeller() {
    this.transactionSummaryService
      .loadTransactionTallyLotsForSeller(this.transactionData)
      .pipe(
        first(),
        tap((items: InventorySearchEntity[]) => (this.lots = items))
      )
      .subscribe();
  }
}
