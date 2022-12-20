import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Environment } from '@services/app-layer/app-layer.environment';
import { AccessControlScope } from '@services/app-layer/permission/permission.interface';
import { SearchService } from '@services/app-layer/search/search.service';
import { GridHelperService } from '@services/helpers/grid-helper/grid-helper.service';
import { NotificationHelperService } from '@services/helpers/notification-helper/notification-helper.service';
import { TransformHelper } from '@services/helpers/utils/transform-helper';
import { ReportingService } from '@views/main/reporting/reporting.service';
import { subMonths } from 'date-fns';
import { DxDataGridComponent } from 'devextreme-angular';
import { ObjectUtil } from '@services/helpers/utils/object-util';
import { BookmarkService } from '@services/app-layer/bookmark/bookmark.service';
import { FilterBuilderHelper } from '@services/helpers/utils/filter-builder-helper';
import { ProductLotPermissionEnum, ProductStateEnum } from '@services/app-layer/app-layer.enums';
import { InventoryAuditService } from '@services/app-layer/inventory-audit/inventory-audit.service';
import { InventoryAuditGridEntity } from '@services/app-layer/entities/inventory-audit-grid';
import { MatMenuTrigger } from '@angular/material/menu';
import { MatDialog } from '@angular/material/dialog';
import { EditProductLotModalComponent } from '@views/main/common/modals/edit-product-lot-modal/edit-product-lot-modal.component';
import { MemberEntity } from '@services/app-layer/entities/member';
import { FacilityEntity } from '@services/app-layer/entities/facility';
import { TypeCheck } from '@services/helpers/utils/type-check';
import { InventorySearchHelperService } from '@views/main/common/inventory/inventory-search/inventory-search.helper.service';
import { ProductsHelper } from '@services/app-layer/products/products-helper';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ProductEntity } from '@services/app-layer/entities/inventory-search';

const date = subMonths(new Date(), 1);
const dateTypeFields = ['shipWeekEstimate', 'purchaseDate', 'landedDate', 'custodyDate', 'soldDate'];

class ViewState {
  public advancedFilter = ['purchaseDate', '>=', date];
  public grid = null;
  public easyAccess = false;
}

@Component({
  selector: 'app-inventory-audit',
  templateUrl: './inventory-audit.component.html',
  styleUrls: ['../common/reports.common.scss', './inventory-audit.component.scss']
})
export class InventoryAuditComponent implements OnInit, OnDestroy {
  @ViewChild('auditProductsGrid', { static: false }) auditProductsGrid: DxDataGridComponent;
  @ViewChild(MatMenuTrigger) inventoryMenu: MatMenuTrigger;

  companyMembers: MemberEntity[] = [];
  companyFacilities: FacilityEntity[] = [];
  contextMenuPosition = { x: '0px', y: '0px' };

  public viewKey = 'inventoryAudit';
  public viewState: ViewState;
  public defaultState = new ViewState();

  public productLotStates = ObjectUtil.enumToKeyValueArray(ProductStateEnum).map(({ key, value }) => ({
    displayValue: TransformHelper.stringUnderscoreToSpaceTitleCase(value),
    value: key
  }));
  public productLotPermissions = ObjectUtil.enumToKeyValueArray(ProductLotPermissionEnum).map(({ key, value }) => ({
    displayValue: TransformHelper.stringUnderscoreToSpaceTitleCase(value),
    value: key
  }));

  public productsCompleteList: any[];
  public normalizedInventoryChartData: InventoryAuditGridEntity[] = [];
  private selectedProduct: InventoryAuditGridEntity;

  public filterFields: any;

  focusedRowKey;

  private destroy$ = new Subject<void>();

