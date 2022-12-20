import { formatDate } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Inject,
  Input,
  LOCALE_ID,
  OnDestroy,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatMenuTrigger } from '@angular/material/menu';
import { InventorySearchEntity } from '@services/app-layer/entities/inventory-search';
import { GridHelperService } from '@services/helpers/grid-helper/grid-helper.service';
import { ListUtilHelper } from '@services/helpers/utils/list-util.helper';
import { TransformHelper } from '@services/helpers/utils/transform-helper';
import { BookmarkComponent } from '@views/main/common/bookmark/bookmark.component';
import { InventoryHelperService } from '@views/main/common/inventory/inventory.helper.service';
import { combineLatest, Subject, Observable, mergeMap, EMPTY } from 'rxjs';
import { DxDataGridComponent } from 'devextreme-angular';
import { debounceTime, first, map, takeUntil } from 'rxjs/operators';
import { ObjectUtil } from '@services/helpers/utils/object-util';
import { SearchService } from '@services/app-layer/search/search.service';
import { ProductsService } from '@services/app-layer/products/products.service';
import { FormControl } from '@angular/forms';
import { BookmarkService } from '@services/app-layer/bookmark/bookmark.service';
import { CrmAccountEntity, CrmLocationEntity } from '@services/app-layer/entities/crm';
import { CrmService } from '@services/app-layer/crm/crm.service';
import { CompaniesService } from '@services/app-layer/companies/companies.service';
import { MemberEntity } from '@services/app-layer/entities/member';
import { Tooltips } from '@services/app-layer/app-layer.tooltips';
import { Environment } from '@services/app-layer/app-layer.environment';
import { InventoryViewEnum, ProductLotPermissionEnum, ProductStateEnum } from '@services/app-layer/app-layer.enums';
import { HistoricalPriceModalComponent } from '@views/main/common/modals/historical-price-modal/historical-price-modal.component';
import { NotificationHelperService } from '@services/helpers/notification-helper/notification-helper.service';
import { ProductsHelper } from '@services/app-layer/products/products-helper';
import {
  InventoryFABActions,
  InventorySearchHelperService,
  InventoryViewState
} from '@views/main/common/inventory/inventory-search/inventory-search.helper.service';
import { FABAction } from '@app/models';
import { NavigationHelperService } from '@services/helpers/navigation-helper/navigation-helper.service';
import { PageType } from '@views/main/common/load-all-units/load-all-units.component';
import { ShoppingCartService } from '@views/main/common/shopping-cart/shopping-cart.service';

@Component({
  selector: 'app-inventory-search',
  templateUrl: './inventory-search.component.html'
})
export class InventorySearchComponent implements OnInit, OnDestroy {
  @ViewChild(BookmarkComponent) bookmarkComp: BookmarkComponent;
  @ViewChild('productGrid') productGrid: DxDataGridComponent;
  @ViewChild(MatMenuTrigger) groupMenuTrigger: MatMenuTrigger;

  @Input() onAction: any;

  @Input() get fixedFilters(): any {
    return this._fixedFilters;
  }
  set fixedFilters(value: any) {
    if (!this._fixedFilters) {
      this._fixedFilters = value;
      this.tryLoadCachedData();
    } else if (value) {
      this._fixedFilters = value;
      this.inventorySearchData = [];
      this.search();
    }
  }
  private _fixedFilters: any;

  readonly InventoryViewEnum = InventoryViewEnum;
  @Input() inventoryView: InventoryViewEnum;
  @Input() isFromModal = false;
  @Output() inventoryViewChanged = new EventEmitter();

  gridFilterValue = [];

  public viewKey = 'inventory';
  public viewState: InventoryViewState;
  public defaultState = new InventoryViewState();

  private destroy$ = new Subject<void>();

  public accountList: CrmAccountEntity[] = [];
  public allAccountList: CrmAccountEntity[] = [];
  public locationList: CrmLocationEntity[] = [];
  public selectedAccountLocations: CrmLocationEntity[] = [];

  public membersList: MemberEntity[] = [];

  public shipToAccountControl = new FormControl();
  public shipToLocationControl = new FormControl();

  public inventoryLotIdsByFilters: string[] = [];
  public inventorySearchData: InventorySearchEntity[] = [];

