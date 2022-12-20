import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatMenuTrigger } from '@angular/material/menu';
import { NavigationHelperService } from '@services/helpers/navigation-helper/navigation-helper.service';
import { TransactionsService } from '@app/services/app-layer/transactions/transactions.service';
import {
  InventoryViewEnum,
  OrderTypeEnum,
  ProductPurchaseMethod,
  StockSubTypeEnum
} from '@app/services/app-layer/app-layer.enums';
import { TransactionEntity } from '@services/app-layer/entities/transaction';
import { Environment } from '@services/app-layer/app-layer.environment';
import { NotificationHelperService } from '@services/helpers/notification-helper/notification-helper.service';
import { HistoricalPriceModalComponent } from '@app/views/main/common/modals/historical-price-modal/historical-price-modal.component';
import { SearchService } from '@services/app-layer/search/search.service';
import { ContractProductsModalComponent } from '@views/main/common/modals/contract-products-modal/contract-products-modal.component';
import { first, takeUntil, tap } from 'rxjs/operators';
import { Observable, Subject } from 'rxjs';
import { InventorySearchComponent } from '@views/main/common/inventory/inventory-search/inventory-search.component';
import { AddTallyUnitModalComponent } from '@views/main/common/modals/add-tally-unit-modal/add-tally-unit-modal.component';
import { InventorySearchEntity } from '@services/app-layer/entities/inventory-search';
import { InventoryOverviewService } from '@views/main/inventory/inventory-overview/inventory-overview.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-inventory-overview',
  templateUrl: './inventory-overview.component.html',
  styleUrls: ['./inventory-overview.component.scss']
})
export class InventoryOverviewComponent implements OnInit, OnDestroy {
  @ViewChild(MatMenuTrigger) inventoryMenu: MatMenuTrigger;
  @ViewChild(InventorySearchComponent) inventorySearch: InventorySearchComponent;
  public contextMenuPosition = { x: '0px', y: '0px' };

  readonly InventoryViewEnum = InventoryViewEnum;
  inventoryView: InventoryViewEnum = InventoryViewEnum.ProductView;

  public availableTransactions: TransactionEntity[];

  public selectedProductLot: InventorySearchEntity;
  public productActions: { onProductLotSelect: (inventoryItem: InventorySearchEntity, event?) => void };

  public userPermissions = {
    canReadTransactions: false,
    canReadOnlyOwnTx: false,
    canCreateTransactions: false,
    canUpdateTally: false,
    canUpdateOwnTally: false
  };

  isVisibleConvertToCash = false;
  isVisibleShowContractItems = false;

  readonly isMarketDataEnabled = Environment.getCompanyFeatures()?.marketData;
  readonly productPurchaseMethod = ProductPurchaseMethod;

  private destroy$ = new Subject<void>();

