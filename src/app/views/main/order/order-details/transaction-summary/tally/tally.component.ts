import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSelectChange } from '@angular/material/select';
import { DialogModalComponent, DialogType } from '@app/components/common/modals/dialog-modal/dialog-modal.component';
import {
  ProductLotPermissionEnum,
  ProductPurchaseMethod,
  ProductStateEnum,
  RoleInTransaction,
  TransactionStateEnum,
  TransportTermEnum
} from '@app/services/app-layer/app-layer.enums';
import { Environment } from '@app/services/app-layer/app-layer.environment';
import { TallyUnitEntity, TransactionEntity } from '@app/services/app-layer/entities/transaction';
import { AccessControlScope } from '@app/services/app-layer/permission/permission.interface';
import { TransactionsService } from '@app/services/app-layer/transactions/transactions.service';
import { IntegerValidator } from '@app/validators/integer.validator/integer.validator';
import { EditProductLotModalComponent } from '@app/views/main/common/modals/edit-product-lot-modal/edit-product-lot-modal.component';
import { ContractsApiService } from '@services/app-layer/contracts/contracts-api.service';
import { ContractEntity } from '@services/app-layer/entities/contract';
import { InventorySearchEntity } from '@services/app-layer/entities/inventory-search';
import { ProductsService } from '@services/app-layer/products/products.service';
import { NavigationHelperService } from '@services/helpers/navigation-helper/navigation-helper.service';
import { BuychainLibHelper } from '@services/helpers/utils/buychain-lib-helper';
import { FormGroupHelper } from '@services/helpers/utils/form-group-helper';
import { ObjectUtil } from '@services/helpers/utils/object-util';
import { InventorySearchHelperService } from '@views/main/common/inventory/inventory-search/inventory-search.helper.service';
import { combineLatest, forkJoin, Observable, of, Subject } from 'rxjs';
import { finalize, first, mergeMap, takeUntil, tap } from 'rxjs/operators';

class TallyLineModel extends TallyUnitEntity {
  public qtyFormControl: FormControl;
  public offerFormControl: FormControl;
  public deliveredOfferFormControl: FormControl;
  public formGroup: FormGroup;
  public contractGroup: FormGroup;
  public hasInvalidShipFrom: boolean;
  public isExpanded = false;
  public needsReplacement = false;
  public canBeReplaced = false;
  public isLineInvalid = false;
}

@Component({
  selector: 'app-tally',
  templateUrl: './tally.component.html',
  styleUrls: ['./tally.component.scss']
})
export class TallyComponent implements OnDestroy, OnChanges {
  @Input() transactionData: TransactionEntity;
  @Input() set lots(lots) {
    this.initMaxAvailability(lots);
  }
  @Output() tallyChanged = new EventEmitter();
  @Output() noTallyUnitsLeft = new EventEmitter<string>();

  readonly maxSafeNumber = Environment.maxSafeNumber;

  public TransactionStateEnum = TransactionStateEnum;
  public tallyItems: TallyLineModel[] = [];
  private tallyLotsComplete: InventorySearchEntity[] = [];
  public hasMixedUoM: boolean;
  public isSeller: boolean;
  public isBuyer: boolean;
  public canUpdateTally: boolean;
  public canDeleteTally: boolean;
  public isOffbookPurchase: boolean;
  passedConfirmedState = false;
  isSellingTally = false;
  isOfferOnDeliveredPrice: boolean;

  private destroy$ = new Subject<void>();

  readonly purchaseMethods = [ProductPurchaseMethod.CASH, ProductPurchaseMethod.CONTRACT];
  readonly purchaseMethodsEnum = ProductPurchaseMethod;
  isContractAllowed = false;
  isContractsSupported = Environment.isContractsSupported();
  isContractEditMode = false;

  constructor(
    private transactionService: TransactionsService,
    private productLotService: ProductsService,
    private dialog: MatDialog,
    private navigationHelperService: NavigationHelperService,
    private inventorySearchHelperService: InventorySearchHelperService,
    private contractsApiService: ContractsApiService
  ) {}

