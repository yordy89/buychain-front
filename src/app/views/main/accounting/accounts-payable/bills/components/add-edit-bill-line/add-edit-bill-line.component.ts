import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  QueryList,
  ViewChildren
} from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AccountsService } from '@services/app-layer/accounts/accounts.service';
import { AccountEntity } from '@services/app-layer/entities/account';
import { APBill, APLineItem } from '@services/app-layer/entities/accounts-payable';
import { ObjectUtil } from '@services/helpers/utils/object-util';
import { of, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { FormGroupHelper } from '@services/helpers/utils/form-group-helper';
import { DialogModalComponent, DialogType } from '@components/common/modals/dialog-modal/dialog-modal.component';
import { MatDialog } from '@angular/material/dialog';
import { AutocompleteComponent } from '@directives/autocomplete/autocomplete.component';
import { BillsService } from '@views/main/accounting/accounts-payable/bills/bills.service';
import { BillsApiService } from '@services/app-layer/bills/bills-api.services';

@Component({
  selector: 'app-add-edit-bill-line',
  templateUrl: 'add-edit-bill-line.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddEditBillLineComponent implements OnInit, OnDestroy {
  @Input() data: APLineItem;
  @Input() accounts: AccountEntity[] = [];
  @Input() bill: APBill;
  @Input() editMode = false;

  @Output() back = new EventEmitter<void>();

  @ViewChildren(AutocompleteComponent) autocompleteItems: QueryList<AutocompleteComponent>;

  form: FormGroup;

  initialFormValue = {};
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private billsService: BillsService,
    private billsApiService: BillsApiService,
    private router: Router,
    private fb: FormBuilder,
    private accountsService: AccountsService,
    private cd: ChangeDetectorRef,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.createForm();
    if (this.editMode) {
      this.setInitialData();
    }
  }

  private setInitialData(): void {
    const { quantity, amount, account, description } = this.data;
    this.initialFormValue = { quantity, amount, account, description };
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  archivedAccountValidator = (control: FormControl) =>
    this.isArchivedAccount(control.value) ? { system: 'Archived account is not allowed' } : null;

  isArchivedAccount(accountId: string) {
    return this.accounts.find(item => item.id === accountId)?.archived || false;
  }

  private getChangedValues() {
    return FormGroupHelper.getChangedValues(this.form.value.lineItem, this.initialFormValue);
  }

  onCancel() {
    let obs = of(true);
    const changedValues = this.getChangedValues();

    if (this.form.dirty && !ObjectUtil.isEmptyObject(changedValues)) {
      obs = this.dialog
        .open(DialogModalComponent, {
          width: '450px',
          disableClose: true,
          data: {
            type: DialogType.Confirm,
            content: 'Are you sure you want to Cancel? All unsaved data will be lost.'
          }
        })
        .afterClosed();
    }

    obs.pipe(takeUntil(this.destroy$)).subscribe(confirm => {
      this.allowEmitBack(confirm);
    });
  }

  get billId() {
    const isFromPurchaseOrder = this.router.url.includes('purchase-orders');
    const paramName = isFromPurchaseOrder ? 'billId' : 'id';
    return this.route.snapshot.paramMap.get(paramName);
  }

  private addLineItem(payload) {
    this.billsApiService
      .addBillLineItem(this.billId, payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe(res => {
        this.allowEmitBack(res);
      });
  }

  private editLineItem(payload) {
    const lineId = this.route.snapshot.paramMap.get('lineId');

    this.billsApiService
      .editBillLineItem(this.billId, lineId, payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe(res => {
        this.allowEmitBack(res);
      });
  }

  private allowEmitBack(value) {
    if (value) {
      this.back.emit();
    }
  }

  onSubmit() {
    if (!this.form.valid) {
      this.autocompleteItems.forEach(item => {
        FormGroupHelper.markControlTouchedAndDirty(item.formControl);
        item.formControl.updateValueAndValidity();
      });
      FormGroupHelper.markTouchedAndDirty(this.form);
      return;
    }

    const payload = {
      billLineItem: ObjectUtil.deleteEmptyProperties(this.getChangedValues(), true)
    };

    if (ObjectUtil.isEmptyObject(payload.billLineItem)) {
      this.back.emit();
      return;
    }

    if (this.editMode) {
      this.editLineItem(payload);
    } else {
      this.addLineItem(payload);
    }
  }

  private createForm() {
    this.form = new FormGroup({});
  }
}
