import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { ARInvoice, ARLineItem } from '@services/app-layer/entities/accounts-receivable';
import { ARInvoiceStateEnum, ARLineItemTypeEnum } from '@services/app-layer/app-layer.enums';
import { AccountEntity } from '@services/app-layer/entities/account';
import { ObjectUtil } from '@services/helpers/utils/object-util';
import { Environment } from '@services/app-layer/app-layer.environment';

@Component({
  selector: 'app-ar-line-item-form',
  templateUrl: './ar-line-item-form.component.html',
  styleUrls: ['./ar-line-item-form.component.scss']
})
export class ARLineItemFormComponent implements OnInit, OnDestroy {
  @Input() parentForm: FormGroup;
  @Input() accounts: AccountEntity[] = [];
  @Input() invoice: ARInvoice;
  @Input() editMode = false;
  @Input() set lineItemData(value: ARLineItem) {
    this._lineItemData = value;
  }
  get lineItemData(): ARLineItem {
    return this._lineItemData;
  }

  constructor(private fb: FormBuilder) {}

  private _lineItemData: ARLineItem;

  public form: FormGroup;
  receivableFormGroup: FormGroup;
  revenueAccount: FormControl;
  wipAccount: FormControl;
  receivableAmount: FormControl;

  costOfSaleFormGroup: FormGroup;
  cogAccount: FormControl;
  valueAccount: FormControl;
  costOfSaleAmount: FormControl;

  public initialData: ARLineItem;

  readonly types = ObjectUtil.enumToArray(ARLineItemTypeEnum);
  private destroy$ = new Subject<void>();

  ngOnInit() {
    this.initForm();
    this.extendParentFormGroup();
    if (this.editMode) {
      this.setInitialData();
    } else {
      this.accounts = this.accounts.filter(item => !item.system && !item.archived);
    }
  }

  public ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.unsubscribe();
    this.removeCurrentFormControl();
  }

  archivedAccountValidator = (control: FormControl) =>
    this.isArchivedAccount(control.value) ? { system: 'Archived account is not allowed' } : null;

  isArchivedAccount(accountId: string) {
    return this.accounts.find(item => item.id === accountId)?.archived || false;
  }

  private initForm() {
    this.revenueAccount = new FormControl(null, [Validators.required, this.archivedAccountValidator]);
    this.wipAccount = new FormControl(null, [Validators.required, this.archivedAccountValidator]);
    this.receivableAmount = new FormControl(0, [
      Validators.required,
      Validators.min(0),
      Validators.max(Environment.maxSafeNumber)
    ]);

    this.cogAccount = new FormControl(null, [Validators.required, this.archivedAccountValidator]);
    this.valueAccount = new FormControl(null, [Validators.required, this.archivedAccountValidator]);
    this.costOfSaleAmount = new FormControl(0, [
      Validators.required,
      Validators.min(0),
      Validators.max(Environment.maxSafeNumber)
    ]);

    this.receivableFormGroup = new FormGroup({
      revenueAccount: this.revenueAccount,
      wipAccount: this.wipAccount,
      amount: this.receivableAmount,
      currency: new FormControl('USD')
    });

    this.costOfSaleFormGroup = new FormGroup({
      cogAccount: this.cogAccount,
      valueAccount: this.valueAccount,
      amount: this.costOfSaleAmount,
      currency: new FormControl('USD')
    });

    const config = {
      type: ['', Validators.required],
      quantity: [null, [Validators.required, Validators.min(1), Validators.max(Environment.maxIntegerSafeNumber)]],
      receivable: this.receivableFormGroup,
      costOfSale: this.costOfSaleFormGroup,
      poRef: [{ value: null, disabled: true }, Validators.required],
      description: ['', [Validators.required, Validators.maxLength(500)]]
    };

    this.form = this.fb.group(config);
    this.form
      .get('type')
      .valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(type => this.onTypeChange(type));
    this.revenueAccount.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(revenueAccount => this.onReceivableAccountChange(revenueAccount, this.wipAccount));
    this.wipAccount.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(wipAccount => this.onReceivableAccountChange(wipAccount, this.revenueAccount));
  }

  private onTypeChange(type: ARLineItemTypeEnum) {
    if (type === ARLineItemTypeEnum.INTERNAL_EXPENSE) {
      this.receivableFormGroup.disable();
      this.receivableFormGroup.reset({ amount: 0, currency: 'USD' });
    } else if (type === ARLineItemTypeEnum.CUSTOMER_PAID_EXPENSE) {
      this.enableReceivableAccountControl(this.revenueAccount, this.wipAccount);
      this.enableReceivableAccountControl(this.wipAccount, this.revenueAccount);
      this.receivableAmount.enable();
      this.receivableFormGroup.get('currency').enable();
      this.receivableAmount.setValidators([Validators.min(0), Validators.max(Environment.maxSafeNumber)]);
    } else {
      this.enableReceivableAccountControl(this.revenueAccount, this.wipAccount, true);
      this.enableReceivableAccountControl(this.wipAccount, this.revenueAccount, true);
      this.receivableAmount.enable();
      this.receivableFormGroup.get('currency').enable();
      this.receivableAmount.setValidators([
        Validators.required,
        Validators.min(0),
        Validators.max(Environment.maxSafeNumber)
      ]);
    }
  }

  private onReceivableAccountChange(account, formControl: FormControl) {
    const isNotInternalExpense = this.form.get('type').value !== ARLineItemTypeEnum.INTERNAL_EXPENSE;
    this.receivableAmount.setValidators([
      Validators.required,
      Validators.min(0),
      Validators.max(Environment.maxSafeNumber)
    ]);
    if (account && !formControl.disabled) {
      formControl.clearValidators();
      formControl.disable();
    } else if (isNotInternalExpense && !account && formControl.disabled) {
      formControl.enable();
      formControl.setValidators([Validators.required, this.archivedAccountValidator]);
    }
  }

  private enableReceivableAccountControl(formControl: FormControl, relatedFormControl: FormControl, require = false) {
    if (!relatedFormControl?.value) {
      formControl.enable();

      if (require) {
        formControl.setValidators([Validators.required]);
      } else {
        formControl.clearValidators();
      }
    }
  }

  private setInitialData(): void {
    const { receivable, costOfSale } = this.lineItemData;
    const accountIds = [
      receivable?.revenueAccount,
      receivable?.wipAccount,
      costOfSale?.cogAccount,
      costOfSale?.valueAccount
    ];
    this.accounts = this.accounts.filter(item => accountIds.includes(item.id) || (!item.system && !item.archived));

    this.form.patchValue(this.lineItemData);
  }

  private extendParentFormGroup(): void {
    this.parentForm.addControl('lineItem', this.form || new FormGroup({}));
  }

  private removeCurrentFormControl(): void {
    this.parentForm.removeControl('lineItem');
  }

  typeOptionDisabledTooltip(type: ARLineItemTypeEnum) {
    switch (type) {
      case ARLineItemTypeEnum.INVENTORY:
        return 'Inventory is not available for manual entry';
      case ARLineItemTypeEnum.SERVICE:
      case ARLineItemTypeEnum.CUSTOMER_PAID_EXPENSE: {
        const currentInvoiceState = this.invoice?.state;
        if (currentInvoiceState === ARInvoiceStateEnum.ISSUED) {
          return 'Only INTERNAL_EXPENSE line item is accepted for invoice in ISSUED state.';
        }
        break;
      }
      default:
        return null;
    }
  }
}