  ngOnChanges({ transactionData }: SimpleChanges) {
    if (transactionData?.currentValue) {
      this.hasMixedUoM = this.transactionData.hasMixedUomTallyItem;
      this.isBuyer = this.transactionData.role === RoleInTransaction.Buyer;
      this.isSeller = this.transactionData.role === RoleInTransaction.Seller;
      this.setUserPermissions();
      this.passedConfirmedState = this.transactionData.passedTheState(TransactionStateEnum.Confirmed);
      this.isSellingTally = this.isSeller && !this.passedConfirmedState;
      this.isOfferOnDeliveredPrice = this.checkIfIsOfferOnDeliveredPrice();

      // todo add access roles
      this.isContractAllowed = this.transactionData.isDraftState || this.transactionData.isQuoteState;
      this.setTallyItems();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.unsubscribe();
  }

  onDeliveredValueChanged(line) {
    const term = this.transactionData.trackingData.transportTerm;
    const deliveryCostPerUom = BuychainLibHelper.getDeliveryCostPerUom();
    const offer = BuychainLibHelper.getOfferPerUom();
    line.offerFormControl.setValue(offer);
    line.formGroup.markAsDirty();
  }

  private checkIfIsOfferOnDeliveredPrice(): boolean {
    return (
      this.transactionData.role === RoleInTransaction.Seller &&
      (this.transactionData.trackingData.transportTerm === TransportTermEnum.FOB_DEST_PREPAY ||
        this.transactionData.trackingData.transportTerm === TransportTermEnum.FOB_ORIGIN_PREPAY)
    );
  }

  openTransaction(event, acquiredTransactionId: string): void {
    event.preventDefault();

    if (!acquiredTransactionId) return;
    this.navigationHelperService.navigateToTransactionById(acquiredTransactionId);
  }

  removeItem(tallyItem: TallyLineModel) {
    this.dialog
      .open(DialogModalComponent, {
        width: '450px',
        disableClose: true,
        data: {
          type: DialogType.Confirm,
          content: 'Are you sure you want to delete the tally unit?'
        }
      })
      .afterClosed()
      .subscribe(confirmed => {
        if (confirmed) {
          const load = tallyItem.products.map(p =>
            this.transactionService.deleteTransactionTallyUnit(this.transactionData.id, p.id)
          );
          combineLatest(load)
            .pipe(first())
            .subscribe(() => {
              this.tallyChanged.emit();
              const txRemainingUnits = this.transactionData.tallyUnits.filter(
                u => !tallyItem.products.some(p => p.id === u.id)
              );
              if (!txRemainingUnits?.length) this.noTallyUnitsLeft.emit();
            });
        }
      });
  }

  removeDeletedProductsFromTally(products: any[]): void {
    this.dialog
      .open(DialogModalComponent, {
        width: '450px',
        disableClose: true,
        data: {
          type: DialogType.Confirm,
          content: 'Are you sure you want to delete the tally unit?'
        }
      })
      .afterClosed()
      .subscribe(confirmed => {
        if (confirmed) {
          const load = products.map(p =>
            this.transactionService.deleteTransactionTallyUnit(this.transactionData.id, p.id)
          );
          combineLatest(load)
            .pipe(first())
            .subscribe(() => this.tallyChanged.emit());
        }
      });
  }

  openProductLot(tallyItem: TallyLineModel) {
    this.dialog
      .open(EditProductLotModalComponent, {
        width: '95%',
        maxWidth: '95vw !important',
        disableClose: true,
        data: tallyItem.lot
      })
      .afterClosed()
      .subscribe(isChanged => {
        if (isChanged) this.tallyChanged.emit();
      });
  }

  canReadLineItemProducts(tallyUnit: TallyLineModel) {
    const currentUser = Environment.getCurrentUser();
    const accessControl = currentUser.normalizedAccessControlRoles.PRODUCT.searchSection.sectionGroup;

    return (
      accessControl.read.value === AccessControlScope.Company ||
      tallyUnit.permission !== ProductLotPermissionEnum.PRIVATE ||
      (accessControl.read.value === AccessControlScope.Owner && currentUser.id === tallyUnit.ownerId)
    );
  }

  canUpdateTallyQty(line: TallyLineModel) {
    return this.canUpdateTally && this.canReadLineItemProducts(line) && this.transactionData.isSales;
  }

  canSearchAndReplace(tallyUnit: TallyLineModel): boolean {
    return (
      this.isSeller &&
      tallyUnit.needsReplacement &&
      tallyUnit.canBeReplaced &&
      this.canDeleteTally &&
      this.canReadLineItemProducts(tallyUnit) &&
      this.canUpdateTally
    );
  }

  searchAndReplace(line: TallyLineModel): void {
    this.inventorySearchHelperService
      .loadLotsByIds([line.lot])
      .pipe()
      .subscribe(lots => {
        const lot = lots[0];
        const availableProducts = lot.products.filter(
          p => !p.allocatedTransactionId && !line.unitProducts.some(u => u.id === p.id)
        );
        const selectionCriteria = Environment.getCurrentCompany().salesPractices.selectionCriteria;
        const sortedAvailableProducts = BuychainLibHelper.sortBasedOnSelectionCriteria();
        const productsToDeleteFromTally = line.products.filter(p => p.product.allocatedTransactionId);
        const productsToAddToTally = sortedAvailableProducts.slice(0, productsToDeleteFromTally.length);

        const deleteLoad = productsToDeleteFromTally.map(p =>
          this.transactionService.deleteTransactionTallyUnit(this.transactionData.id, p.id)
        );
        const addLoad = productsToAddToTally.map(p =>
          this.transactionService.addTransactionTallyUnit(this.transactionData.id, { product: p.id, offer: line.offer })
        );
        combineLatest([...deleteLoad, ...addLoad])
          .pipe(first())
          .subscribe(() => this.tallyChanged.emit());
      });
  }

  onChangePurchaseMethod(event: MatSelectChange, line: TallyLineModel) {
    this.setPurchaseMethodForTally(event.value, line);
  }

  onChangeAllPurchaseMethods(type: ProductPurchaseMethod) {
    this.tallyItems.forEach(item => {
      this.setPurchaseMethodForTally(type, item);
    });
  }

  onEditContract() {
    this.isContractEditMode = true;
  }

  onSaveContract(line: TallyLineModel) {
    const groupValue = line.contractGroup.value;
    const changedData = FormGroupHelper.getChangedValues(groupValue, line.contract);

    Object.keys(groupValue).forEach(key => {
      if (changedData[key] === null && !(key in line.contract)) {
        delete changedData[key];
      }
    });

    if (ObjectUtil.isEmptyObject(changedData) || !line.contractGroup.valid) {
      this.isContractEditMode = false;
      return;
    }

    if (!changedData.number) {
      changedData.number = line.lot;
    }

    const requests = line.products.map(item =>
      this.contractsApiService.updateTransactionContract(this.transactionData.id, item.id, changedData)
    );
    let initialReq = of([]);

    if (line.contract && !line.products.every(item => item.contract)) {
      const contractRequests = line.products
        .filter(item => !item.contract)
        .map(item => this.addExistingContractToTallyUnit(line.contract, item.id));
      initialReq = forkJoin(contractRequests);
    }

    initialReq
      .pipe(
        mergeMap(() => forkJoin(requests)),
        finalize(() => this.tallyChanged.emit()),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.isContractEditMode = false;
      });
  }

