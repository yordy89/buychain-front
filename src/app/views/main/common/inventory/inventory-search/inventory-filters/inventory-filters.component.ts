import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { CrmAccountEntity } from '@services/app-layer/entities/crm';
import { ObjectUtil } from '@services/helpers/utils/object-util';
import { Subject } from 'rxjs';
import { Environment } from '@services/app-layer/app-layer.environment';
import {
  ContractStateEnum,
  ProductLotPermissionEnum,
  ProductPurchaseMethod,
  ProductStateEnum
} from '@services/app-layer/app-layer.enums';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { FacilityEntity } from '@services/app-layer/entities/facility';
import { FacilitiesService } from '@services/app-layer/facilities/facilities.service';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-inventory-filters',
  templateUrl: './inventory-filters.component.html',
  styleUrls: ['./inventory-filters.component.scss']
})
export class InventoryFiltersComponent implements OnInit, OnDestroy {
  @Input() filtersState: { [key: string]: boolean };
  private destroy$ = new Subject<void>();

  public productLotStates = ObjectUtil.enumToArray(ProductStateEnum).map(key => ({
    key,
    isSelected: false,
    disabled: false,
    excluded: false
  }));

  readonly inventoryTypes = [ProductPurchaseMethod.CASH, ProductPurchaseMethod.CONTRACT].map(key => ({
    key,
    isSelected: false
  }));
  readonly productLotPermissions = ObjectUtil.enumToArray(ProductLotPermissionEnum).map(key => ({
    key,
    isSelected: false
  }));
  readonly contractStatuses = [ContractStateEnum.OPEN, ContractStateEnum.CLOSED].map(key => ({
    key: key,
    isSelected: false
  }));
  public uiProducts = [];

  private _filters: any;
  @Input() public get filters() {
    return this._filters;
  }
  public set filters(value) {
    this._filters = value;
    this.onFiltersChanged();
  }

  private _fixedFilters: any;
  @Input() get fixedFilters(): any {
    return this._fixedFilters;
  }
  set fixedFilters(value) {
    this._fixedFilters = value;
    this.setShipFromFacilities();
  }

  @Input() crmAccounts: CrmAccountEntity[] = [];

  shipFromControl = new FormControl();
  specShorthandControl = new FormControl();
  contractSupplierControl: FormControl = new FormControl();
  contractBrokerControl: FormControl = new FormControl();
  form: FormGroup;
  shipFromFacilitiesList: FacilityEntity[] = [];
  selectedShipFromFacilities: FacilityEntity[] = [];

  constructor(private facilitiesService: FacilitiesService) {}

  ngOnInit() {
    this.initForm();
    this.uiProducts = this.mapToFilterModel(Environment.getUiProducts());
    this.updateUiProductsSelection();
    this.initFormControls();
    this.handleFormControls();
  }

  public productGroupExpansionToggled = (productGroup, isExpanded) => {
    productGroup.isExpanded = isExpanded;
    this.updateProductGroupsFilter();
  };

  public productSelectionToggled(productName): void {
    productName.isSelected = productName.products.some(item => item.isSelected);
    this.updateProductGroupsFilter();
  }

  public inventoryStateToggled(): void {
    this.filters.inventoryTypes = this.inventoryTypes.filter(item => item.isSelected).map(item => item.key);
  }

  onContractStatusCheckboxToggle() {
    this.filters.contractStatuses = this.contractStatuses.filter(item => item.isSelected).map(item => item.key);
  }

  public productGroupSelectionToggled(productName): void {
    productName.products.map(item => (item.isSelected = productName.isSelected));
    this.updateProductGroupsFilter();
  }

  public updatePermissionsFilter(): void {
    this.filters.permissions = this.productLotPermissions.filter(item => item.isSelected).map(item => item.key);
  }

  public updateStatesFilter(): void {
    this.filters.states = this.productLotStates.filter(item => item.isSelected).map(item => item.key);
    this.setProductLotStates();
  }

  public removeFacility(facility: FacilityEntity): void {
    this.selectedShipFromFacilities = this.selectedShipFromFacilities.filter(item => item.id !== facility.id);
    this.setViewStateFacilities();
  }

