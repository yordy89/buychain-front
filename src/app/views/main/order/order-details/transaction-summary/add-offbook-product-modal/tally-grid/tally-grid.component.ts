import { Component, OnInit, Input, EventEmitter, Output, OnDestroy } from '@angular/core';
import { FormGroup, FormArray, FormBuilder, Validators } from '@angular/forms';
import { FABAction, TableAction } from '@app/models';
import { CrmAccountEntity, CrmLocationEntity } from '@services/app-layer/entities/crm';
import { ProductsHelper } from '@services/app-layer/products/products-helper';
import { FormGroupHelper } from '@services/helpers/utils/form-group-helper';
import { IntegerValidator } from '@validators/integer.validator/integer.validator';
import { addDays } from 'date-fns';
import { Environment } from '@services/app-layer/app-layer.environment';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { DateValidator } from '@validators/date.validator/date.validator';

enum Actions {
  APPLY_TO_ALL,
  CREATE_TEMPLATE,
  DELETE
}

enum FABActions {
  CREATE_TEMPLATES,
  DELETE,
  CLEAR_ALL
}

@Component({
  selector: 'app-tally-grid',
  templateUrl: './tally-grid.component.html',
  styleUrls: ['./tally-grid.component.scss']
})
export class TallyGridComponent implements OnInit, OnDestroy {
  @Input() crmAccounts: CrmAccountEntity[];
  @Input() crmLocations: CrmLocationEntity[];
  @Output() templates = new EventEmitter();

  tallyForm: FormGroup;
  tallyFormItems: FormArray;

  hasCheckedRow = false;
  fabActions: FABAction[] = [];

  readonly actions: TableAction[] = [
    {
      label: 'Create Template',
      icon: 'add_box',
      value: Actions.CREATE_TEMPLATE
    },
    {
      label: 'Apply to All Below',
      icon: 'low_priority',
      value: Actions.APPLY_TO_ALL
    },
    {
      label: 'Delete',
      icon: 'delete',
      color: 'warn',
      value: Actions.DELETE,
      prompt: {
        title: 'Confirm please!',
        text: 'Are you sure you want to delete Tally?'
      }
    }
  ];

  private navigateToLastRow = new Subject<void>();
  private destroy$ = new Subject<void>();

  constructor(private formBuilder: FormBuilder) {}