  focusedRowKey;

  public minShipWeekEstimate: Date;
  readonly permissionsList = ObjectUtil.enumToArray(ProductLotPermissionEnum);

  private isDoubleClick = false;
  private doubleClickTimeout: any;

  public tooltips: any;
  public isMarketDataEnabled = Environment.getCompanyFeatures()?.marketData;

  public groupMenuData = {
    position: {
      x: '',
      y: ''
    },
    groupItems: [],
    groupKey: ''
  };

  public offset = 0;
  public limit = 100;
  public allLoaded = false;
  public isBackgroundLoading = false;
  private latestFilters = null;
  public latestFiltersSoldSelected = false;

  selectedRows = [];
  fabActions: FABAction[] = [];

  PageType = PageType;

  private contentReadySubj = new Subject<void>();

  constructor(
    private productsService: ProductsService,
    private searchService: SearchService,
    private crmService: CrmService,
    private bookmarkService: BookmarkService,
    private companiesService: CompaniesService,
    private dialog: MatDialog,
    private gridHelperService: GridHelperService,
    private navigationService: NavigationHelperService,
    private inventorySearchHelperService: InventorySearchHelperService,
    private notificationHelperService: NotificationHelperService,
    private shoppingCartService: ShoppingCartService,
    private cd: ChangeDetectorRef,
    @Inject(LOCALE_ID) private localeId: string,
    private inventoryHelperService: InventoryHelperService
  ) {
    this.initViewState();
  }

  ngOnInit() {
    this.saveGridState = this.saveGridState.bind(this);
    this.loadGridState = this.loadGridState.bind(this);

    this.minShipWeekEstimate = this.inventoryHelperService.getMinShipWeekEstimate();
    this.fabActions = this.inventorySearchHelperService.getInventoryFABActions();

    this.handleShipToAccountValueChanges();
    this.handleShipToLocationValueChanges();
    this.loadCompanyMembers();
    this.tooltips = Tooltips.getInventoryTooltips();

    this.loadCRMs();
    if (!this.fixedFilters) this.tryLoadCachedData();
  }

  onChangeInventoryView(e): void {
    this.inventoryViewChanged.emit(e.value);
  }

  focusGrid() {
    this.productGrid?.instance.focus();
  }

  public tryLoadCachedData(): void {
    this.inventoryLotIdsByFilters = this.inventorySearchHelperService.getLoadedLotIdsByFilters();
    if (!this.inventoryLotIdsByFilters?.length) return this.loadFreshData();
    this.inventorySearchData = this.inventorySearchHelperService.getLoadedLotsByFilters();
    if (!this.inventorySearchData?.length) return this.loadFreshData();
    this.offset = this.inventorySearchData.length;
    this.allLoaded = this.inventorySearchData.length === this.inventoryLotIdsByFilters.length;
    this.setLatestFilters();
  }

  public search(): void {
    if (this.isFiltersChanged()) {
      this.loadFreshData();
      this.bookmarkService.saveSessionLastState(this.viewKey, this.viewState);
    } else this.loadInventoryData();
    // grid resets to default grouping if products name changes, because columns' set changes dependent from products name.
  }