  onCancelEditContract(line: TallyLineModel) {
    this.populateContractData(line);
    this.isContractEditMode = false;
  }

  private setPurchaseMethodForTally(method: ProductPurchaseMethod, line: TallyLineModel) {
    if (method === line.purchaseMethod) {
      return;
    }

    const requests = line.products
      .map(item => {
        if (method === ProductPurchaseMethod.CONTRACT) {
          const payload = { number: line.lot, contractPrice: line.offer };
          return this.contractsApiService.addTransactionContract(this.transactionData.id, item.id, payload);
        }

        if (method === ProductPurchaseMethod.CASH) {
          return this.contractsApiService.deleteTransactionContract(this.transactionData.id, item.id);
        }

        return null;
      })
      .filter(val => !!val);

    forkJoin(requests)
      .pipe(
        finalize(() => this.tallyChanged.emit()),
        takeUntil(this.destroy$)
      )
      .subscribe();
  }

  public updateAllChangedTallyItems() {
    forkJoin(this.tallyItems.filter(x => x.formGroup.dirty).map(x => this.updateTallyItem(x)))
      .pipe()
      .subscribe(() => this.tallyChanged.emit());
  }

  private updateTallyItem(tallyItem: TallyLineModel): Observable<any> {
    if (tallyItem.formGroup.invalid) return of();
    const load: any = [];
    let productsToRemove = [];
    const selectionCriteria = Environment.getCurrentCompany().salesPractices.selectionCriteria;
    if (tallyItem.qtyFormControl.value < tallyItem.qty) {
      const reverseSortedProducts = BuychainLibHelper.sortBasedOnSelectionCriteria().reverse();
      productsToRemove = reverseSortedProducts.slice(0, tallyItem.qty - tallyItem.qtyFormControl.value);
      const unitsToRemove = tallyItem.products.filter(p => productsToRemove.some(r => r.id === p.product.id));
      unitsToRemove.forEach(p =>
        load.push(this.transactionService.deleteTransactionTallyUnit(this.transactionData.id, p.id))
      );
    }

    if (tallyItem.qtyFormControl.value > tallyItem.qty) {
      const lot = this.tallyLotsComplete.find(l => l.lotId === tallyItem.lot);
      const additionalAvailableProducts = lot.availableProducts.filter(
        p => !tallyItem.unitProducts.some(item => item.id === p.id)
      );
      const sortedProducts = BuychainLibHelper.sortBasedOnSelectionCriteria();
      const productsToAdd = sortedProducts.slice(0, tallyItem.qtyFormControl.value - tallyItem.qty);

      productsToAdd.forEach(p => {
        const payload = { product: p.id, offer: tallyItem.offerFormControl.value };
        const request = this.transactionService.addTransactionTallyUnit(this.transactionData.id, payload).pipe(
          mergeMap(resp => {
            if (!tallyItem.contract) {
              return of(null);
            }

            return this.addExistingContractToTallyUnit(tallyItem.contract, resp.id);
          })
        );
        load.push(request);
      });
    }

    if (tallyItem.offer !== tallyItem.offerFormControl.value) {
      const filteredProducts =
        tallyItem.qtyFormControl.value < tallyItem.qty
          ? tallyItem.products.filter(product => !productsToRemove.some(p => p.id === product.id))
          : tallyItem.products;

      filteredProducts.forEach(p =>
        load.push(
          this.transactionService.makeOfferForTransactionTallyUnit(this.transactionData.id, p.id, {
            offer: tallyItem.offerFormControl.value
          })
        )
      );
    }

    return combineLatest(load).pipe(
      tap(() => {
        tallyItem.formGroup.controls.qty.setValue(tallyItem.qty);
        tallyItem.formGroup.markAsPristine();
      })
    );
  }