  public ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.unsubscribe();
  }

  /*
   * private helpers
   * */
  private initForm() {
    this.form = new FormGroup({
      shipFromControl: this.shipFromControl,
      specShorthandControl: this.specShorthandControl,
      contractSupplier: this.contractSupplierControl,
      contractBroker: this.contractBrokerControl
    });
  }

  private onFiltersChanged(): void {
    this.updateUiProductsSelection();
    this.updateFiltersValues();
    this.updateInventoryTypes();
    this.setProductLotStates();
    this.setShipFromFacilities();
    this.specShorthandControl.setValue(this.filters.specShorthand); // TODO check when inventory bookmarks solved
  }

  private setShipFromFacilities(): void {
    this.selectedShipFromFacilities = this.shipFromFacilitiesList.filter(f =>
      this.filters.shipFromIds?.some(id => id === f.id)
    );
    if (this.fixedFilters?.shipFromId) {
      this.shipFromControl.setValue(this.fixedFilters.shipFromId);
      this.shipFromControl.disable({ emitEvent: false });
      if (this.filters) this.filters.shipFromIds = [this.fixedFilters.shipFromId];
    } else {
      this.shipFromControl.reset();
      this.shipFromControl.enable();
    }
  }

  private setProductLotStates(): void {
    const filterStates = this.filters.states;
    const isActiveSelected = !!filterStates?.length && filterStates.some(s => s !== ProductStateEnum.SOLD);
    const isSoldSelected = filterStates.some(s => s === ProductStateEnum.SOLD);
    this.productLotStates.forEach(item => {
      if (item.key === ProductStateEnum.SOLD) {
        item.isSelected = !isActiveSelected && isSoldSelected;
        item.excluded = !isActiveSelected && !isSoldSelected;
        item.disabled = isActiveSelected;
      } else {
        item.isSelected = filterStates && filterStates.some(s => s === item.key);
        item.disabled = isSoldSelected && !isActiveSelected;
      }
    });
  }

  private updateFiltersValues(): void {
    this.productLotPermissions.forEach(
      item => (item.isSelected = (this.filters.permissions || []).some(value => value === item.key))
    );
    this.contractStatuses.forEach(
      item => (item.isSelected = (this.filters.contractStatuses || []).some(status => status === item.key))
    );
  }

  private updateInventoryTypes() {
    this.inventoryTypes.forEach(
      item => (item.isSelected = (this.filters.inventoryTypes || []).some(type => item.key === type))
    );
  }

  private updateProductGroupsFilter(): void {
    this.filters.productGroups = this.uiProducts
      .filter(item => item.isSelected)
      .map(item => ({
        name: item.name,
        isExpanded: item.isExpanded,
        products: item.products.filter(product => product.isSelected).map(product => product.name)
      }));
  }

  private mapToFilterModel(uiProducts): any {
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

  private updateUiProductsSelection(): void {
    const selected = this.filters.productGroups;
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

  private initFormControls(): void {
    this.specShorthandControl.setValue(this.filters.specShorthand);
    this.specShorthandControl.setValidators([Validators.maxLength(100)]);
    this.contractSupplierControl.setValue(this.filters.contractSupplier);
    this.contractBrokerControl.setValue(this.filters.contractBroker);
    this.facilitiesService
      .getCompanyFacilities(Environment.getCurrentUser().companyId)
      .pipe(takeUntil(this.destroy$))
      .subscribe(facilities => {
        this.shipFromFacilitiesList = facilities;
        this.setShipFromFacilities();
        this.handleShipFromControlChange();
      });
  }

  private handleFormControls() {
    this.specShorthandControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(value => {
      if (this.specShorthandControl.valid) this.filters.specShorthand = value;
    });

    const supplierCtrl = this.form.get('contractSupplier');
    const brokerCtrl = this.form.get('contractBroker');

    supplierCtrl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(value => {
      this.filters.contractSupplier = value;

      if (value && brokerCtrl.enabled) {
        brokerCtrl.disable();
      } else if (!value && !brokerCtrl.enabled) {
        brokerCtrl.enable();
      }
    });

    brokerCtrl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(value => {
      this.filters.contractBroker = value;

      if (value && supplierCtrl.enabled) {
        supplierCtrl.disable();
      } else if (!value && !supplierCtrl.enabled) {
        supplierCtrl.enable();
      }
    });
  }

  private handleShipFromControlChange() {
    this.shipFromControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(facilityId => {
      if (!facilityId) return;

      const facility = this.shipFromFacilitiesList.find(item => item.id === facilityId);

      if (!facility) return;

      if (!this.filters.shipFromIds?.some(x => x === facilityId)) {
        this.filters.shipFromIds
          ? this.filters.shipFromIds.push(facilityId)
          : (this.filters.shipFromIds = [facilityId]);
      }
      if (!this.selectedShipFromFacilities.some(item => item.id === facility.id)) {
        this.selectedShipFromFacilities.push(facility);
      }
      this.setViewStateFacilities();
    });
  }

  private setViewStateFacilities(): void {
    this.filters.shipFromIds = this.selectedShipFromFacilities.map(f => f.id);
  }
}
