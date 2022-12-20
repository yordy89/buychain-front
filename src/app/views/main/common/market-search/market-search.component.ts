import { Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Tooltips } from '@services/app-layer/app-layer.tooltips';
import { MarketSearchEntity } from '@services/app-layer/entities/market-search';
import { GridHelperService } from '@services/helpers/grid-helper/grid-helper.service';
import { BookmarkComponent } from '@views/main/common/bookmark/bookmark.component';
import { Subject } from 'rxjs';
import { first, takeUntil, map } from 'rxjs/operators';
import { DxDataGridComponent } from 'devextreme-angular';
import { FormControl, FormGroup } from '@angular/forms';
import { SearchService } from '@services/app-layer/search/search.service';
import { ObjectUtil } from '@services/helpers/utils/object-util';
import { FacilitiesService } from '@services/app-layer/facilities/facilities.service';
import { FacilityEntity } from '@services/app-layer/entities/facility';
import { Environment } from '@services/app-layer/app-layer.environment';
import { BookmarkService } from '@services/app-layer/bookmark/bookmark.service';
import { NavigationHelperService } from '@services/helpers/navigation-helper/navigation-helper.service';
import { CrmAccountEntity } from '@services/app-layer/entities/crm';
import { CrmService } from '@services/app-layer/crm/crm.service';
import { ProductsHelper } from '@services/app-layer/products/products-helper';

class ViewState {
  public filters = {
    organizationIds: [],
    productGroups: [{ name: 'Lumber', isExpanded: false, products: ['Dim'] }]
  };
  public filtersState = {
    expandedProducts: true,
    expandedDeliveredPricing: true
  };
  public grid = null;
  public shipToFacilityId = '';
}

@Component({
  selector: 'app-product-list',
  templateUrl: './market-search.component.html',
  styleUrls: ['./market-search.component.scss']
})
export class MarketSearchComponent implements OnInit, OnDestroy {
  @ViewChild('grid') grid: DxDataGridComponent;
  @ViewChild(BookmarkComponent) bookmarkComp: BookmarkComponent;

  @Input() onAction: any;
  @Input() get fixedFilters(): any {
    return this._fixedFilters;
  }
  set fixedFilters(value: any) {
    this._fixedFilters = value;
    if (value) {
      this.setFixedFilters();
      this.search();
    }
  }
  private _fixedFilters: any;

  public viewKey = 'product';
  public viewState: ViewState;
  public defaultState = new ViewState();

  public isLoaded = false;
  public hasLinkedCrmAccounts = false;

  public linkedCrmAccountList: CrmAccountEntity[] = [];
  public selectedAccounts: CrmAccountEntity[] = [];
  public facilityList: FacilityEntity[];
  public shipFromOptions = [];

  public companyControl = new FormControl();
  public shipFromFacilityControl = new FormControl();
  public shipToFacility = new FormControl();
  public company: FormGroup;

  public marketSearchData: MarketSearchEntity[] = [];
  public selectedRow: any;

  public uiProducts = [];

  private destroy$ = new Subject<void>();

  public selectedProduct: string;

  focusedRowKey;

  tooltips: { [key: string]: string };

  constructor(
    private bookmarkService: BookmarkService,
    public searchService: SearchService,
    private crmService: CrmService,
    private facilitiesService: FacilitiesService,
    private navigationHelper: NavigationHelperService,
    private gridHelperService: GridHelperService
  ) {
    this.saveGridState = this.saveGridState.bind(this);
    this.loadGridState = this.loadGridState.bind(this);

    this.createForm();
    this.initViewState();
    this.initUIProducts();
  }