  private addExistingContractToTallyUnit(contract: ContractEntity, unitId: string) {
    const { contractPrice, number, expirationDate, terms } = contract;
    const contractPayload = ObjectUtil.deleteEmptyProperties({ contractPrice, number, expirationDate, terms });
    return this.contractsApiService.addTransactionContract(this.transactionData.id, unitId, contractPayload);
  }

  private setTallyItems() {
    const expanded = this.tallyItems.find(x => x.isExpanded);
    const tallyUnits = this.transactionData.isPurchasedTally
      ? this.transactionData.tally.tallyLots
      : this.transactionData.tallyUnitsByLot;

    let unitsOldDelivered: { id: string; deliveredPrice: number }[];
    if (this.canUpdateTally && this.isOfferOnDeliveredPrice && this.tallyItems?.length) {
      unitsOldDelivered = this.tallyItems.map(item => ({
        id: item.lot,
        deliveredPrice: item.deliveredOfferFormControl?.value
      }));
    }
    this.tallyItems = tallyUnits.map(item => Object.assign(new TallyLineModel(), item));

    this.tallyItems.forEach(item => {
      if (item.isOffBook) this.isOffbookPurchase = true;

      item.isExpanded = !!(expanded && expanded.lot === item.lot);

      item.hasInvalidShipFrom =
        !this.transactionData.passedTheState(TransactionStateEnum.Quote) &&
        item.shipFromId !== this.transactionData.shipFrom.id;
      if (item.hasInvalidShipFrom) item.isLineInvalid = true;

      item.qtyFormControl = new FormControl(item.qty);
      item.offerFormControl = new FormControl(item.offer, [
        Validators.required,
        Validators.min(0),
        Validators.max(this.maxSafeNumber)
      ]);

      item.formGroup = new FormGroup({ qty: item.qtyFormControl, offer: item.offerFormControl });

      this.initContractGroup(item);

      if (!this.transactionData.passedTheState(TransactionStateEnum.Quote) && this.isOfferOnDeliveredPrice) {
        this.handleDeliveredPrice(item, unitsOldDelivered);
      }
    });

    if (this.tallyItems.some(item => item.deliveredOfferFormControl?.dirty)) this.updateAllChangedTallyItems();
  }

