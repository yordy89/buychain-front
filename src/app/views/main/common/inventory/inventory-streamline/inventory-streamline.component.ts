import { ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatMenuTrigger } from '@angular/material/menu';
import { FABAction } from '@app/models';
import { InventoryViewEnum, ProductLotPermissionEnum } from '@services/app-layer/app-layer.enums';
import { BookmarkService } from '@services/app-layer/bookmark/bookmark.service';
import { CompaniesService } from '@services/app-layer/companies/companies.service';
import { CrmService } from '@services/app-layer/crm/crm.service';
import { CrmAccountEntity } from '@services/app-layer/entities/crm';
import {
  InventorySearchEntity,
  InventoryStreamlineEntity,
  ProductEntity
} from '@services/app-layer/entities/inventory-search';
import { MemberEntity } from '@services/app-layer/entities/member';
import { FacilitiesService } from '@services/app-layer/facilities/facilities.service';
import { ProductsHelper } from '@services/app-layer/products/products-helper';
import { SearchService } from '@services/app-layer/search/search.service';
import { GridHelperService } from '@services/helpers/grid-helper/grid-helper.service';
import { NavigationHelperService } from '@services/helpers/navigation-helper/navigation-helper.service';
import { NotificationHelperService } from '@services/helpers/notification-helper/notification-helper.service';
import { ObjectUtil } from '@services/helpers/utils/object-util';
import { BookmarkComponent } from '@views/main/common/bookmark/bookmark.component';
import { InventoryFABActions } from '@views/main/common/inventory/inventory-search/inventory-search.helper.service';
import {
  InventoryStreamlineHelperService,
  InventoryStreamlineViewState
} from '@views/main/common/inventory/inventory-streamline/inventory-streamline.helper.service';
import { InventoryHelperService } from '@views/main/common/inventory/inventory.helper.service';
import { PageType } from '@views/main/common/load-all-units/load-all-units.component';
import { ContractProductsModalComponent } from '@views/main/common/modals/contract-products-modal/contract-products-modal.component';
import { ShoppingCartService } from '@views/main/common/shopping-cart/shopping-cart.service';
import { DxDataGridComponent } from 'devextreme-angular';
import { combineLatest, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-inventory-streamline',
  templateUrl: './inventory-streamline.component.html'
})
export class InventoryStreamlineComponent implements OnInit, OnDestroy {
  @ViewChild('productGrid') productGrid: DxDataGridComponent;
  @ViewChild(BookmarkComponent) bookmarkComp: BookmarkComponent;
  @ViewChild(MatMenuTrigger) groupMenuTrigger: MatMenuTrigger;

  readonly InventoryViewEnum = InventoryViewEnum;
  @Input() inventoryView: InventoryViewEnum;
  @Input() isFromModal = false;
  @Output() inventoryViewChanged = new EventEmitter();
  @Output() rowSelection = new EventEmitter();

  @Input() fixedFilters: any;

  viewKey = 'inventoryStreamline';
  viewState = new InventoryStreamlineViewState();
  defaultState = new InventoryStreamlineViewState();
  latestFilters = null;

  membersList: MemberEntity[] = [];

  inventoryProductsData: InventoryStreamlineEntity[] = [];
  productsList: ProductEntity[] = [];
  productsCountByFilter: number;

  offset = 0;
  limit = 1000;
  allLoaded = false;
  isBackgroundLoading = false;

  PageType = PageType;

  selectedRows = [];
  fabActions: FABAction[] = [];

  menuData = {
    position: {
      x: '',
      y: ''
    },
    groupItems: [],
    groupKey: ''
  };
  minShipWeekEstimate: Date;
  allAccountList: CrmAccountEntity[] = [];
  productLots: InventorySearchEntity[] = [];
  readonly permissionsList = ObjectUtil.enumToArray(ProductLotPermissionEnum);

  private destroy$ = new Subject<void>();

