import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { APBill, APLineItem } from '@services/app-layer/entities/accounts-payable';
import { AccountEntity } from '@services/app-layer/entities/account';
import { Environment } from '@services/app-layer/app-layer.environment';

@Component({
  selector: 'app-ap-line-item-form',
  templateUrl: './ap-line-item-form.component.html',
  styleUrls: ['./ap-line-item-form.component.scss']
})
export class APLineItemFormComponent implements OnInit, OnDestroy {
  @Input() parentForm: FormGroup;
  @Input() accounts: AccountEntity[] = [];
  @Input() bill: APBill;
  @Input() editMode = false;
  @Input() set lineItemData(value: APLineItem) {
    this._lineItemData = value;
  }
  get lineItemData(): APLineItem {
    return this._lineItemData;
  }

  constructor(private fb: FormBuilder) {}

  private _lineItemData: APLineItem;

  public form: FormGroup;

  public initialData: APLineItem;

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
    const config = {
      quantity: [null, [Validators.required, Validators.min(1), Validators.max(Environment.maxSafeNumber)]],
      amount: [0, [Validators.required, Validators.min(0), Validators.max(Environment.maxSafeNumber)]],
      account: [null, [Validators.required, this.archivedAccountValidator]],
      description: ['', Validators.required]
    };

    this.form = this.fb.group(config);
  }

  private setInitialData(): void {
    const { account } = this.lineItemData;
    this.accounts = this.accounts.filter(item => item.id === account || (!item.system && !item.archived));

    this.form.patchValue(this.lineItemData);
  }

  private extendParentFormGroup(): void {
    this.parentForm.addControl('lineItem', this.form || new FormGroup({}));
  }

  private removeCurrentFormControl(): void {
    this.parentForm.removeControl('lineItem');
  }
}
