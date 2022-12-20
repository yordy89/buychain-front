import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { FABAction, TableAction } from '@app/models';
import { SpecSelectionNode } from '@services/app-layer/spec/spec.service';
import { UserService } from '@services/app-layer/user/user.service';
import { ProductLotSpec } from '@services/data-layer/http-api/base-api/swagger-gen/model/productLotSpec';
import { GridHelperService } from '@services/helpers/grid-helper/grid-helper.service';
import { ObjectUtil } from '@services/helpers/utils/object-util';
import { TypeCheck } from '@services/helpers/utils/type-check';
import { DxDataGridComponent } from 'devextreme-angular';
import PriceSystemEnum = ProductLotSpec.PriceSystemEnum;
import { ProductsHelper } from '@services/app-layer/products/products-helper';

enum Actions {
  DELETE,
  ADD,
  OPEN
}

enum FABActions {
  CLEAR_ALL,
  ADD_TO_TALLY
}

@Component({
  selector: 'app-favorite-products',
  templateUrl: 'favorite-products.component.html'
})
export class FavoriteProductsComponent implements OnInit {
  @Input() favoriteProductsList: any[];
  @Input() priceSystemOverTally = '';
  @Input() specsTree: SpecSelectionNode[];
  @Input() selectedProductGroup: SpecSelectionNode = null;
  @Output() switchTab = new EventEmitter<void>();
  @Output() createProduct = new EventEmitter<{ specs: any; shorthand: string }>();
  @Output() reloadPreferences = new EventEmitter<void>();
  @Output() productGroup = new EventEmitter<SpecSelectionNode>();

  @ViewChild('productGrid') productGrid: DxDataGridComponent;

  fabActions: FABAction[] = [];

  readonly tableActions: TableAction[] = [
    {
      label: 'Add To Tally',
      icon: 'add',
      color: 'primary',
      value: Actions.ADD
    },
    {
      label: 'Open Product Spec',
      icon: 'visibility',
      color: 'primary',
      value: Actions.OPEN
    },
    {
      label: 'Remove From My Products',
      icon: 'delete',
      color: 'warn',
      value: Actions.DELETE,
      prompt: {
        title: 'Confirm please!',
        text: 'Are you sure you want to delete the Product?'
      }
    }
  ];

  constructor(private gridHelperService: GridHelperService, private userService: UserService) {}

  ngOnInit() {
    this.initFABTableActions();
  }

  calculateCellValueBasedOnFieldName(data) {
    const columnDisplayName = this['name'];
    return data[columnDisplayName] ? data[columnDisplayName] : '';
  }
  sortDimensionValues = (value1, value2) => ProductsHelper.sortDimensionValues(value1, value2);
  cutGradeSorting = (value1, value2) => ProductsHelper.cutGradeSorting(value1, value2);

  onCellPrepared(e: any) {
    const cb = (data: any) => this.priceSystemOverTally && data.priceSystem !== this.priceSystemOverTally;
    this.gridHelperService.disableCheckboxes(e, cb);
  }

  selectionChangedHandler(e): void {
    const priceSystem = e.selectedRowKeys.length ? e.selectedRowKeys[0].priceSystem : this.priceSystemOverTally || null;
    this.productGrid.instance
      .getVisibleRows()
      .forEach(row => row['cells'].forEach(c => this.disableProductsWithDifferentPriceSystems(c, priceSystem)));
  }

  onToolbarPreparing(e) {
    e.toolbarOptions.items.unshift({
      location: 'after',
      widget: 'dxButton',
      options: {
        icon: 'add',
        hint: 'Add New Product',
        onClick: () => this.switchTabToSpecsSelection()
      }
    });

    this.gridHelperService.prepareToolbarCollapseExpand(e, () => this.productGrid);
    this.gridHelperService.prepareToolbarPrefixTemplate(e);
  }

  private switchTabToSpecsSelection() {
    this.switchTab.emit();
  }