  constructor(
    public inventoryStreamlineHelperService: InventoryStreamlineHelperService,
    private inventoryHelperService: InventoryHelperService,
    private notificationHelperService: NotificationHelperService,
    private navigationService: NavigationHelperService,
    private facilitiesService: FacilitiesService,
    private gridHelperService: GridHelperService,
    private companiesService: CompaniesService,
    private bookmarkService: BookmarkService,
    private shoppingCartService: ShoppingCartService,
    private searchService: SearchService,
    private crmService: CrmService,
    private cd: ChangeDetectorRef,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.saveGridState = this.saveGridState.bind(this);
    this.loadGridState = this.loadGridState.bind(this);
    this.fabActions = this.inventoryStreamlineHelperService.getInventoryFABActions();
    this.minShipWeekEstimate = this.inventoryHelperService.getMinShipWeekEstimate();
    this.initViewState();
    this.loadSupportingData();
    this.loadCRMs();

    this.viewState.filters.shipFromId === this.inventoryStreamlineHelperService?.latestFilters?.filters?.shipFromId
      ? this.tryLoadCachedData()
      : this.search();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onChangeInventoryView(e): void {
    this.inventoryViewChanged.emit(e.value);
  }

  tryLoadCachedData(): void {
    this.productsCountByFilter = this.inventoryStreamlineHelperService.getLoadedProductsCountByFilters();
    if (!this.productsCountByFilter) return this.loadFreshData();
    this.inventoryProductsData = this.inventoryStreamlineHelperService.getLoadedProductsByFilters();
    if (!this.inventoryProductsData?.length) return this.loadFreshData();
    this.productsList = this.inventoryStreamlineHelperService.productsList;
    this.offset = this.inventoryStreamlineHelperService.productsList.length;
    this.allLoaded = this.offset >= this.inventoryStreamlineHelperService.productsCountByFilter;
    this.setLatestFilters();
  }

  search(): void {
    if (this.isFiltersChanged()) {
      this.loadFreshData();
      this.bookmarkService.saveSessionLastState(this.viewKey, this.viewState);
    } else this.loadInventoryData();
    // grid resets to default grouping if products name changes, because columns' set changes dependent from products name.
  }

  isFiltersChanged(): boolean {
    const viewStateFilters = this.getClonedViewStateFilters();

    return !ObjectUtil.isDeepEquals(viewStateFilters, this.latestFilters);
  }

  setIsLoadingAll(value: boolean): void {
    this.isBackgroundLoading = value;
  }

  completeLoadedData(): void {
    this.allLoaded = true;
    this.inventoryProductsData = this.inventoryStreamlineHelperService.getLoadedProductsByFilters();
  }

  onExporting(e) {
    this.gridHelperService.exportToExcel(e, 'Inventory Product View');
  }

  private getClonedViewStateFilters() {
    if (!this.viewState) {
      this.initViewState();
    }
    return ObjectUtil.getDeepCopy(this.viewState.filters);
  }

  loadFreshData(): void {
    this.offset = 0;
    this.inventoryProductsData = [];
    this.productsList = [];
    this.productsCountByFilter = 0;
    this.allLoaded = false;
    this.cd.detectChanges();

    this.setLatestFilters();
    const payload = this.inventoryStreamlineHelperService.getSearchPayload(this.viewState);
    this.inventoryStreamlineHelperService.resetCachedData();

    if (!this.viewState.filters.shipFromId) {
      return this.notificationHelperService.showValidation('Please select ship from facility in filters.');
    }

    this.searchService
      .getInventoryProductsCountByFilters(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        this.productsCountByFilter = value;
        this.inventoryStreamlineHelperService.setLoadedProductsCountByFilters(value);
        this.inventoryStreamlineHelperService.setLastRefreshedTime(new Date());
        if (value) this.loadInventoryData();
        else {
          this.allLoaded = true;
          this.productsList = [];
          this.inventoryProductsData = [];
        }
      });
  }

  get lastUpdatedTimeString(): string {
    return this.inventoryStreamlineHelperService.lastUpdatedTimeDiffString();
  }

  onToolbarPreparing(e) {
    this.gridHelperService.prepareToolbarCollapseExpand(e, () => this.productGrid);
    this.gridHelperService.prepareToolbarPrefixTemplate(e);
  }

