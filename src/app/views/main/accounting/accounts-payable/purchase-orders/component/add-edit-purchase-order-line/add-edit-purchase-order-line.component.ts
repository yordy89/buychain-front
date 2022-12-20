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
import { APLineItem } from '@services/app-layer/entities/accounts-payable';
import { ObjectUtil } from '@services/helpers/utils/object-util';
import { of, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { FormGroupHelper } from '@services/helpers/utils/form-group-helper';
import { DialogModalComponent, DialogType } from '@components/common/modals/dialog-modal/dialog-modal.component';
import { MatDialog } from '@angular/material/dialog';
import { AutocompleteComponent } from '@directives/autocomplete/autocomplete.component';
import { PurchaseOrdersService } from '@views/main/accounting/accounts-payable/purchase-orders/purchase-orders.service';
import { PurchaseOrdersApiService } from '@services/app-layer/purchase-orders/purchase-orders-api.service';

@Component({
  selector: 'app-add-edit-purchase-order-line',
  templateUrl: 'add-edit-purchase-order-line.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddEditPurchaseOrderLineComponent implements OnInit, OnDestroy {
  @Input() data: APLineItem;
  @Input() accounts: AccountEntity[] = [];
  @Input() editMode = false;

  @Output() back = new EventEmitter<void>();

  @ViewChildren(AutocompleteComponent) autocompleteItems: QueryList<AutocompleteComponent>;

  form: FormGroup;

  initialFormValue = {};
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private purchaseOrdersService: PurchaseOrdersService,
    private purchaseOrdersApiService: PurchaseOrdersApiService,
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
            title: 'Confirm please!',
            content: 'Are you sure you want to Cancel? All unsaved data will be lost.'
          }
        })
        .afterClosed();
    }

    obs.pipe(takeUntil(this.destroy$)).subscribe(confirm => {
      if (!confirm) {
        return;
      }

      this.back.emit();
    });
  }

  private generatePayload() {
    const payload = ObjectUtil.deleteEmptyProperties(this.getChangedValues(), true);

    const billId = this.route.snapshot.queryParamMap.get('billId');

    if (billId) {
      return {
        billLineItem: payload
      };
    }

    return {
      openLineItem: payload
    };
  }

  private onSaveSuccess = res => {
    if (res) {
      this.back.emit();
    }
  };

  private addLineItem(payload) {
    const purchaseOrderId = this.route.snapshot.paramMap.get('id');

    this.purchaseOrdersApiService
      .addPurchaseOrderOpenLineItem(purchaseOrderId, payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe(this.onSaveSuccess);
  }

  private editLineItem(payload) {
    const billId = this.route.snapshot.queryParamMap.get('billId');
    const purchaseOrderId = this.route.snapshot.paramMap.get('id');
    const lineId = this.route.snapshot.paramMap.get('lineId');

    this.purchaseOrdersService
      .editLineItem(purchaseOrderId, lineId, payload, billId)
      .pipe(takeUntil(this.destroy$))
      .subscribe(this.onSaveSuccess);
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

    if (ObjectUtil.isEmptyObject(this.getChangedValues())) {
      this.back.emit();
      return;
    }

    if (this.editMode) {
      this.editLineItem(this.generatePayload());
    } else {
      this.addLineItem(this.generatePayload());
    }
  }

  private createForm() {
    this.form = new FormGroup({});
  }
}
