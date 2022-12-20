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
import { ARLineItem } from '@services/app-layer/entities/accounts-receivable';
import { ObjectUtil } from '@services/helpers/utils/object-util';
import { SalesOrdersService } from '@views/main/accounting/accounts-receivable/sales-orders/sales-orders.service';
import { of, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { FormGroupHelper } from '@services/helpers/utils/form-group-helper';
import { DialogModalComponent, DialogType } from '@components/common/modals/dialog-modal/dialog-modal.component';
import { MatDialog } from '@angular/material/dialog';
import { AutocompleteComponent } from '@directives/autocomplete/autocomplete.component';
import { ARLineItemsOriginEnum } from '@services/app-layer/app-layer.enums';

@Component({
  selector: 'app-add-edit-sales-order-line',
  templateUrl: 'add-edit-sales-order-line.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddEditSalesOrderLineComponent implements OnInit, OnDestroy {
  @Input() data: ARLineItem;
  @Input() accounts: AccountEntity[] = [];
  @Input() editMode = false;

  @Output() back = new EventEmitter<void>();

  @ViewChildren(AutocompleteComponent) autocompleteItems: QueryList<AutocompleteComponent>;

  form: FormGroup;

  initialFormValue = {};
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private salesOrdersService: SalesOrdersService,
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
    const { quantity, type, receivable, costOfSale, description } = this.data;
    this.initialFormValue = { quantity, type, receivable, costOfSale, description };
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

  private generatePayload() {
    const { receivable, ...rest } = this.form.value.lineItem;

    const payload = ObjectUtil.deleteEmptyProperties(
      {
        ...rest,
        units: this.data?.units,
        origin: ARLineItemsOriginEnum.AR_MODULE,
        receivable: receivable?.revenueAccount || receivable?.wipAccount ? receivable : null
      },
      true
    );

    const invoiceId = this.route.snapshot.queryParamMap.get('invoiceId');

    if (invoiceId) {
      return {
        lineItem: payload
      };
    }

    return {
      openLineItem: payload
    };
  }

  private addLineItem(payload) {
    const salesOrderId = this.route.snapshot.paramMap.get('id');

    this.salesOrdersService
      .addSalesOrderOpenLineItem(salesOrderId, payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe(res => {
        this.allowEmitBack(res);
      });
  }

  private editLineItem(payload) {
    const invoiceId = this.route.snapshot.queryParamMap.get('invoiceId');
    const salesOrderId = this.route.snapshot.paramMap.get('id');
    const lineId = this.route.snapshot.paramMap.get('lineId');

    this.salesOrdersService
      .editLineItem(salesOrderId, lineId, payload, invoiceId)
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
