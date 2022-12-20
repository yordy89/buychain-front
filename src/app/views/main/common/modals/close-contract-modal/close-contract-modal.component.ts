import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Inject,
  NgZone,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import { AbstractControl, FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Environment } from '@services/app-layer/app-layer.environment';
import { ContractProductEntity } from '@services/app-layer/entities/contract';
import { CrmAccountEntity } from '@services/app-layer/entities/crm';
import { ProductEntity } from '@services/app-layer/entities/inventory-search';
import { ProductsHelper } from '@services/app-layer/products/products-helper';
import { ProductsService } from '@services/app-layer/products/products.service';
import { GridHelperService } from '@services/helpers/grid-helper/grid-helper.service';
import { NavigationHelperService } from '@services/helpers/navigation-helper/navigation-helper.service';
import { ListUtilHelper } from '@services/helpers/utils/list-util.helper';
import { DxDataGridComponent } from 'devextreme-angular';
import cBox from 'devextreme/ui/check_box';
import { forkJoin, Subject } from 'rxjs';
import { debounceTime, first, takeUntil } from 'rxjs/operators';

@Component({
  templateUrl: './close-contract-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CloseContractModalComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('grid') grid: DxDataGridComponent;

  items: any[];
  selectedLotIds = [];
  selectedState = {};
  priceFormGroup: FormGroup;
  filteredProducts: ProductEntity[] = [];
  contractPriceState: {
    [key: string]: {
      avgProductsContractPrice: number;
      totalProductsContractPrice: number;
      products: { [key: string]: number };
    };
  };

  mfgFacilityUnique = false;

  private destroy$ = new Subject<void>();

  constructor(
    private dialogRef: MatDialogRef<CloseContractModalComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      products: ProductEntity[];
      crmAccounts: CrmAccountEntity[];
    },
    private productsService: ProductsService,
    private zone: NgZone,
    private gridHelperService: GridHelperService,
    private navigationService: NavigationHelperService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.filteredProducts = this.data.products.filter(
      item => item.contract?.isOpen && ProductsHelper.canCloseContractForProduct(item)
    );
    this.items = this.getNormalizedData();
    this.initSelectedState();
    this.initPriceFormGroup();
    this.handleFormGroupValueChange();
    this.computePricesState();
    this.checkCompatibility();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngAfterViewInit() {
    this.grid.onContentReady.pipe(first()).subscribe(() => {
      this.grid.onRowPrepared.pipe(debounceTime(50), first()).subscribe(() => {
        this.grid.instance.repaint();
      });

      this.gridHelperService.expandAllMasterRows(this.grid);
    });
  }

  getLinkToTransaction(txId: string): string {
    return this.navigationService.getLinkToTransaction(txId);
  }

  goToTransaction(txId: string) {
    this.navigationService.navigateToTransactionById(txId);
    this.dialogRef.close();
  }

  onLotSelectionChange(data) {
    const { selectedRowKeys, currentDeselectedRowKeys } = data;

    selectedRowKeys.forEach(key => {
      const elem = this.selectedState[key];
      if (!elem.selectedProducts.length) {
        elem.selectAll();
      }
    });

    currentDeselectedRowKeys.forEach(key => (this.selectedState[key].selectedProducts = []));
  }

  onProductSelectionChange() {
    const set = new Set();
    Object.keys(this.selectedState).forEach(key => {
      if (this.selectedState[key].selectedProducts?.length) {
        set.add(key);
      } else {
        set.delete(key);
      }
    });
    this.selectedLotIds = Array.from(set);
    this.handleParentCheckboxState();
  }

  onRowCollapsed() {
    this.handleParentCheckboxState();
  }

  onRowExpanded() {
    this.handleParentCheckboxState();
  }

  onDeleteLot(data: ContractProductEntity) {
    this.items = this.items.filter(item => item.lotId !== data.lotId);
    this.checkCompatibility();
  }

  onDeleteProduct(data: ProductEntity) {
    this.items = this.items
      .map(item => {
        if (item.lotId === data.lot) item.products = item.products.filter(p => p.id !== data.id);
        return item;
      })
      .filter(lot => lot.products.length);
    this.grid.instance.repaint();
    this.checkCompatibility();
  }

  onResetContractPrice(control: AbstractControl, value) {
    control.setValue(value || 0);
  }

  calculateContractPriceValue = (rowData: ProductEntity) => this.contractPriceState[rowData.lot].products[rowData.id];
  calculatePurchasePriceTotalValue = (rowData: ContractProductEntity) =>
    this.contractPriceState[rowData.lotId].totalProductsContractPrice;
  calculatePurchasePriceUoMValue = (rowData: ContractProductEntity) =>
    this.contractPriceState[rowData.lotId].avgProductsContractPrice;

  private handleParentCheckboxState() {
    this.zone.onStable.pipe(first()).subscribe(() => {
      const items = this.grid.instance.getVisibleRows().filter(item => item.rowType === 'data' && item.isSelected);

      items.forEach(({ key, rowIndex }) => {
        const item = this.selectedState[key];
        const cell = this.grid.instance.getCellElement(rowIndex, 1);

        if (!cell) {
          return;
        }

        const instance = cBox.getInstance(cell.querySelector('.dx-select-checkbox'));

        if (item.selectedProducts?.length) {
          instance.option('value', item.selected ? true : undefined);
        }
      });
    });
  }

  private initPriceFormGroup() {
    const config = this.filteredProducts.reduce((acc, curr) => {
      acc[curr.id] = new FormControl(curr.contract?.contractPrice || 0, [Validators.required, Validators.min(0)]);
      return acc;
    }, {});

    this.priceFormGroup = new FormGroup(config);
  }

  private handleFormGroupValueChange() {
    this.priceFormGroup.valueChanges.pipe(debounceTime(200), takeUntil(this.destroy$)).subscribe(() => {
      this.computePricesState();
      this.cd.markForCheck();
    });
  }

  private computePricesState() {
    this.contractPriceState = this.items.reduce((acc, curr) => {
      let totalProductsContractPrice = 0;
      let avgProductsContractPrice = 0;

      const products = curr.products.reduce((accProducts, currProduct) => {
        const contractPricePerUom = this.priceFormGroup.get(currProduct.id).value || 0;
        const contractPrice = contractPricePerUom * curr.qtyPerProduct;

        avgProductsContractPrice += contractPricePerUom / curr.products.length;
        totalProductsContractPrice += contractPrice;
        accProducts[currProduct.id] = contractPrice;

        return accProducts;
      }, {});

      acc[curr.lotId] = {
        products,
        avgProductsContractPrice,
        totalProductsContractPrice
      };
      return acc;
    }, {});
  }

  private initSelectedState() {
    this.selectedState = this.items.reduce((acc, curr) => {
      acc[curr.lotId] = {
        get selected() {
          return this.selectedProducts.length === this.allProductsCount;
        },
        selectAll() {
          this.selectedProducts = this.productsIds;
        },
        getSelectedEntities() {
          return this.products.filter(item => this.selectedProducts.includes(item.id));
        },
        selectedProducts: [],
        allProductsCount: curr.products.length,
        products: curr.products,
        productsIds: curr.products.map(item => item.id)
      };
      return acc;
    }, {});
  }

  private getNormalizedData() {
    return this.filteredProducts
      .reduce((acc, cur: ProductEntity) => {
        const existingIndex = acc.findIndex(p => p.lot === cur.lot);

        if (existingIndex === -1) {
          acc.push({
            lot: cur.lot,
            spec: cur.spec,
            specShorthand: cur.specShorthand,
            products: [cur]
          });
        } else {
          acc[existingIndex].products.push(cur);
        }
        return acc;
      }, [])
      .map(item => new ContractProductEntity().init(item));
  }

  calculateDisplaySupplierValue = (rowData: ProductEntity) => this.calculateCrmAccountValue(rowData.contract?.supplier);
  calculateDisplayBrokerValue = (rowData: ProductEntity) => this.calculateCrmAccountValue(rowData.contract?.broker);

  close(refresh?): void {
    this.dialogRef.close(refresh);
  }

  onConvertToCash() {
    const productsIds = this.getSelectedProductsIds();
    const requests = productsIds.map(id => {
      const value = this.priceFormGroup.controls[id].value || 0;
      return this.productsService.updateProductContract(id, value);
    });

    forkJoin(...requests).subscribe(() => {
      this.close(true);
    });
  }

  private getSelectedProductsIds() {
    return Object.keys(this.selectedState)
      .map(key => this.selectedState[key])
      .reduce((acc, curr) => {
        if (curr.selectedProducts.length) {
          acc = acc.concat(curr.getSelectedEntities());
        }
        return acc;
      }, [])
      .map(el => el.id);
  }

  private checkCompatibility(): void {
    if (!this.items?.length) return;
    const sample = this.items[0].products[0];
    const products = this.items.reduce((acc, cur) => [...acc, ...cur.products], []);
    this.mfgFacilityUnique = products.every(lot => lot.mfgFacilityShortName === sample.mfgFacilityShortName);
  }

  private calculateCrmAccountValue = (value: string) => {
    const notAvailableText = 'not available';

    if (value) {
      if (!this.data.crmAccounts?.length) {
        return notAvailableText;
      }

      return ListUtilHelper.getDisplayValueFromList(value, this.data.crmAccounts, 'id', 'name', notAvailableText);
    }

    return Environment.getCurrentCompany().name;
  };
}