  constructor(
    private dialog: MatDialog,
    private transactionsService: TransactionsService,
    private searchService: SearchService,
    private navigationHelperService: NavigationHelperService,
    private notificationHelperService: NotificationHelperService,
    private inventoryOverviewService: InventoryOverviewService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      if (params.view === InventoryViewEnum.MasterView) this.inventoryView = InventoryViewEnum.MasterView;
      this.router.navigate([], { queryParams: null });
    });
    this.setUserPermissions();
    this.productActions = {
      onProductLotSelect: (inventoryItem: InventorySearchEntity, event?) => {
        if (!inventoryItem || !inventoryItem.lotId) return;

        this.selectedProductLot = inventoryItem;
        this.computeButtonsVisibility();
        this.setMenuCoordinates(event);

        this.userPermissions.canReadTransactions
          ? this.loadAvailableTransactions()
              .pipe(takeUntil(this.destroy$))
              .subscribe(() => this.openMenu())
          : this.openMenu();
      }
    };
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  inventoryViewChanged(e): void {
    this.inventoryView = e;
  }

  private computeButtonsVisibility() {
    this.isVisibleConvertToCash = this.selectedProductLot?.inventoryType !== this.productPurchaseMethod.CASH;

    if (Environment.isContractsSupported()) {
      this.isVisibleShowContractItems = !!this.selectedProductLot.products.filter(item => !!item.contract).length;
    }
  }

  onShowContractItems() {
    const products = this.selectedProductLot.products.filter(item => !!item.contract);

    this.dialog
      .open(ContractProductsModalComponent, {
        width: '1500px',
        disableClose: true,
        data: {
          products,
          crmAccounts: this.inventorySearch.allAccountList
        }
      })
      .afterClosed()
      .subscribe(refresh => {
        this.refreshData(refresh);
      });
  }

  onCloseContract() {
    this.inventorySearch.closeProductsContract(this.selectedProductLot.products);
  }

  private refreshData(refresh) {
    if (!refresh) {
      return;
    }
    this.inventorySearch.loadFreshData();
  }

  public openProductLotDetails(): void {
    this.navigationHelperService.navigateToInventoryLotDetails(this.selectedProductLot.lotId);
  }

  openLotInNewTab(): void {
    if (!this.selectedProductLot?.lotId) return;
    window.open(`${location.href}/${this.selectedProductLot.lotId}`);
  }
  openLotInNewWindow(): void {
    if (!this.selectedProductLot?.lotId) return;
    const strWindowFeatures = 'location=yes';
    window.open(`${location.href}/${this.selectedProductLot.lotId}`, '_blank', strWindowFeatures);
  }

  public addLotToTransactionTally(transaction: TransactionEntity): void {
    if (this.isProductLotInvalidForTx(transaction)) return;
    this.dialog.open(AddTallyUnitModalComponent, {
      width: '450px',
      disableClose: false,
      data: { transaction: transaction, availableProductsList: this.selectedProductLot.availableProducts }
    });
  }

  public async createNewTransaction() {
    if (this.isProductLotInvalidForTx()) return;
    const transaction = await this.transactionsService
      .createTransaction({
        type: OrderTypeEnum.Stock,
        subtype: StockSubTypeEnum.SalesOrder
      })
      .toPromise();
    this.dialog
      .open(AddTallyUnitModalComponent, {
        width: '450px',
        disableClose: false,
        data: { transaction: transaction, availableProductsList: this.selectedProductLot.availableProducts }
      })
      .afterClosed()
      .subscribe((added: boolean) => {
        added
          ? this.navigationHelperService.navigateToTransaction(transaction)
          : this.transactionsService.deleteTransaction(transaction.id).pipe(takeUntil(this.destroy$)).subscribe();
      });
  }

  onAddToCart(): void {
    this.inventorySearch.addToCart([this.selectedProductLot]);
  }

  onAddToOrder() {
    this.inventorySearch.addToOrder([this.selectedProductLot]);
  }

  public openHistoricalPriceDetails() {
    this.dialog.open(HistoricalPriceModalComponent, {
      width: '1200px',
      maxWidth: '1700px',
      disableClose: true,
      data: this.selectedProductLot
    });
  }

  onClosedMenu() {
    this.inventorySearch.focusGrid();
  }

  /*
   * private helpers
   * */

  private setUserPermissions(): void {
    this.userPermissions = this.inventoryOverviewService.getUserPermissionsForInventory();
  }

  private loadAvailableTransactions(): Observable<any> {
    return this.searchService.fetchTransactionData(this.inventoryOverviewService.getSearchTxInventoryPayload()).pipe(
      first(),
      tap(transactions => {
        this.availableTransactions = transactions
          .map(t => this.inventoryOverviewService.normalizeTransaction(t))
          .filter(transaction => this.isTransactionValid(transaction));
      })
    );
  }

  private setMenuCoordinates(event): void {
    if (event) {
      this.contextMenuPosition.x = `${event.event.clientX}px`;
      this.contextMenuPosition.y = `${event.event.clientY}px`;
    }
  }
  private openMenu(): void {
    this.inventoryMenu.openMenu();
  }

  private isProductLotInvalidForTx(transaction?: TransactionEntity): boolean {
    if (
      this.selectedProductLot.isRandomLengthLot &&
      this.selectedProductLot.products.some(p => !p.isLengthUnitsFixed)
    ) {
      this.notificationHelperService.showValidation('The product lot random length units are not defined');
      return true;
    }

    if (this.checkResourcePermissionOwner()) {
      this.notificationHelperService.showValidation('You do not have enough access roles.');
      return true;
    }

    if (transaction?.tally.hasUnitWithLotId(this.selectedProductLot.lotId)) {
      this.selectedProductLot.availableProducts = this.selectedProductLot.availableProducts.filter(
        p => !transaction.tally.units.some(u => u.product.id === p.id)
      );
      this.selectedProductLot.hasAvailableProducts = !!this.selectedProductLot.availableProducts.length;
      if (!this.selectedProductLot.hasAvailableProducts) {
        this.notificationHelperService.showValidation('The product lot is already added to tally of this transaction');
        return true;
      }
    }

    if (!this.selectedProductLot.hasAvailableProducts) {
      this.notificationHelperService.showValidation('The product lot products are already allocated or sold.');
      return true;
    }

    const priceSystem = transaction?.tally?.priceSystem;
    if (priceSystem && this.selectedProductLot.spec.priceSystem !== priceSystem) {
      this.notificationHelperService.showValidation('Price system should be unique across the Transaction tally');
      return true;
    }
    return false;
  }

  private isTransactionValid(transaction): boolean {
    const shipFromId = transaction.getShipFrom.id;
    if (this.checkResourcePermissionOwner(transaction)) return false;
    return (
      (!shipFromId || shipFromId === this.selectedProductLot.shipFromId) &&
      !(this.userPermissions.canUpdateOwnTally && !transaction.isResourceOwner)
    );
  }

  // TODO find better name
  // user read tx = OWNER, lot owner is UserX and tx has no tally, on add,
  // tx resource owner changes to UserX and current user cannot read tx any more
  private checkResourcePermissionOwner(transaction?: TransactionEntity): boolean {
    return (
      this.userPermissions.canReadOnlyOwnTx &&
      this.selectedProductLot.ownerId !== Environment.getCurrentUser().id &&
      !transaction?.tally?.units?.length
    );
  }
}