  ngOnInit() {
    if (this.fixedFilters) this.setFixedFilters();
    this.handleCompanyControlChange();
    this.handleShipToFacilityControlChange();
    this.tooltips = Tooltips.getMarketSearchTooltips();

    this.initFacilities()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.initLinkedCRMAccounts()
          .pipe(takeUntil(this.destroy$))
          .subscribe(() => {
            this.isLoaded = true;
          });
        if (!this.fixedFilters) this.search();
      });
  }

  focusGrid() {
    this.grid?.instance.focus();
  }

  onExporting(e) {
    this.gridHelperService.exportToExcel(e, 'Market', (gridCell, excelCell) => {
      if (gridCell.rowType !== 'data') {
        return;
      }

      if (gridCell.column.cellTemplate === 'displayValueBasedOnColumnName') {
        excelCell.value = this.getDisplayValueBasedOnColumnName(gridCell);
      }
    });
  }

  public search(): void {
    const filters = {
      organizationIds: this.viewState.filters.organizationIds,
      shipFromIds: this.fixedFilters?.shipFromId ? [this.fixedFilters?.shipFromId] : [],
      productGroup: this.viewState.filters.productGroups[0].name,
      products: this.viewState.filters.productGroups[0].products
    };
    if (!filters.organizationIds || filters.organizationIds.length === 0) return;

    this.selectedProduct = filters.productGroup || '';
    this.searchService
      .fetchMarketData(filters as any, this.shipToFacility.value)
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => (this.marketSearchData = data));
    // grid resets to default grouping if product name changes, because columns' set changes dependent from product name.
    this.bookmarkService.saveSessionLastState(this.viewKey, this.viewState);
  }

  public productGroupExpansionToggled(productGroup, isExpanded): void {
    productGroup.isExpanded = isExpanded;
    this.updateProductGroupsFilter();
  }

  public productNameSelectionToggled(productName): void {
    this.uiProducts.forEach(item => {
      item.isSelected = item.name === productName.name;
      item.products.forEach(product => (product.isSelected = item.isSelected));
    });
    this.updateProductGroupsFilter();
  }
  public productSelectionToggled(productName): void {
    this.uiProducts.forEach(item => {
      item.isSelected = item.name === productName.name;
      if (!item.isSelected) item.products.forEach(p => (p.isSelected = false));
    });
    this.updateProductGroupsFilter();
  }

  private updateProductGroupsFilter(): void {
    this.viewState.filters.productGroups = this.uiProducts
      .filter(item => item.isSelected)
      .map(item => ({
        name: item.name,
        isExpanded: item.isExpanded,
        products: item.products.filter(product => product.isSelected).map(product => product.name)
      }));
  }

  public removeCompany(company: CrmAccountEntity): void {
    this.viewState.filters.organizationIds = this.viewState.filters.organizationIds.filter(
      id => !!id && id !== company.link.id
    );
    this.selectedAccounts = this.selectedAccounts.filter(item => item.id !== company.id);
  }

  public onStateChanged(viewState: ViewState) {
    if (this.fixedFilters) {
      // fixed ship from and organization in tx
      viewState.filters.organizationIds = [this.fixedFilters.organizationId];
    }

    this.viewState = viewState;
    this.setFiltersValues();
    this.setGridState();
    this.search();
  }

  public setGridState() {
    this.grid.instance.state(this.viewState.grid);
  }

  public loadGridState() {
    return this.viewState.grid;
  }

  public saveGridState(gridState) {
    const gridStoringState = ObjectUtil.getDeepCopy(gridState);
    gridStoringState.selectedRowKeys = [];
    this.viewState = { ...this.viewState, grid: gridStoringState };
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

  public lumberLengthSorting = (value1, value2) => {
    const number1 = parseInt(value1, 10);
    const number2 = parseInt(value2, 10);
    return number1 > number2 ? 1 : -1;
  };

  public onMarketSearchSelectionChanged(data): void {
    this.selectedRow = data.data;
    if (this.selectedRow && this.onAction) {
      this.onAction.onProductLotSelect(this.selectedRow, data);
    }
  }

  public onToolbarPreparing(e) {
    this.gridHelperService.prepareToolbarCollapseExpand(e, () => this.grid);
    this.gridHelperService.prepareToolbarPrefixTemplate(e);
  }

  public getDisplayValueBasedOnColumnName(e) {
    const getRowData = data => {
      const items = data.collapsedItems || data.items;
      if (data.key && items && items.length) {
        // grouped
        return getRowData(items[0]);
      } else {
        return data;
      }
    };

    const displayFieldName = e.column.name;
    const rowData = getRowData(e.data);
    return rowData[displayFieldName];
  }

  public goToCrm() {
    this.navigationHelper.navigateToCrm();
  }

  public ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.unsubscribe();
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

    if (this.viewState.shipToFacilityId !== this.defaultState.shipToFacilityId) {
      filtersCount++;
    }

    if (this.grid?.searchPanel?.text) {
      filtersCount++;
    }

    return filtersCount;
  }

  onFilterReset() {
    this.grid.instance.clearFilter();
    this.bookmarkComp.resetToDefault();
  }

  /*
   * private helpers
   * */
  private getLinkedCrmAccountNames() {
    return this.crmService.getAccounts().pipe(map(accounts => accounts.filter(a => a.link)));
  }

  private createForm(): void {
    this.company = new FormGroup({
      shipFromFacilityControl: this.shipFromFacilityControl,
      companyControl: this.companyControl
    });
  }

  private initViewState() {
    this.viewState = this.bookmarkService.getSessionState(this.viewKey, new ViewState(), this.defaultState);
  }

  private initLinkedCRMAccounts() {
    return this.getLinkedCrmAccountNames().pipe(
      map(crmAccounts => {
        this.hasLinkedCrmAccounts = crmAccounts.length > 0;
        this.linkedCrmAccountList = crmAccounts;

        // TODO temporary
        if (
          this.fixedFilters &&
          !this.linkedCrmAccountList.some(item => item.id === this.fixedFilters.organizationId)
        ) {
          const { organizationId, organizationName } = this.fixedFilters;
          this.linkedCrmAccountList = this.linkedCrmAccountList.concat({
            id: organizationId,
            name: organizationName
          } as any);
        }

        this.selectedAccounts = crmAccounts.filter(account =>
          this.viewState.filters.organizationIds.some(id => id === account.link.id)
        );
      })
    );
  }

  private initUIProducts() {
    this.uiProducts = this.mapToFilterModel(Environment.getUiProducts());
    this.updateUiProductsSelection();
  }

  private initFacilities() {
    return this.facilitiesService.getCompanyFacilities(Environment.getCurrentUser().companyId).pipe(
      first(),
      map(facilities => {
        this.facilityList = facilities;
        const found = this.facilityList.find(x => x.id === this.viewState.shipToFacilityId);
        if (found) this.shipToFacility.setValue(found);
      })
    );
  }

  private handleCompanyControlChange() {
    this.companyControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(companyId => {
      if (!companyId) return;

      const company = this.linkedCrmAccountList.find(item => item.id === companyId);

      if (!this.viewState.filters.organizationIds.some(x => x === company.link.id)) {
        this.viewState.filters.organizationIds.push(company.link.id);
      }
      if (!this.selectedAccounts.some(item => item.id === company.id)) {
        this.selectedAccounts.push(company);
      }
    });
  }

  private handleShipToFacilityControlChange() {
    this.shipToFacility.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(facility => {
      if (!facility) return;
      this.viewState = { ...this.viewState, shipToFacilityId: facility.id };
    });
  }

  private setFixedFilters(): void {
    const filters = this.fixedFilters;
    this.setCompanyControlValue(filters.organizationId);
    this.setFacilityControlValue(filters.shipFromShortName, filters.shipFromId);

    this.selectedAccounts = []; // control is fixed and disabled, no need to show also selected accounts
    this.viewState.filters.organizationIds = filters.organizationId ? [filters.organizationId] : [];
  }

  private setCompanyControlValue(organizationId: string) {
    const matchingCRM = this.linkedCrmAccountList.find(account => account.link && account.link.id === organizationId);
    if (matchingCRM) {
      this.companyControl.setValue(matchingCRM.id);
      this.companyControl.disable({ emitEvent: false });
    } else {
      this.companyControl.setValue(organizationId);
      this.companyControl.enable({ emitEvent: false });
    }
  }

  private setFacilityControlValue(name, id) {
    this.shipFromOptions = this.shipFromOptions.concat({ id, name });
    this.shipFromFacilityControl.setValue(id);
    this.shipFromFacilityControl.disable({ emitEvent: false });
  }

  private setFiltersValues() {
    this.selectedAccounts = this.linkedCrmAccountList.filter(account =>
      this.viewState.filters.organizationIds.some(id => id === account.link.id)
    );
    if (!this.selectedAccounts.length) {
      this.companyControl.setValue(null);
    }

    const selectedFacility = this.facilityList.find(x => x.id === this.viewState.shipToFacilityId);
    this.shipToFacility.setValue(selectedFacility);
    this.updateUiProductsSelection();
  }

  private mapToFilterModel(uiProducts) {
    return uiProducts.productGroups.map(productName => ({
      name: productName.name,
      isSelected: false,
      isExpanded: false,
      products: productName.products.map(product => ({
        name: product.name,
        isSelected: false
      }))
    }));
  }

  private updateUiProductsSelection() {
    const selected = this.viewState.filters.productGroups;
    this.uiProducts.forEach(group => {
      const selectedGroup = selected.find(x => x.name === group.name);
      group.isSelected = !!selectedGroup;
      group.isExpanded = !!selectedGroup && selectedGroup.isExpanded;
      if (selectedGroup) {
        group.products.forEach(
          product => (product.isSelected = selectedGroup.products.some(name => name === product.name))
        );
      }
    });
  }
}