  constructor(
    private bookmarkService: BookmarkService,
    public inventoryAuditService: InventoryAuditService,
    private inventorySearchHelperService: InventorySearchHelperService,
    private searchService: SearchService,
    private dialog: MatDialog,
    private gridHelperService: GridHelperService,
    private notificationHelperService: NotificationHelperService,
    private reportingService: ReportingService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.companyMembers = this.reportingService.companyMembers;
    this.companyFacilities = this.reportingService.companyFacilities;
    this.saveGridState = this.saveGridState.bind(this);
    this.loadGridState = this.loadGridState.bind(this);
    this.filterFields = this.inventoryAuditService.filterFields;
    this.setFilterFields(); // fills selectionOptions of filter fields
    this.initViewState();

    if (this.route.snapshot.queryParamMap.get('load') === 'true') {
      this.generateInventoryAuditReport();
      this.router.navigate([], { queryParams: null });
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onClosedMenu() {
    this.auditProductsGrid?.instance.focus();
  }

  generateInventoryAuditReport() {
    this.normalizedInventoryChartData = [];
    this.loadProductLotsByFilter().then(() => {
      this.generateNormalizedData();
    });
  }

  onExporting(e) {
    this.gridHelperService.exportToExcel(e, 'InventoryAudit');
  }

  specSortingValue(data): any {
    return JSON.stringify(data.spec);
  }

  getSpecGroupValue(data): string {
    const spec = JSON.parse(data);
    return spec.specShorthand;
  }

  public specSorting = (value1, value2) => {
    const spec1 = JSON.parse(value1);
    const spec2 = JSON.parse(value2);
    return ProductsHelper.specSorting(spec1, spec2);
  };

  public onProductRowClick(event): void {
    if (event.data.key) return;

    if (!this.canReadProductLot(event.data)) {
      this.notificationHelperService.showValidation('You do not have enough permissions to access this Product Lot');
      return;
    }

    this.setMenuCoordinates(event);
    this.selectedProduct = event.data;
    this.openMenu();
  }
  private openMenu(): void {
    this.inventoryMenu.openMenu();
  }
  private setMenuCoordinates(event): void {
    if (event) {
      this.contextMenuPosition.x = `${event.event.clientX}px`;
      this.contextMenuPosition.y = `${event.event.clientY}px`;
    }
  }
  public openProductLotDetails(): void {
    this.inventorySearchHelperService
      .loadLotsByIds([this.selectedProduct.productLot])
      .pipe(takeUntil(this.destroy$))
      .subscribe(lots => {
        const lot = lots[0];
        this.dialog
          .open(EditProductLotModalComponent, {
            width: '99%',
            maxWidth: '1480px',
            disableClose: true,
            data: lot.lotId
          })
          .afterClosed()
          .subscribe(isChanged => {
            if (isChanged) this.generateInventoryAuditReport();
          });
      });
  }
  openLotInNewTab(): void {
    if (!this.selectedProduct?.productLot) return;
    window.open(`${location.origin}/inventory/inventory-overview/${this.selectedProduct.productLot}`);
  }
  openLotInNewWindow(): void {
    if (!this.selectedProduct?.productLot) return;
    const strWindowFeatures = 'location=yes';
    window.open(
      `${location.origin}/inventory/inventory-overview/${this.selectedProduct.productLot}`,
      '_blank',
      strWindowFeatures
    );
  }

  canReadProductLot(selectedProduct: InventoryAuditGridEntity) {
    const currentUser = Environment.getCurrentUser();
    const accessControl = currentUser.normalizedAccessControlRoles.PRODUCT.searchSection.sectionGroup;

    return (
      accessControl.read.value === AccessControlScope.Company ||
      selectedProduct.permission !== ProductLotPermissionEnum.PRIVATE ||
      (accessControl.read.value === AccessControlScope.Owner && currentUser.id === selectedProduct.ownerId)
    );
  }

  private async loadProductLotsByFilter() {
    const payload = this.inventoryAuditService.normalizeProductLotSearchPayload(
      this.viewState.advancedFilter,
      dateTypeFields
    );
    const products = await this.searchService.fetchInventoryProducts(payload).toPromise();
    this.productsCompleteList = products.map(p => new ProductEntity().init(p));
  }

  private generateNormalizedData(): void {
    this.normalizedInventoryChartData = this.inventoryAuditService.generateNormalizedData(this.productsCompleteList);
  }

  public onToolbarPreparing(e) {
    this.gridHelperService.prepareToolbarCollapseExpand(e, () => this.auditProductsGrid);
  }

  public onViewStateChanged(viewState: ViewState) {
    const state = viewState;
    FilterBuilderHelper.fixAdvancedFilterDateTypes(state.advancedFilter, dateTypeFields);
    FilterBuilderHelper.bookmarkFilterBuilderMigration(state.advancedFilter);
    this.viewState = ObjectUtil.deleteEmptyProperties(state);
    this.generateInventoryAuditReport();
    this.setGridState();
  }
  public setGridState() {
    if (this.auditProductsGrid) this.auditProductsGrid.instance.state(this.viewState.grid);
  }
  public loadGridState() {
    return this.viewState.grid;
  }
  public saveGridState(gridState) {
    const gridStoringState = ObjectUtil.getDeepCopy(gridState);
    gridStoringState.selectedRowKeys = [];
    this.viewState = { ...this.viewState, grid: gridStoringState };
  }

  private setFilterFields(): void {
    this.filterFields.forEach(field => {
      switch (field.dataField) {
        case 'state':
          field.lookup.dataSource = this.productLotStates;
          break;
        case 'permission':
          field.lookup.dataSource = this.productLotPermissions;
          break;
        case 'owner':
          field.lookup.dataSource = this.companyMembers;
          break;
        case 'shipFrom':
          field.lookup.dataSource = this.companyFacilities;
          break;
      }
    });
  }

  public initViewState() {
    const state =
      this.bookmarkService.getLastSessionState(this.viewKey, new ViewState()) ||
      ObjectUtil.getDeepCopy(this.defaultState);
    FilterBuilderHelper.bookmarkFilterBuilderMigration(state.advancedFilter);
    this.tempBookmarkMigration(state.advancedFilter);
    this.viewState = ObjectUtil.deleteEmptyProperties(state);
    FilterBuilderHelper.fixAdvancedFilterDateTypes(this.viewState.advancedFilter, dateTypeFields);
  }

  private tempBookmarkMigration(advancedFilter: any[]): void {
    if (!advancedFilter) return;
    advancedFilter.forEach((item, index) => {
      if (item && TypeCheck.isArray(item)) {
        if (TypeCheck.isArray(item[0])) item.filter((x, i) => i % 2 === 0).map(x => this.tempBookmarkMigration(x));
        else if (item[0] === 'mfg') item[0] = 'mfgFacilityShortName';
      } else if (item === 'mfg') {
        advancedFilter[index] = 'mfgFacilityShortName';
      }
    });
  }
}
