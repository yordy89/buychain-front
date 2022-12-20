import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { ObjectUtil } from '@services/helpers/utils/object-util';
import {
  ContractStateEnum,
  ProductLotPermissionEnum,
  ProductPurchaseMethod,
  ProductStateEnum
} from '@services/app-layer/app-layer.enums';
import { CrmAccountEntity } from '@services/app-layer/entities/crm';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { FacilityEntity } from '@services/app-layer/entities/facility';
import { MemberEntity } from '@services/app-layer/entities/member';
import { Environment } from '@services/app-layer/app-layer.environment';
import { takeUntil } from 'rxjs/operators';
import { FacilitiesService } from '@services/app-layer/facilities/facilities.service';
import { CompaniesService } from '@services/app-layer/companies/companies.service';
import { CrmService } from '@services/app-layer/crm/crm.service';
import { FormGroupHelper } from '@services/helpers/utils/form-group-helper';

@Component({
  selector: 'app-inventory-streamline-filters',
  templateUrl: './inventory-streamline-filters.component.html',
  styleUrls: ['./inventory-streamline-filters.component.scss']
})
export class InventoryStreamlineFiltersComponent implements OnInit, OnDestroy {
  @Input() filtersState: { [key: string]: boolean };
  private destroy$ = new Subject<void>();

  readonly inventoryTypes = [ProductPurchaseMethod.CASH, ProductPurchaseMethod.CONTRACT].map(key => ({
    key,
    isSelected: false
  }));
  productLotStates = ObjectUtil.enumToArray(ProductStateEnum)
    .map(key => ({ key, isSelected: false }))
    .filter(s => s.key !== ProductStateEnum.SOLD);
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
    this.setFilters();
  }

  private _fixedFilters: any;
  @Input() get fixedFilters(): any {
    return this._fixedFilters;
  }
  set fixedFilters(value) {
    this._fixedFilters = value;
    if (value?.shipFromId) {
      this.shipFromControl.setValue(value?.shipFromId);
      this.shipFromControl.disable();
    } else this.shipFromControl.enable();
  }

  form: FormGroup;
  shipFromControl: FormControl = new FormControl('', [Validators.required]);
  specShorthandControl: FormControl = new FormControl('', [Validators.maxLength(100)]);
  contractSupplierControl: FormControl = new FormControl();
  contractBrokerControl: FormControl = new FormControl();

  shipFromFacilitiesList: FacilityEntity[] = [];
  membersList: MemberEntity[] = [];
  crmAccounts: CrmAccountEntity[];

  constructor(
    private facilitiesService: FacilitiesService,
    private companiesService: CompaniesService,
    private crmService: CrmService
  ) {}

  ngOnInit(): void {
    this.createForm();
    this.initUIProducts();
    this.loadSupportingData();
    this.setFilters();

    if (this.shipFromControl.invalid) FormGroupHelper.markControlTouchedAndDirty(this.shipFromControl);
  }

  public ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.unsubscribe();
  }

  public productGroupExpansionToggled(productGroup, isExpanded): void {
    productGroup.isExpanded = isExpanded;
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
    const selected = this.uiProducts.find(item => item.isSelected);
    this.filters.productGroup = {
      name: selected.name,
      isExpanded: selected.isExpanded,
      products: selected.products.filter(product => product.isSelected).map(product => product.name)
    };
  }

  updateStatesFilter(): void {
    this.filters.states = this.productLotStates.filter(item => item.isSelected).map(item => item.key);
  }
  updatePermissionsFilter(): void {
    this.filters.permissions = this.productLotPermissions.filter(item => item.isSelected).map(item => item.key);
  }
  inventoryStateToggled(): void {
    this.filters.inventoryTypes = this.inventoryTypes.filter(item => item.isSelected).map(item => item.key);
  }
  onContractStatusCheckboxToggle() {
    this.filters.contractStatuses = this.contractStatuses.filter(item => item.isSelected).map(item => item.key);
  }

  private setFilters(): void {
    this.shipFromControl.setValue(this.fixedFilters?.shipFromId || this.filters.shipFromId);
    this.specShorthandControl.setValue(this.filters.specShorthand);
    this.contractSupplierControl.setValue(this.filters.contractSupplier);
    this.contractBrokerControl.setValue(this.filters.contractBroker);
    this.updateUiProductsSelection();
    this.updateFiltersValues();
  }

  private updateFiltersValues(): void {
    this.productLotPermissions.forEach(
      item => (item.isSelected = (this.filters.permissions || []).some(value => value === item.key))
    );
    this.productLotStates.forEach(
      item => (item.isSelected = (this.filters.states || []).some(value => value === item.key))
    );
    this.contractStatuses.forEach(
      item => (item.isSelected = (this.filters.contractStatuses || []).some(status => status === item.key))
    );
    this.inventoryTypes.forEach(
      item => (item.isSelected = (this.filters.inventoryTypes || []).some(type => item.key === type))
    );
  }

  private createForm(): void {
    this.form = new FormGroup({
      shipFromControl: this.shipFromControl,
      specShorthandControl: this.specShorthandControl,
      contractSupplier: this.contractSupplierControl,
      contractBroker: this.contractBrokerControl
    });
    this.handleControlsValueChange();
  }
  private handleControlsValueChange() {
    this.shipFromControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(facilityId => (this.filters.shipFromId = facilityId || ''));
    this.specShorthandControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => (this.filters.specShorthand = value || ''));

    this.contractSupplierControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(value => {
      this.filters.contractSupplier = value;
      if (value && this.contractBrokerControl.enabled) this.contractBrokerControl.disable();
      else if (!value && !this.contractBrokerControl.enabled) this.contractBrokerControl.enable();
    });

    this.contractBrokerControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(value => {
      this.filters.contractBroker = value;
      if (value && this.contractSupplierControl.enabled) this.contractSupplierControl.disable();
      else if (!value && !this.contractSupplierControl.enabled) this.contractSupplierControl.enable();
    });
  }

  private initUIProducts() {
    this.uiProducts = this.mapToFilterModel(Environment.getUiProducts());
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
    const selected = this.filters.productGroup;
    this.uiProducts.forEach(group => {
      const selectedGroup = selected.name === group.name;
      group.isSelected = selectedGroup;
      group.isExpanded = selectedGroup && selected.isExpanded;
      if (selectedGroup) {
        group.products.forEach(product => (product.isSelected = selected.products.some(name => name === product.name)));
      }
    });
  }

  private loadSupportingData(): void {
    this.facilitiesService
      .getCompanyFacilities(Environment.getCurrentUser().companyId)
      .pipe(takeUntil(this.destroy$))
      .subscribe(facilities => (this.shipFromFacilitiesList = facilities));
    this.companiesService
      .getCompanyCompleteMembers()
      .pipe(takeUntil(this.destroy$))
      .subscribe(members => (this.membersList = members));
    this.crmService
      .getAccounts(false)
      .pipe(takeUntil(this.destroy$))
      .subscribe(accounts => (this.crmAccounts = accounts));
  }
}
