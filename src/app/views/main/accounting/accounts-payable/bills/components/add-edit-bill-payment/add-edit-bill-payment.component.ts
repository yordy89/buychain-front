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
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Badge } from '@app/constants';
import { AccountsService } from '@services/app-layer/accounts/accounts.service';
import { AccountEntity } from '@services/app-layer/entities/account';
import { APBill, APBillPayment } from '@services/app-layer/entities/accounts-payable';
import { ObjectUtil } from '@services/helpers/utils/object-util';
import { EMPTY, forkJoin, of, Subject } from 'rxjs';
import { catchError, concatMap, takeUntil } from 'rxjs/operators';
import { FormGroupHelper } from '@services/helpers/utils/form-group-helper';
import { DialogModalComponent, DialogType } from '@components/common/modals/dialog-modal/dialog-modal.component';
import { MatDialog } from '@angular/material/dialog';
import { AutocompleteComponent } from '@directives/autocomplete/autocomplete.component';
import { BillsService } from '@views/main/accounting/accounts-payable/bills/bills.service';
import { APBillPaymentStateEnum, APBillPaymentTypeEnum } from '@services/app-layer/app-layer.enums';
import { BillsApiService } from '@services/app-layer/bills/bills-api.services';
import {
  AccountingAttachment,
  AccountingAttachmentsService
} from '@services/app-layer/accounting-attachments/accounting-attachments.service';
import { NotificationHelperService } from '@services/helpers/notification-helper/notification-helper.service';
import { Environment } from '@services/app-layer/app-layer.environment';