  isLoadAllVisible(): boolean {
    return (
      !this.isFiltersChanged() &&
      this.inventoryProductsData.length &&
      (!this.allLoaded || this.productsList.length < this.productsCountByFilter)
    );
  }

  private loadInventoryData(): void {
    if (!this.viewState.filters.shipFromId) {
      return this.notificationHelperService.showValidation('Please select ship from facility in filters.');
    }
    const payload = {
      ...this.inventoryStreamlineHelperService.getSearchPayload(this.viewState),
      offset: this.offset,
      limit: this.limit
    };
    // this.setTooltips();

    if (this.productsList.length && !this.inventoryStreamlineHelperService.productsList?.length)
      this.inventoryStreamlineHelperService.productsList = this.productsList;
    // if cached data resets, but we are still in the same page and component data is maintained.
    this.setLatestFilters();
    this.inventoryStreamlineHelperService
      .loadInventoryProducts(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        this.allLoaded = this.inventoryStreamlineHelperService.productsList.length >= this.productsCountByFilter;
        this.inventoryProductsData = data;
        this.productsList = this.inventoryStreamlineHelperService.productsList;
        this.offset += this.limit;
      });
  }

  private setLatestFilters(): void {
    this.latestFilters = this.getClonedViewStateFilters();
    this.inventoryStreamlineHelperService.latestFilters = this.viewState;
  }

  // TODO generalize inventory streamline market
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

    return filtersCount;
  }

  // TODO generalize
  onFilterReset() {
    this.productGrid.instance.clearFilter();
    this.bookmarkComp.resetToDefault();
  }

  onStateChanged(viewState: InventoryStreamlineViewState) {
    this.viewState = viewState;

    this.setGridState();
    this.loadFreshData();
  }

  setGridState() {
    if (this.productGrid) this.productGrid.instance.state(this.viewState.grid);
  }
  loadGridState() {
    return this.viewState.grid;
  }
  saveGridState(gridState) {
    const gridStoringState = ObjectUtil.getDeepCopy(gridState);
    gridStoringState.selectedRowKeys = [];
    this.viewState = { ...this.viewState, grid: gridStoringState };
  }

  onGridRowClick(e) {
    if (e?.column?.command) return; // expand/collapse button click
    if (!e.key) return; // header
    if (e.column?.type === 'selection') return; // checkbox

    this.menuData.groupKey = '';

    if (e.rowType === 'group') {
      this.menuData.groupKey = e.key.join(', ');

      if (this.menuData.groupKey.includes('specShorthand')) {
        // TODO handle all grid group value changes (owner)
        this.menuData.groupKey = JSON.parse(this.menuData.groupKey).specShorthand;
      }
      this.menuData.groupItems = this.collectGroupProducts([], e.data.items || e.data.collapsedItems);
      this.productLots = this.getProductLots();
    } else if (e.rowType === 'data') {
      this.menuData.groupItems = [e.data];
      this.productLots = this.getProductLots();
    }

    this.menuData.position.x = `${e.event.clientX}px`;
    this.menuData.position.y = `${e.event.clientY}px`;

    const products = this.getProducts();
    this.fixedFilters ? this.rowSelection.emit(products) : this.groupMenuTrigger.openMenu();
  }

  collectGroupProducts(entries: InventoryStreamlineEntity[], gridData: any): InventoryStreamlineEntity[] {
    gridData.forEach(item =>
      item.key ? this.collectGroupProducts(entries, item.items || item.collapsedItems) : entries.push(item)
    );
    return entries;
  }

  onFABAction(value: InventoryFABActions) {
    this.menuData.groupKey = '';
    this.menuData.groupItems = this.productGrid.instance.getSelectedRowsData();
    this.productLots = this.getProductLots();

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

      case InventoryFABActions.BULK_ADD_TO_ORDER:
        this.bulkAddToOrder();
        break;

      case InventoryFABActions.ADD_TO_CART:
        this.bulkAddToCart();
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
    const products = this.getProducts().filter(
      item => item.contract?.isOpen && ProductsHelper.canCloseContractForProduct(item)
    );

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
      .mergeSelectedLots(this.productLots, this.membersList)
      .pipe(takeUntil(this.destroy$))
      .subscribe(changed => {
        if (changed) this.loadFreshData();
        this.clearSelection();
      });
  }

  bulkEditSelectedGroup(editMode) {
    const data = {
      membersList: this.membersList,
      permissionsList: this.permissionsList,
      groupKey: this.menuData.groupKey,
      minShipWeekEstimate: this.minShipWeekEstimate,
      editMode: editMode
    };

    this.inventoryHelperService
      .bulkEditSelectedGroup(this.productLots, data)
      .pipe(takeUntil(this.destroy$))
      .subscribe(changedLotIds => {
        if (changedLotIds?.length) {
          this.reloadLotsData(changedLotIds);
        }
      });
  }

  private reloadLotsData(lotIds: string[]): void {
    const payload = this.inventoryStreamlineHelperService.getProductLotsPayload(this.viewState, lotIds);
    this.inventoryStreamlineHelperService
      .updateInventoryProducts(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        this.inventoryProductsData = data;
        this.productsList = this.inventoryStreamlineHelperService.productsList;
      });
  }

  bulkAddToOrder(): void {
    this.inventoryHelperService
      .addToOrder(this.productLots, this.membersList, InventoryViewEnum.ProductView)
      .pipe(takeUntil(this.destroy$))
      .subscribe(txId => {
        //  TODO do we want to open tx?
        if (txId) this.navigationService.navigateToTransactionById(txId);
      });
  }

  onShowContractItems() {
    const products = this.getProducts().filter(item => !!item.contract);

    this.dialog
      .open(ContractProductsModalComponent, {
        width: '1500px',
        disableClose: true,
        data: {
          products,
          crmAccounts: this.allAccountList
        }
      })
      .afterClosed()
      .subscribe(refresh => {
        if (refresh) {
          this.loadFreshData();
        }
      });
  }

  private getProducts() {
    return this.menuData.groupItems.reduce((acc, cur) => [...acc, ...cur.products], []);
  }

  private getProductLots() {
    const products = this.getProducts();
    return this.inventoryHelperService.normalizeInventoryData(products);
  }

  bulkAddToCart(): void {
    this.shoppingCartService.addCartUnitsForProductView(this.menuData.groupItems);
  }

  private clearSelection(): void {
    this.selectedRows = [];
    this.productGrid.instance.clearSelection();
  }

  private initViewState() {
    this.viewState = this.bookmarkService.getSessionState(
      this.viewKey,
      new InventoryStreamlineViewState(),
      this.defaultState
    );
    if (this.fixedFilters?.shipFromId) this.viewState.filters.shipFromId = this.fixedFilters.shipFromId;
    this.setGridState();
  }

  specSortingValue(data): any {
    return JSON.stringify(data.spec);
  }

  getSpecGroupValue(data): string {
    const spec = JSON.parse(data);
    return spec.specShorthand;
  }

  specSorting = (value1, value2) => {
    const spec1 = JSON.parse(value1);
    const spec2 = JSON.parse(value2);
    return ProductsHelper.specSorting(spec1, spec2);
  };

  cutGradeSorting = (value1, value2) => ProductsHelper.cutGradeSorting(value1, value2);

  calculateCellValueBasedOnFieldName(data: InventoryStreamlineEntity) {
    const columnDisplayName = this['name'];
    return data[columnDisplayName] ? data[columnDisplayName] : '';
  }

  sortDimensionValues = (value1, value2) => ProductsHelper.sortDimensionValues(value1, value2);

  private loadSupportingData(): void {
    this.companiesService
      .getCompanyCompleteMembers()
      .pipe(takeUntil(this.destroy$))
      .subscribe(members => (this.membersList = members));
  }

  private loadCRMs(): void {
    combineLatest([this.crmService.getAccounts(true)])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([accounts]) => {
        this.allAccountList = accounts;
      });
  }
}