  private handleDeliveredPrice(item, unitsOldDelivered) {
    const deliveredCost = BuychainLibHelper.getDeliveredPricePerUom();
    item.deliveredOfferFormControl = new FormControl(deliveredCost, [
      Validators.required,
      Validators.min(0),
      Validators.max(this.maxSafeNumber)
    ]);
    item.deliveredOfferFormControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.onDeliveredValueChanged(item));
    if (unitsOldDelivered) {
      const found = unitsOldDelivered.find(unit => unit.id === item.lot);
      if (found?.deliveredPrice && found.deliveredPrice !== item.deliveredOfferFormControl.value) {
        item.deliveredOfferFormControl.setValue(found.deliveredPrice);
        item.deliveredOfferFormControl.markAsDirty();
      }
    }
  }

  private initContractGroup(line: TallyLineModel) {
    if (!line.contract) {
      return;
    }

    line.contractGroup = new FormGroup({
      number: new FormControl(null, [Validators.maxLength(100)]),
      contractPrice: new FormControl({ value: null }, [Validators.required, Validators.min(0)]),
      expirationDate: new FormControl(null),
      terms: new FormControl(null, [Validators.maxLength(1000)])
    });
    this.populateContractData(line);

    if (!this.isContractAllowed) {
      line.contractGroup.disable();
    }
  }

  private populateContractData(line: TallyLineModel) {
    line.contractGroup.setValue({
      number: line.contract?.number || null,
      contractPrice: line.contract?.contractPrice || null,
      expirationDate: line.contract?.expirationDate || null,
      terms: line.contract?.terms || null
    });
  }

  // ToDo: refactor
  private setUserPermissions(): void {
    const currentUser = Environment.getCurrentUser();
    const transactionPermissions = currentUser.normalizedAccessControlRoles.TRANSACTION.transactionSection.sectionGroup;

    this.canUpdateTally =
      (transactionPermissions.updateTally.value === AccessControlScope.Company ||
        (transactionPermissions.updateTally.value === AccessControlScope.Owner &&
          this.transactionData.isResourceOwner)) &&
      !this.transactionData.passedTheState(TransactionStateEnum.Quote);

    this.canDeleteTally =
      (transactionPermissions.deleteTally.value === AccessControlScope.Company ||
        (transactionPermissions.deleteTally.value === AccessControlScope.Owner &&
          this.transactionData.isResourceOwner)) &&
      !this.transactionData.passedTheState(TransactionStateEnum.Quote);
  }

  private initMaxAvailability(lots) {
    this.tallyLotsComplete = lots;
    lots.map(lot => {
      const maxQtyValidator = this.isOffbookPurchase ? [] : [Validators.max(lot.availableProductsCount)];
      const index = this.tallyItems.findIndex(item => item.lot === lot.lotId);
      if (index !== -1) {
        this.tallyItems[index].qtyFormControl.setValidators([
          Validators.required,
          Validators.min(1),
          ...maxQtyValidator,
          IntegerValidator()
        ]);
        if (this.transactionData.passedTheState(TransactionStateEnum.Review)) {
          return;
        }
        if (
          this.tallyItems[index].unitProducts.some(
            unit =>
              (unit.allocatedTransactionId && unit.allocatedTransactionId !== this.transactionData.id) ||
              unit.state === ProductStateEnum.SOLD
          )
        ) {
          this.tallyItems[index].needsReplacement = true;
          if (this.isSellingTally) this.tallyItems[index].isLineInvalid = true;
          this.tallyItems[index].canBeReplaced = lot.availableProductsCount >= this.tallyItems[index].qty;
        }
      }
    });
  }
}