@Component({
  selector: 'app-add-edit-bill-payment',
  templateUrl: 'add-edit-bill-payment.component.html',
  styleUrls: ['./add-edit-bill-payment.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddEditBillPaymentComponent implements OnInit, OnDestroy {
  @Input() data: APBillPayment;
  @Input() bill: APBill;
  @Input() accounts: AccountEntity[] = [];
  @Input() editMode = false;

  @Output() back = new EventEmitter<void>();

  @ViewChildren(AutocompleteComponent) autocompleteItems: QueryList<AutocompleteComponent>;

  form: FormGroup;
  settlementFormGroup: FormGroup;

  readonly types = ObjectUtil.enumToArray(APBillPaymentTypeEnum);
  readonly statuses = ObjectUtil.enumToArray(APBillPaymentStateEnum);
  readonly currencies = ['USD'];
  attachments = [];
  unpaidAmountAvailable = false;

  showSettlementFields = false;
  showCheckFields = false;
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
    private dialog: MatDialog,
    private accountingAttachmentsService: AccountingAttachmentsService,
    private notificationHelperService: NotificationHelperService
  ) {}

  ngOnInit() {
    this.createForm();

    if (this.editMode) {
      this.setInitialData();
    } else {
      this.accounts = this.accounts.filter(item => !item.system && !item.archived);
      this.unpaidAmountAvailable = this.bill.unpaid > 0;
    }

    this.initialFormValue = this.form.value;
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setInitialData() {
    const { paymentAccount, attachments } = this.data;
    this.accounts = this.accounts.filter(item => item.id === paymentAccount || (!item.system && !item.archived));
    this.attachments = attachments;

    this.form.patchValue(this.data);
  }

  archivedAccountValidator = (control: FormControl) =>
    this.isArchivedAccount(control.value) ? { system: 'Archived account is not allowed' } : null;

  isArchivedAccount(accountId: string) {
    return this.accounts.find(item => item.id === accountId)?.archived || false;
  }

  statusBadgeClass(status: APBillPaymentStateEnum) {
    switch (status) {
      case APBillPaymentStateEnum.DRAFT:
        return Badge.primary;
      case APBillPaymentStateEnum.APPROVED:
      case APBillPaymentStateEnum.SETTLED:
        return Badge.success;
      case APBillPaymentStateEnum.ISSUED:
        return Badge.warning;
      case APBillPaymentStateEnum.VOID:
        return Badge.secondary;
    }
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
      if (!confirm) {
        return;
      }

      this.back.emit();
    });
  }

  get billId() {
    const isFromPurchaseOrder = this.router.url.includes('purchase-orders');
    const paramName = isFromPurchaseOrder ? 'billId' : 'id';
    return this.route.snapshot.paramMap.get(paramName);
  }

  private generateAttachmentsPayload(uploadedAttachments: AccountingAttachment[]) {
    return {
      payment: {
        attachments: uploadedAttachments.map(uploadedAttachment => {
          const { createdAt, updatedAt, ...rest } = uploadedAttachment;
          return {
            _createdAt: createdAt,
            _updatedAt: updatedAt,
            ...rest
          };
        })
      }
    };
  }

  private saveAttachmentsMetadata = (uploadedAttachments: AccountingAttachment[]) => {
    if (this.attachments?.length) {
      return this.billsApiService.addBillPaymentAttachments(
        this.billId,
        this.data.id,
        this.generateAttachmentsPayload(uploadedAttachments)
      );
    }
    return of(this.data);
  };

  private handleOnSave = res => {
    if (res) {
      this.back.emit();
    }
  };

  private addPayment() {
    const payload = {
      payment: {
        ...ObjectUtil.deleteEmptyProperties(this.getChangedValues(), true),
        currency: 'USD'
      }
    };
    this.billsApiService
      .addBillPayment(this.billId, payload)
      .pipe(
        concatMap(createdBill => {
          this.data = createdBill.payments.pop();
          if (this.attachments?.length) {
            return this.accountingAttachmentsService.uploadFiles(this.attachments, this.s3KeyPrefix);
          }
          return of(this.data);
        }),
        concatMap(this.saveAttachmentsMetadata),
        takeUntil(this.destroy$)
      )
      .subscribe(this.handleOnSave);
  }

  private saveAttachments() {
    const newAttachments = this.attachments.filter(attachment => attachment instanceof File);
    if (newAttachments?.length) {
      return this.accountingAttachmentsService
        .uploadFiles(newAttachments, this.s3KeyPrefix)
        .pipe(concatMap(this.saveAttachmentsMetadata), takeUntil(this.destroy$));
    }

    return of(this.data);
  }

  private updatePayment(payload) {
    if (ObjectUtil.isEmptyObject(payload.payment)) {
      return of(this.data);
    }

    return this.billsApiService.editBillPayment(this.billId, this.data.id, payload);
  }

  private editPayment() {
    const payload = {
      payment: ObjectUtil.deleteEmptyProperties(this.getChangedValues(), true)
    };
    forkJoin([this.updatePayment(payload), this.saveAttachments()])
      .pipe(takeUntil(this.destroy$))
      .subscribe(this.handleOnSave);
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

    if (this.editMode) {
      return this.editPayment();
    }

    return this.addPayment();
  }

  private disableField(formField: string) {
    if (this.data?.state === APBillPaymentStateEnum.DRAFT) {
      return false;
    }

    const invalidSet = {
      APPROVED: ['type', 'paymentDate', 'amount', 'currency', 'paymentAccount'],
      ISSUED: ['type', 'paymentDate', 'amount', 'currency', 'paymentAccount', 'number', 'checkNumber', 'memo'],
      VOID: ['type', 'paymentDate', 'amount', 'currency', 'paymentAccount', 'number', 'checkNumber', 'memo', 'state'],
      SETTLED: ['type', 'paymentDate', 'amount', 'currency', 'paymentAccount', 'number', 'checkNumber', 'memo', 'state']
    };

    return invalidSet[this.data?.state]?.some(field => field === formField);
  }

  private createForm(): void {
    this.settlementFormGroup = new FormGroup({
      paymentDate: new FormControl({ value: null, disabled: true }),
      postDate: new FormControl({ value: null, disabled: true }),
      amount: new FormControl({ value: 0, disabled: true }),
      type: new FormControl({ value: null, disabled: true })
    });

    this.settlementFormGroup.disable();

    const config = {
      state: [{ value: APBillPaymentStateEnum.DRAFT, disabled: !this.editMode || this.disableField('state') }],
      type: [{ value: '', disabled: this.disableField('type') }, Validators.required],
      notes: ['', Validators.maxLength(500)],
      paymentDate: [{ value: '', disabled: this.disableField('paymentDate') }, Validators.required],
      amount: [
        { value: 0, disabled: this.disableField('amount') },
        [Validators.required, Validators.min(0.01), Validators.max(Environment.maxSafeNumber)]
      ],
      paymentAccount: [
        { value: null, disabled: this.disableField('paymentAccount') },
        [Validators.required, this.archivedAccountValidator]
      ],
      currency: [{ value: this.currencies[0], disabled: this.disableField('currency') }, Validators.required],
      checkNumber: [
        { value: null, disabled: this.disableField('checkNumber') },
        [Validators.required, Validators.min(1), Validators.max(Environment.maxSafeNumber)]
      ],
      memo: [{ value: null, disabled: this.disableField('memo') }, [Validators.required, Validators.maxLength(500)]],
      settlementObject: this.settlementFormGroup
    };

    this.form = this.fb.group(config);
    this.form.get('state').valueChanges.pipe(takeUntil(this.destroy$)).subscribe(this.onStatusChange);
    this.form.get('type').valueChanges.pipe(takeUntil(this.destroy$)).subscribe(this.onTypeChange);
  }

  onSelectFullUnpaidAmount() {
    this.form.get('amount').setValue(this.bill.unpaid);
  }

  isStateOptionDisabled(state: APBillPaymentStateEnum) {
    return !this.editMode && (state === APBillPaymentStateEnum.ISSUED || state === APBillPaymentStateEnum.VOID);
  }

  stateOptionDisabledTooltip(state: APBillPaymentStateEnum) {
    const currentState = this.data?.state || APBillPaymentStateEnum.DRAFT;

    if (state === currentState) {
      return null;
    }

    const transition = {
      DRAFT: ['APPROVED'],
      APPROVED: ['ISSUED', 'VOID'],
      ISSUED: ['SETTLED'],
      SETTLED: [],
      VOID: []
    };

    if (!transition[currentState].includes(state)) {
      return `Can't transition from state ${currentState} to ${state}`;
    }
  }

  onStatusChange = (state: APBillPaymentStateEnum) => {
    if (state === APBillPaymentStateEnum.SETTLED) {
      if (this.data.state !== APBillPaymentStateEnum.SETTLED) {
        this.settlementFormGroup.enable();
      }
      this.showSettlementFields = true;
    } else {
      this.showSettlementFields = false;
      this.settlementFormGroup.disable();
    }
  };

  onTypeChange = (type: APBillPaymentTypeEnum) => {
    if (type === APBillPaymentTypeEnum.CHECK) {
      this.form.get('checkNumber').enable();
      this.form.get('memo').enable();
      this.showCheckFields = true;
    } else {
      this.showCheckFields = false;
      this.form.get('checkNumber').disable();
      this.form.get('memo').disable();
    }
  };

  removeAttachment(attachmentToRemove: AccountingAttachment) {
    this.accountingAttachmentsService
      .removeFile(attachmentToRemove?.id)
      .pipe(
        concatMap(() =>
          this.billsApiService.deleteBillPaymentAttachment(this.billId, this.data.id, attachmentToRemove.id)
        ),
        catchError(() => {
          this.notificationHelperService.showValidation('Something unexpected happened. Please try again.');
          return EMPTY;
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.attachments = this.attachments.filter(attachment => attachment.id !== attachmentToRemove.id);
        this.cd.markForCheck();
      });
  }

  get s3KeyPrefix() {
    return `bill-payments/${this.data.id}`;
  }
}