  ngOnInit() {
    this.initForm();
    this.initFABTableActions();
    this.handleNavigationToLastRow();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  addItem(
    specShorthand,
    specs,
    quantity,
    unitPieceCount,
    listPricePerUoM,
    priceSystem,
    shipWeek,
    crmAccountId,
    crmLocationId
  ) {
    const tallyItemFromGroup = this.formBuilder.group({
      ...this.commonFormConfig(specs, priceSystem, specShorthand, quantity, unitPieceCount, listPricePerUoM, shipWeek),
      crmAccountId: [crmAccountId, Validators.required],
      crmLocationId: [crmLocationId, Validators.required]
    });

    this.handleTallyItemFormGroupChange(tallyItemFromGroup);

    tallyItemFromGroup.controls.crmAccountId.valueChanges.subscribe(accountId => {
      if (!accountId) return;
      const crmAccount = this.crmAccounts.find(x => x.id === accountId);
      this.loadAccountLocations(crmAccount);
      const defaultSelection = crmAccount.locations && crmAccount.locations.length ? crmAccount.locations[0].id : null;
      tallyItemFromGroup.controls.crmLocationId.setValue(defaultSelection);
    });

    this.tallyFormItems.push(tallyItemFromGroup);
    this.navigateToLastRow.next();
  }

  addItemFromTemplate(
    specShorthand,
    specs,
    unitPieceCount,
    listPricePerUoM,
    priceSystem,
    shipWeek,
    mfgFacilityShortName,
    offlineData
  ) {
    const tallyItemFromGroup = this.formBuilder.group({
      ...this.commonFormConfig(specs, priceSystem, specShorthand, null, unitPieceCount, listPricePerUoM, shipWeek),
      mfgFacilityShortName: mfgFacilityShortName,
      offlineData: offlineData
    });

    this.handleTallyItemFormGroupChange(tallyItemFromGroup);

    this.tallyFormItems.push(tallyItemFromGroup);
    this.navigateToLastRow.next();
  }

  private handleTallyItemFormGroupChange(tallyItemFromGroup) {
    tallyItemFromGroup.controls.priceSystem.valueChanges.subscribe(newPriceSystem => {
      if (!newPriceSystem) return;
      tallyItemFromGroup.controls.unitOfMeasure.setValue(
        ProductsHelper.getMeasureLabel({ priceSystem: newPriceSystem })
      );
    });
  }

  private commonFormConfig(specs, priceSystem, specShorthand, quantity, unitPieceCount, listPricePerUoM, shipWeek) {
    const maxQuantityValid = specs.cutTypes === Environment.randomLengthCutType ? [] : [Validators.max(100)];

    return {
      specs: specs,
      unitOfMeasure: ProductsHelper.getMeasureLabel({ priceSystem }),
      specShorthand: specShorthand,
      isRandomLengthProduct: specs.cutTypes === Environment.randomLengthCutType,
      quantity: [quantity, [Validators.required, Validators.min(1), IntegerValidator(), ...maxQuantityValid]],
      unitPieceCount: [unitPieceCount, [Validators.required, Validators.min(1), IntegerValidator()]],
      listPricePerUoM: [listPricePerUoM, [Validators.required, Validators.min(0)]],
      priceSystem: [priceSystem, Validators.required],
      shipWeek: [shipWeek, [Validators.required, DateValidator({ min: new Date(this.tomorrowDate()) })]],
      selected: false
    };
  }

  deleteItem(index) {
    this.tallyFormItems.removeAt(index);
  }

  clearAll() {
    this.tallyFormItems.reset();
  }

  getItems(): any[] {
    return this.tallyFormItems.value;
  }

  markAllTouched() {
    this.markFormGroupTouched(this.tallyForm);
  }

  isAllValid() {
    return this.tallyForm.valid;
  }

  isInvalidField(control) {
    return FormGroupHelper.isInvalidField(control);
  }

  applyToAllBelow(currentRowIndex) {
    const current = this.tallyFormItems.at(currentRowIndex);
    for (let index = currentRowIndex + 1; index < this.tallyFormItems.length; index++) {
      const next = this.tallyFormItems.at(index);
      next.patchValue({
        listPricePerUoM: current.value.listPricePerUoM,
        unitPieceCount: current.value.unitPieceCount,
        quantity: current.value.quantity,
        shipWeek: current.value.shipWeek,
        priceSystem: current.value.priceSystem,
        crmAccountId: current.value.crmAccountId,
        crmLocationId: current.value.crmLocationId
      });
    }
  }

  getCrmAccountLocations(crmAccountId) {
    if (!this.crmLocations?.length) return [];
    return this.crmLocations.filter(x => x.crmAccountId === crmAccountId);
  }

  tomorrowDate() {
    return addDays(new Date(), 1).toISOString().substring(0, 10);
  }

  onTableAction(value: Actions, index: number) {
    switch (value) {
      case Actions.CREATE_TEMPLATE:
        this.createTemplate(index);
        break;

      case Actions.APPLY_TO_ALL:
        this.applyToAllBelow(index);
        break;

      case Actions.DELETE:
        this.deleteItem(index);
        break;
    }
  }

  onFABAction(value: FABActions) {
    switch (value) {
      case FABActions.CREATE_TEMPLATES:
        this.createTemplates();
        break;

      case FABActions.DELETE:
        this.deleteItems();
        break;

      case FABActions.CLEAR_ALL:
        this.clearSelection();
        break;
    }
  }

  /*
   * private helpers
   * */
  private handleNavigationToLastRow() {
    this.navigateToLastRow
      .asObservable()
      .pipe(debounceTime(100), takeUntil(this.destroy$))
      .subscribe(() => {
        const rows = document.querySelectorAll('app-tally-grid .body-row');
        if (!rows.length) {
          return;
        }
        const element = rows.item(rows.length - 1);

        element.scrollIntoView({ behavior: 'smooth' });
      });
  }

  private createTemplate(index) {
    const control = this.tallyFormItems.at(index);
    this.templates.emit([control.value]);
  }

  private createTemplates() {
    const items = this.tallyFormItems.controls.map(item => item.value).filter(item => item.selected);
    this.templates.emit(items);
  }

  private deleteItems() {
    this.tallyFormItems.controls
      .map((item, index) => (item.value.selected ? index : null))
      .filter(val => val !== null)
      .reverse()
      .forEach(index => this.tallyFormItems.removeAt(index));
  }

  private clearSelection() {
    this.tallyFormItems.controls.forEach(item => {
      item.patchValue({ selected: false });
    });
  }

  private initFABTableActions() {
    this.fabActions = [
      {
        label: 'Create Templates',
        icon: 'add_box',
        value: FABActions.CREATE_TEMPLATES
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
          text: 'Are you sure you want to delete selected Tally items?'
        }
      }
    ];
  }

  private initForm() {
    this.tallyFormItems = this.formBuilder.array([], Validators.required);
    this.tallyForm = this.formBuilder.group({
      items: this.tallyFormItems
    });

    this.tallyFormItems.valueChanges.subscribe(data => {
      this.hasCheckedRow = data.some(item => item.selected);
    });
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    (<any>Object).values(formGroup.controls).forEach(control => {
      control.markAsTouched();

      if (control.controls) {
        this.markFormGroupTouched(control);
      }
    });
  }

  private loadAccountLocations(account) {
    if (account.locations && account.locations.length) return;
    account.locations = this.getCrmAccountLocations(account.id);
  }

  getAllowedPriceSystemsForProduct(productName): string[] {
    const uiProducts = Environment.getUiProducts().productGroups;
    const productsList = uiProducts.reduce((acc, cur) => [...acc, ...cur.products], []);
    const selectedProduct = productsList.find(p => p.name === productName);
    return selectedProduct?.priceSystems || [];
  }
}
