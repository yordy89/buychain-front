import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Inject,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChildren
} from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AccountsService } from '@services/app-layer/accounts/accounts.service';
import { AccountEntity } from '@services/app-layer/entities/account';
import { ARLineItem } from '@services/app-layer/entities/accounts-receivable';
import { ObjectUtil } from '@services/helpers/utils/object-util';
import { of, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { FormGroupHelper } from '@services/helpers/utils/form-group-helper';
import { DialogModalComponent, DialogType } from '@components/common/modals/dialog-modal/dialog-modal.component';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { AutocompleteComponent } from '@directives/autocomplete/autocomplete.component';
import { ARLineItemsOriginEnum } from '@services/app-layer/app-layer.enums';
import { SalesOrdersApiService } from '@services/app-layer/sales-orders/sales-orders-api.service';

export interface AddEditOpenLineItemModalData {
  salesOrderId: string;
  lineItem?: ARLineItem;
  accounts: AccountEntity[];
  editMode?: boolean;
}

@Component({
  selector: 'app-add-edit-open-line-item-modal',
  templateUrl: 'add-edit-open-line-item-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddEditOpenLineItemModalComponent implements OnInit, OnDestroy {
  @ViewChildren(AutocompleteComponent) autocompleteItems: QueryList<AutocompleteComponent>;

  form: FormGroup;

  initialFormValue = {};
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private salesOrdersApiService: SalesOrdersApiService,
    private router: Router,
    private fb: FormBuilder,
    private accountsService: AccountsService,
    private cd: ChangeDetectorRef,
    private dialog: MatDialog,
    private dialogRef: MatDialogRef<AddEditOpenLineItemModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AddEditOpenLineItemModalData
  ) {}

  ngOnInit() {
    this.createForm();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  public close(data?: ARLineItem, adding?: boolean): void {
    this.dialogRef.close({ lineItem: data, adding });
  }

  private getChangedValues() {
    return FormGroupHelper.getChangedValues(this.form.value, this.initialFormValue);
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
      if (confirm) {
        this.close();
      }
    });
  }

  private generatePayload() {
    const { receivable, ...rest } = this.form.value.lineItem;

    const payload = ObjectUtil.deleteEmptyProperties(
      {
        ...rest,
        origin: ARLineItemsOriginEnum.AR_MODULE,
        receivable: receivable?.revenueAccount || receivable?.wipAccount ? receivable : null
      },
      true
    );

    return {
      openLineItem: payload
    };
  }

  private addLineItem() {
    const payload = this.generatePayload();
    this.salesOrdersApiService
      .addSalesOrderOpenLineItem(this.data.salesOrderId, payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe(res => {
        const createdLineItem = res.openLineItems.pop();
        this.close(createdLineItem, true);
      });
  }

  private editLineItem() {
    const payload = this.generatePayload();
    const lineItemId = this.data.lineItem.id;

    this.salesOrdersApiService
      .editSalesOrderOpenLineItem(this.data.salesOrderId, lineItemId, payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe(res => {
        const updatedLineItem = res.openLineItems.find(item => item.id === lineItemId);
        this.close(updatedLineItem, false);
      });
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

    if (this.data.editMode) {
      this.editLineItem();
    } else {
      this.addLineItem();
    }
  }

  private createForm() {
    this.form = new FormGroup({});
  }
}