  isRowSelected(): boolean {
    return !!this.productGrid?.selectedRowKeys?.length;
  }

  onTableAction(value: Actions, item) {
    switch (value) {
      case Actions.DELETE:
        this.removeFavoriteProduct(item.key);
        break;
      case Actions.ADD:
        this.emitCreateProduct(item.value, item.specShorthand);
        break;
      case Actions.OPEN:
        this.openProductSpec(item.value);
        break;
    }
  }

  repaintGrid() {
    // TODO find a better way to align checkboxes with rows.
    this.productGrid?.instance.repaint();
  }

  onFABAction(value: FABActions) {
    switch (value) {
      case FABActions.ADD_TO_TALLY:
        this.addSelectedRowsToTally();
        break;

      case FABActions.CLEAR_ALL:
        this.clearMyProductsSelection();
        break;
    }
  }

  private disableProductsWithDifferentPriceSystems(e, priceSystem: PriceSystemEnum) {
    const cb = (data: any) => priceSystem && data.priceSystem !== priceSystem;
    this.gridHelperService.toggleCheckboxModeOnCondition(e, cb);
  }

  // TODO optimize and move to spec helper
  private openProductSpec(spec): void {
    const specsTree = ObjectUtil.getDeepCopy(this.specsTree).map(specs => {
      const { id, displayName, type, innerSpecs, shorthandTemplate, uom } = specs;
      return new SpecSelectionNode(id, displayName, type, innerSpecs, shorthandTemplate, uom);
    });
    const productIndex = specsTree.findIndex(node => node.id === spec.productGroupName);
    const selectedProductGroup = specsTree[productIndex];
    selectedProductGroup.selected = selectedProductGroup.innerSpecs[0];
    const index = selectedProductGroup.selected.innerSpecs.findIndex(node => node.id === spec.productName);
    selectedProductGroup.innerSpecs[0].selected = selectedProductGroup.selected.innerSpecs[index];
    selectedProductGroup.innerSpecs[0].innerSpecs[index].selected =
      selectedProductGroup.innerSpecs[0].innerSpecs[index].innerSpecs[0];
    selectedProductGroup.innerSpecs[0].innerSpecs[index].innerSpecs.forEach(node => this.setNodeSelected(node, spec));

    this.productGroup.emit(selectedProductGroup);
  }

  private setNodeSelected(node: SpecSelectionNode, spec): void {
    if (Object.prototype.hasOwnProperty.call(spec, node.id)) {
      const value = TypeCheck.isObject(spec[node.id]) ? spec[node.id].value : spec[node.id];
      const index = node.innerSpecs.findIndex(unit => unit.id === value);
      node.selected = node.innerSpecs[index];
    }
    if (!node.selected) node.selected = node.innerSpecs[0];
    node.innerSpecs.forEach(nestedNode => {
      if (nestedNode.innerSpecs.length) this.setNodeSelected(nestedNode, spec);
    });
  }

  private initFABTableActions() {
    this.fabActions = [
      {
        label: 'Add to Tally',
        icon: 'add',
        value: FABActions.ADD_TO_TALLY
      },
      {
        label: 'Clear Selection',
        icon: 'clear_all',
        value: FABActions.CLEAR_ALL
      }
    ];
  }

  private removeFavoriteProduct(key): void {
    this.userService.updateUserPreferences(key, null).subscribe(() => this.emitReloadPreferences());
  }

  private addSelectedRowsToTally(): void {
    this.productGrid.selectedRowKeys.forEach(row => this.emitCreateProduct(row.value, row.specShorthand));
  }

  private clearMyProductsSelection(): void {
    this.productGrid.instance.clearSelection();
  }

  private emitReloadPreferences() {
    this.reloadPreferences.emit();
  }

  private emitCreateProduct(specs: any, shorthand: string) {
    this.createProduct.emit({ specs, shorthand });
  }
}