  public loadFreshData(): void {
    this.offset = 0;
    this.inventorySearchData = [];
    this.cd.detectChanges();
    this.loadInventoryLotsByFilters()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (!this.inventoryLotIdsByFilters.length) {
          this.setLatestFilters();
          return (this.allLoaded = true);
        }
        this.loadInventoryData();
      });
  }

  onExporting(e) {
    this.gridHelperService.exportToExcel(e, 'Inventory Master View');
  }

  setIsLoadingAll(value: boolean): void {
    this.isBackgroundLoading = value;
  }

  isLoadAllVisible(): boolean {
    return (
      !this.isFiltersChanged() &&
      this.inventorySearchData.length &&
      (!this.allLoaded || this.inventorySearchData.length < this.inventoryLotIdsByFilters.length)
    );
  }

  completeLoadedData(loadedData): void {
    this.allLoaded = true;
    this.inventorySearchData = [...this.inventorySearchData, ...loadedData];
    this.inventorySearchHelperService.setLoadedLotsByFilters(this.inventorySearchData);
  }

  public isFiltersChanged(): boolean {
    const viewStateFilters = this.getClonedViewStateFilters();
    if (this.fixedFilters?.shipFromId) viewStateFilters.shipFromIds = [this.fixedFilters?.shipFromId];

    return !ObjectUtil.isDeepEquals(viewStateFilters, this.latestFilters);
  }

  get selectedFiltersCount() {
    let filtersCount = 0;

    Object.keys(this.viewState.filters).forEach(key => {
      const viewFilter = this.viewState.filters[key];
      const defaultFilter = this.defaultState.filters[key];

      if (key === 'productGroups') {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const viewTarget = viewFilter.map(({ isExpanded, ...data }) => data);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const defaultTarget = defaultFilter.map(({ isExpanded, ...data }) => data);

        if (!ObjectUtil.isDeepEquals(viewTarget, defaultTarget)) {
          filtersCount++;
        }
      } else if (!ObjectUtil.isDeepEquals(viewFilter, defaultFilter)) {
        filtersCount++;
      }
    });

    if (this.productGrid?.searchPanel?.text) {
      filtersCount++;
    }

    if (this.viewState.shipToLocationId !== this.defaultState.shipToLocationId) {
      filtersCount++;
    }

    return filtersCount;
  }

  get lastUpdatedTimeString(): string {
    return this.inventorySearchHelperService.lastUpdatedTimeDiffString();
  }

  onFilterReset() {
    this.productGrid.instance.clearFilter();
    this.bookmarkComp.resetToDefault();
  }

  public onStateChanged(viewState: InventoryViewState) {
    this.viewState = viewState;
    this.fixForViewState();
    this.setDeliveryData();
    this.handleViewStateMigration();
    // on setting a grid state, it does not go successful when the grid columns change.
    // when no *ngIf-s in dx columns it works fine.
    this.setGridState();
    this.offset = 0;
    this.inventorySearchData = [];
    this.search();
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

  public cutGradeSorting = (value1, value2) => ProductsHelper.cutGradeSorting(value1, value2);

  private setDeliveryData() {
    const foundAccount = this.accountList.find(x => x.id === this.viewState.shipToAccountId);
    if (foundAccount) this.shipToAccountControl.setValue(foundAccount);

    const foundLocation = this.locationList.find(x => x.id === this.viewState.shipToLocationId);
    if (foundLocation) this.shipToLocationControl.setValue(foundLocation);
  }

  public setGridState() {
    this.productGrid.instance.state(this.viewState.grid);
  }
  public loadGridState() {
    return this.viewState.grid;
  }

  onExpanding(event) {
    this.gridHelperService.expandingRow(this.viewState, event);
  }
  onCollapsing(event) {
    this.gridHelperService.collapsingRow(this.viewState, event);
  }
  onContentReady(event) {
    this.contentReadySubj.next();
    this.gridHelperService.handleExpandedRows(this.viewState, event);
  }

  public saveGridState(gridState) {
    const gridStoringState = ObjectUtil.getDeepCopy(gridState);
    gridStoringState.selectedRowKeys = [];
    this.viewState = { ...this.viewState, grid: gridStoringState };
  }

  public ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.unsubscribe();
  }

  public onGridCellClick(e) {
    if (!e.key) return;
    if (e.column?.type === 'selection') return;
    if (e.isEditing) return;

    if (this.fixedFilters) {
      // order modal mode
      this.onInventorySearchSelectionChanged(e);
      return;
    }

    if (e.rowType === 'group') {
      this.onGridGroupRowClick(e);
    } else if (e.rowType === 'data') {
      clearTimeout(this.doubleClickTimeout);
      if (this.isDoubleClick) {
        this.isDoubleClick = false;
        this.onCellDoubleClick(e);
      } else {
        this.isDoubleClick = true;
        this.doubleClickTimeout = setTimeout(() => {
          this.isDoubleClick = false;
          this.onInventorySearchSelectionChanged(e);
        }, 300);
      }
    }
  }

  public onGridGroupRowClick(e) {
    if (this.latestFiltersSoldSelected) return;
    if (e.column.command) return; // expand/collapse button click

    this.groupMenuData.groupKey = e.key.join(', ');

    if (this.groupMenuData.groupKey.includes('specShorthand')) {
      // TODO handle all grid group value changes (owner)
      this.groupMenuData.groupKey = JSON.parse(this.groupMenuData.groupKey).specShorthand;
    }
    this.groupMenuData.groupItems = this.getAllRowsInSubgroup(e.data.collapsedItems || e.data.items);

    this.groupMenuData.position.x = `${e.event.clientX}px`;
    this.groupMenuData.position.y = `${e.event.clientY}px`;

    this.groupMenuTrigger.openMenu();
  }

  private getAllRowsInSubgroup(items: any[]) {
    return items[0]?.key
      ? items.reduce((acc, item) => acc.concat(this.getAllRowsInSubgroup(item.collapsedItems || item.items)), [])
      : items;
  }

  public onCellDoubleClick(e) {
    if (!e || !e.data) return;
    const selectedLot = e.data;

    if (this.inventorySearchHelperService.canUpdateCell(selectedLot, e.column.dataField)) {
      this.productGrid.instance.editCell(e.rowIndex, e.column.dataField);
    }
  }

  calculateOwnerCellValue = (data: InventorySearchEntity) =>
    ListUtilHelper.getDisplayValueFromList(data.ownerId, this.membersList, 'id', 'name');
  calculateInventoryTypeCellValue = (data: InventorySearchEntity) =>
    TransformHelper.stringUnderscoreToSpaceTitleCase(data.inventoryType);
  calculatePermissionCellValue = (data: InventorySearchEntity) =>
    TransformHelper.stringUnderscoreToSpaceTitleCase(data.permission);
  calculateShipWeekEstimateCellValue = (data: InventorySearchEntity) =>
    data.shipWeekEstimate ? formatDate(data.shipWeekEstimate, 'mediumDate', this.localeId) : 'Not Available';

  calculateCellValueBasedOnFieldName(data: InventorySearchEntity) {
    const columnDisplayName = this['name'];
    return data[columnDisplayName] ? data[columnDisplayName] : '';
  }

  sortDimensionValues = (value1, value2) => ProductsHelper.sortDimensionValues(value1, value2);

  public onInventorySearchSelectionChanged(e): void {
    if (!e || !e.data || !e.data.products?.length) return;

    const selectedLot = e.data;
    const permissions = ProductsHelper.getProductLotAccessRoles(selectedLot);

    if (permissions.canReadTheLot) this.onAction.onProductLotSelect(selectedLot, e);
    else this.notificationHelperService.showValidation('You do not have enough permissions to access this Product Lot');
  }

  onFABAction(value: InventoryFABActions) {
    this.groupMenuData.groupKey = '';
    this.groupMenuData.groupItems = this.productGrid.instance.getSelectedRowsData();

    // TODO make method argument an enum.
    switch (value) {
      case InventoryFABActions.BULK_UPDATE_OWNER:
        this.bulkEditSelectedGroup('owner');
        break;

      case InventoryFABActions.BULK_UPDATE_PERMISSION:
        this.bulkEditSelectedGroup('permission');
        break;

      case InventoryFABActions.BULK_UPDATE_PRICE_OF_MERIT:
        this.bulkEditSelectedGroup('priceOfMerit');
        break;

      case InventoryFABActions.BULK_UPDATE_SHIP_WEEK_ESTIMATE:
        this.bulkEditSelectedGroup('shipWeekEstimate');
        break;

      case InventoryFABActions.BULK_UPDATE_SALES_NOTES:
        this.bulkEditSelectedGroup('notes');
        break;

      case InventoryFABActions.MERGE_LOTS:
        this.mergeSelectedLots();
        break;

      case InventoryFABActions.ADD_TO_CART:
        this.bulkAddToCart();
        break;

      case InventoryFABActions.BULK_ADD_TO_ORDER:
        this.bulkAddToOrder();
        break;

      case InventoryFABActions.CLOSE_CONTRACT:
        this.closeContract();
        break;

      case InventoryFABActions.CLEAR_SELECTION:
        this.clearSelection();
        break;
    }
  }

  closeContract() {
    const products = this.groupMenuData.groupItems
      .reduce((acc, curr) => acc.concat(curr.products), [])
      .filter(item => item.contract?.isOpen && ProductsHelper.canCloseContractForProduct(item));

    this.closeProductsContract(products);
  }

  closeProductsContract(products) {
    this.inventoryHelperService
      .closeContract(products, this.allAccountList)
      .pipe(takeUntil(this.destroy$))
      .subscribe(changed => {
        if (changed) this.loadFreshData();
        this.clearSelection();
      });
  }

  mergeSelectedLots(): void {
    this.inventoryHelperService
      .mergeSelectedLots(this.groupMenuData.groupItems, this.membersList)
      .pipe(takeUntil(this.destroy$))
      .subscribe(changed => {
        if (changed) this.loadFreshData();
        this.clearSelection();
      });
  }

  addToCart(lotsList: InventorySearchEntity[]): void {
    this.shoppingCartService.addCartUnitsForMasterView(lotsList);
  }

  bulkAddToCart(): void {
    this.addToCart(this.groupMenuData.groupItems);
  }

  addToOrder(lotsList: InventorySearchEntity[]): void {
    this.inventoryHelperService
      .addToOrder(lotsList, this.membersList, InventoryViewEnum.MasterView)
      .pipe(takeUntil(this.destroy$))
      .subscribe(txId => {
        if (txId) this.navigationService.navigateToTransactionById(txId);
      });
  }

  bulkAddToOrder(): void {
    this.addToOrder(this.groupMenuData.groupItems);
  }

  private clearSelection(): void {
    this.selectedRows = [];
    this.productGrid.instance.clearSelection();
  }

  bulkEditSelectedGroup(editMode) {
    const productLots = this.groupMenuData.groupItems;
    this.bulkEdit(editMode, productLots);
  }

  bulkEdit(editMode, productLots) {
    const data = {
      membersList: this.membersList,
      permissionsList: this.permissionsList,
      groupKey: this.groupMenuData.groupKey,
      minShipWeekEstimate: this.minShipWeekEstimate,
      editMode: editMode
    };

    this.inventoryHelperService
      .bulkEditSelectedGroup(productLots, data)
      .pipe(takeUntil(this.destroy$))
      .subscribe(changedLotIds => {
        if (changedLotIds?.length) {
          this.reloadLotsData(changedLotIds);
        }
      });
  }

  public onOwnerChanged(e, rowData: InventorySearchEntity) {
    if (e.value === e.previousValue) return;

    this.inventoryHelperService
      .getAllocatedProducts([rowData])
      .pipe(
        mergeMap(allocatedItems => {
          if (allocatedItems.length) {
            return EMPTY;
          }
          return this.productsService.updateLotsOwnerBulk([rowData.lotId], e.value);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(result => {
        this.handleModifiedLessThenMatched(result);
        this.reloadLotsData([rowData.lotId]);
      });
  }

  public onPermissionChanged(e, rowData: InventorySearchEntity) {
    if (e.value === e.previousValue) return;

    this.inventoryHelperService
      .getAllocatedProducts([rowData])
      .pipe(
        mergeMap(allocatedItems => {
          if (allocatedItems.length) {
            return EMPTY;
          }
          return this.productsService.updateLotsPermissionBulk([rowData.lotId], e.value);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(result => {
        this.handleModifiedLessThenMatched(result);
        this.reloadLotsData([rowData.lotId]);
      });
  }

  public onSalesNotesChanged(e, rowData: InventorySearchEntity) {
    if (e.value === e.previousValue) return;

    this.inventoryHelperService
      .getAllocatedProducts([rowData])
      .pipe(
        mergeMap(allocatedItems => {
          if (allocatedItems.length) {
            return EMPTY;
          }
          return this.productsService.updateLotsSalesNotesBulk([rowData.lotId], e.value);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(result => {
        this.handleModifiedLessThenMatched(result);
        this.reloadLotsData([rowData.lotId]);
      });
  }

  public onShipWeekEstimateChanged(e, rowData: InventorySearchEntity) {
    if (e.value === e.previousValue) return;

    this.inventoryHelperService
      .getAllocatedProducts([rowData])
      .pipe(
        mergeMap(allocatedItems => {
          if (allocatedItems.length) {
            return EMPTY;
          }

          return this.productsService.updateLotsShipWeekEstimateBulk([rowData.lotId], e.value);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(result => {
        this.handleModifiedLessThenMatched(result);
        this.reloadLotsData([rowData.lotId]);
      });
  }

  public onPriceOfMeritChanged(e, rowData: InventorySearchEntity) {
    if (e.value === e.previousValue) return;

    this.inventoryHelperService
      .getAllocatedProducts([rowData])
      .pipe(
        mergeMap(allocatedItems => {
          if (allocatedItems.length) {
            return EMPTY;
          }

          return this.productsService.updateLotsPriceOfMeritBulk([rowData.lotId], e.value);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(result => {
        this.handleModifiedLessThenMatched(result);
        this.reloadLotsData([rowData.lotId]);
      });
  }

  private reloadLotsData(lotIds: string[]): void {
    const payload = this.inventorySearchHelperService.getSearchPayload(
      this.viewState.filters,
      this.fixedFilters,
      lotIds
    );
    this.inventorySearchHelperService
      .loadInventoryLots(payload, this.shipToLocationControl.value)
      .pipe(takeUntil(this.destroy$))
      .subscribe(updatedLots => {
        if (updatedLots?.length) {
          const updatedLotsMap = new Map();
          updatedLots.forEach(lot => updatedLotsMap.set(lot.lotId, lot));

          this.inventorySearchData = this.inventorySearchData.map(item => {
            return updatedLotsMap.has(item.lotId) ? updatedLotsMap.get(item.lotId) : item;
          });
          this.inventorySearchHelperService.setLoadedLotsByFilters(this.inventorySearchData);
        }

        const notAvailableLots = lotIds.filter(id => !updatedLots.some(lot => lot.lotId === id));
        this.inventorySearchData = this.inventorySearchData.filter(
          lot => !notAvailableLots.some(id => id === lot.lotId)
        );
      });
  }

  private handleModifiedLessThenMatched(result: { matchedDocuments?: number; modifiedDocuments?: number }): void {
    if (!result.matchedDocuments)
      this.notificationHelperService.showValidation('No entries match the criteria for update.');
    else if (result.modifiedDocuments < result.matchedDocuments) {
      this.notificationHelperService.showValidation('Not all lots has successfully been updated. Please reload.');
    }
  }

  private setAllExpandedRows() {
    const subs = this.contentReadySubj
      .asObservable()
      .pipe(debounceTime(50), takeUntil(this.destroy$))
      .subscribe(async () => {
        this.viewState.expandedRows = this.gridHelperService.getAllExpandedRows(this.productGrid);
        subs.unsubscribe();
      });
  }

  public onToolbarPreparing(e) {
    this.gridHelperService.prepareToolbarCollapseExpand(
      e,
      () => this.productGrid,
      () => (this.viewState.expandedRows = []),
      () => this.setAllExpandedRows()
    );
    this.gridHelperService.prepareToolbarPrefixTemplate(e);
  }

  onOptionChanged(event) {
    if (event.name === 'columns' && event.fullName.endsWith('.groupIndex')) {
      this.viewState.expandedRows = [];
    }
  }

  public openHistoricalPriceDetails(event, selectedLot) {
    event.stopPropagation();
    this.dialog.open(HistoricalPriceModalComponent, {
      width: '1200px',
      maxWidth: '1700px',
      disableClose: true,
      data: selectedLot
    });
  }

  private initViewState() {
    this.viewState = this.bookmarkService.getSessionState(this.viewKey, new InventoryViewState(), this.defaultState);

    this.fixForViewState();
    this.setDeliveryData();
    this.handleViewStateMigration();
  }

  private fixForViewState() {
    if (!Environment.isContractsSupported()) {
      this.viewState.filters.inventoryTypes = [];
      if (this.viewState.grid) {
        this.viewState.grid.filterValue = this.viewState.grid.filterValue?.filter(item => item[0] !== 'inventoryType');
      }
    }
  }

  private handleViewStateMigration(): void {
    // products lot state 'PRODUCTION' has been deleted.
    this.viewState.filters.states = this.viewState.filters?.states?.filter(item => item !== 'PRODUCTION');
  }

  private setTooltips(): void {
    const filter = this.viewState.filters.productGroups;
    this.tooltips = Tooltips.getInventoryTooltips();
    this.tooltips = {
      ...this.tooltips,
      ...(this.shipToLocationControl.value
        ? Tooltips.getDeliveryPricingTooltips()
        : Tooltips.getNoDeliveryLocationTooltips())
    };
    if (!filter.length) return;
    if (!filter.some(item => item.name === 'Lumber'))
      this.tooltips = { ...this.tooltips, ...Tooltips.getInventoryNoProductTooltips('Lumber') };
    if (!filter.some(item => item.name === 'Panel'))
      this.tooltips = { ...this.tooltips, ...Tooltips.getInventoryNoProductTooltips('Panel') };
    if (!filter.some(item => item.name === 'Engineered'))
      this.tooltips = { ...this.tooltips, ...Tooltips.getInventoryNoProductTooltips('Engineered') };
  }

  private loadInventoryLotsByFilters(): Observable<any> {
    const payload = this.inventorySearchHelperService.getSearchPayload(this.viewState.filters, this.fixedFilters);
    return this.inventorySearchHelperService.listInventoryLotsByFilter(payload).pipe(
      first(),
      map(lotIds => {
        this.inventoryLotIdsByFilters = lotIds;
        this.inventorySearchHelperService.setLoadedLotIdsByFilters(lotIds);
        this.inventorySearchHelperService.setLastRefreshedTime(new Date());
      })
    );
  }

  private loadInventoryData(): void {
    this.setTooltips();

    const end =
      this.offset + this.limit > this.inventoryLotIdsByFilters.length
        ? this.inventoryLotIdsByFilters.length
        : this.offset + this.limit;
    const lotIds = this.inventoryLotIdsByFilters.slice(this.offset, end);
    const payload = this.inventorySearchHelperService.getSearchPayload(
      this.viewState.filters,
      this.fixedFilters,
      lotIds
    );

    this.inventorySearchHelperService
      .loadInventoryLots(payload, this.shipToLocationControl.value)
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        this.allLoaded = end === this.inventoryLotIdsByFilters.length;
        this.inventorySearchData.push(...data);
        this.inventorySearchHelperService.setLoadedLotsByFilters(this.inventorySearchData);
        this.offset += this.limit;
        this.setLatestFilters();
      });
  }

  private setLatestFilters(): void {
    this.latestFilters = this.getClonedViewStateFilters();
    this.inventorySearchHelperService.latestFilters = this.viewState;
    this.latestFiltersSoldSelected = this.latestFilters?.states?.some(s => s === ProductStateEnum.SOLD);
    if (this.fixedFilters?.shipFromId) this.latestFilters.shipFromIds = [this.fixedFilters?.shipFromId];
  }

  private getClonedViewStateFilters() {
    if (!this.viewState) {
      this.initViewState();
    }
    return ObjectUtil.getDeepCopy(this.viewState.filters);
  }

  private loadCompanyMembers(): void {
    this.companiesService
      .getCompanyCompleteMembers()
      .pipe(takeUntil(this.destroy$))
      .subscribe(members => {
        this.membersList = members;
        this.productGrid.instance.refresh();
      });
  }
  private handleShipToLocationValueChanges(): void {
    this.shipToLocationControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(location => {
      this.viewState.shipToLocationId = location?.id || '';
      this.tooltips = {
        ...this.tooltips,
        ...(location ? Tooltips.getDeliveryPricingTooltips() : Tooltips.getNoDeliveryLocationTooltips())
      };
    });
  }
  private handleShipToAccountValueChanges(): void {
    this.shipToAccountControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(account => {
      this.viewState.shipToAccountId = account?.id || '';

      if (account) {
        this.selectedAccountLocations = this.locationList.filter(x => x.crmAccountId === account.id);
      } else {
        this.selectedAccountLocations = [];
      }

      const target = this.selectedAccountLocations.find(item => item.id === this.viewState.shipToLocationId);
      this.shipToLocationControl.setValue(target ? target : '');
    });
  }

  private loadCRMs(): void {
    combineLatest([this.crmService.getAccounts(true).pipe(first()), this.crmService.getLocations().pipe(first())])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([accounts, locations]) => {
        this.allAccountList = accounts;
        this.accountList = this.allAccountList.filter(item => !item.archived);
        this.locationList = locations;
        this.setDeliveryData();
      });
  }
}
