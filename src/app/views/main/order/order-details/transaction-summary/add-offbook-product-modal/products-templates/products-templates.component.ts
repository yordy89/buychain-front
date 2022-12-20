import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { FABAction, TableAction } from '@app/models';
import { CrmAccountEntity, CrmContactEntity, CrmLocationEntity } from '@services/app-layer/entities/crm';
import { UserService } from '@services/app-layer/user/user.service';
import { ProductLotSpec } from '@services/data-layer/http-api/base-api/swagger-gen/model/productLotSpec';
import { GridHelperService } from '@services/helpers/grid-helper/grid-helper.service';
import { ListUtilHelper } from '@services/helpers/utils/list-util.helper';
import { DxDataGridComponent } from 'devextreme-angular';
import PriceSystemEnum = ProductLotSpec.PriceSystemEnum;

enum Actions {
  ADD,
  DELETE
}

enum FABActions {
  ADD_TO_TALLY,
  CLEAR_ALL,
  DELETE
}

@Component({
  selector: 'app-products-templates',
  templateUrl: 'products-templates.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductsTemplatesComponent implements OnInit {
  @Input() templates = [];
  @Input() crmAccounts: CrmAccountEntity[] = [];
  @Input() crmLocations: CrmLocationEntity[] = [];
  @Input() crmContacts: CrmContactEntity[] = [];
  @Input() priceSystemOverTally = '';
  @Input() crmLocation = '';
  @Output() refreshTemplates = new EventEmitter<void>();
  @Output() create = new EventEmitter<any>();

  @ViewChild('grid') grid: DxDataGridComponent;

  selectedIds = [];
  fabActions: FABAction[] = [];

  readonly actions: TableAction[] = [
    {
      label: 'Add to Tally',
      icon: 'add',
      color: 'primary',
      value: Actions.ADD,
      isHidden: (action, item) => this.isDisabledRow(item)
    },
    {
      label: 'Delete',
      icon: 'delete',
      color: 'warn',
      value: Actions.DELETE,
      prompt: {
        title: 'Confirm please!',
        text: 'Are you sure you want to delete template?'
      }
    }
  ];

  constructor(private gridHelperService: GridHelperService, private userService: UserService) {}

  ngOnInit() {
    this.initFABTableActions();
  }

  isRowSelected(): boolean {
    return !!this.grid?.selectedRowKeys?.length;
  }

  onCellPrepared(e: any) {
    const cb = (data: any) => this.isDisabledRow(data);
    this.gridHelperService.disableCheckboxes(e, cb);
  }

  selectionChangedHandler(e): void {
    const priceSystem = e.selectedRowKeys.length ? e.selectedRowKeys[0].priceSystem : this.priceSystemOverTally || null;
    const shipFromId = e.selectedRowKeys.length ? e.selectedRowKeys[0].offlineData.shipFromId : null;

    this.grid.instance.getVisibleRows().forEach(row => {
      row['cells'].forEach(c => {
        this.disableCells(c, priceSystem, shipFromId);
      });
    });
  }

  calculateSellingCompanyCellValue = data =>
    ListUtilHelper.getDisplayValueFromList(data.offlineData.organizationId, this.crmAccounts, 'id', 'name');

  calculateShipFromLocationCellValue = data =>
    ListUtilHelper.getDisplayValueFromList(data.offlineData.shipFromId, this.crmLocations, 'id', 'shortName');

  calculateSellingUserCellValue = data =>
    ListUtilHelper.getDisplayValueFromList(data.offlineData.sellingContactId, this.crmContacts, 'id', 'displayName');

  private isDisabledRow = data => {
    return (
      (this.priceSystemOverTally && data.priceSystem !== this.priceSystemOverTally) ||
      (this.crmLocation && this.crmLocation !== data.offlineData.shipFromId)
    );
  };

  private disableCells(e, priceSystem: PriceSystemEnum, shipFromId) {
    const cb = (data: any) => {
      return (
        (priceSystem && data.priceSystem !== priceSystem) || (shipFromId && data.offlineData.shipFromId !== shipFromId)
      );
    };
    this.gridHelperService.toggleCheckboxModeOnCondition(e, cb);
  }

  onToolbarPreparing(e) {
    this.gridHelperService.prepareToolbarPrefixTemplate(e);
    this.gridHelperService.prepareToolbarCollapseExpand(e, () => this.grid);
  }

  onTableAction(value: Actions, item) {
    switch (value) {
      case Actions.ADD:
        this.emitCreateProduct(item);
        break;

      case Actions.DELETE:
        this.removeTemplate(item.key);
        break;
    }
  }

  onFABAction(value: FABActions) {
    switch (value) {
      case FABActions.ADD_TO_TALLY:
        this.addSelectedRowsToTally();
        break;

      case FABActions.DELETE:
        this.deleteSelectedTemplates();
        break;

      case FABActions.CLEAR_ALL:
        this.clearMyProductsSelection();
        break;
    }
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
      },
      {
        label: 'Delete',
        icon: 'delete',
        color: 'warn',
        value: FABActions.DELETE,
        prompt: {
          title: 'Confirm please!',
          text: 'Are you sure you want to delete selected templates?'
        }
      }
    ];
  }

  private removeTemplate(key: string) {
    this.userService.updateUserPreferences(key, null).subscribe(() => this.emitRefreshTemplates());
  }

  private emitRefreshTemplates() {
    this.refreshTemplates.emit();
  }

  private emitCreateProduct(template) {
    this.create.emit(template);
  }

  private clearMyProductsSelection(): void {
    this.grid.instance.clearSelection();
  }

  private addSelectedRowsToTally(): void {
    this.grid.selectedRowKeys.forEach(row => this.emitCreateProduct(row));
  }

  private deleteSelectedTemplates(): void {
    this.grid.selectedRowKeys.forEach(row => this.removeTemplate(row.key));
  }
}
