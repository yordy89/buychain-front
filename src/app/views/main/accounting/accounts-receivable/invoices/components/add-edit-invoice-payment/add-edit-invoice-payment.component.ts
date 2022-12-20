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
import { ARInvoice, ARInvoicePayment } from '@services/app-layer/entities/accounts-receivable';
import { ObjectUtil } from '@services/helpers/utils/object-util';
import { EMPTY, forkJoin, of, Subject } from 'rxjs';
import { catchError, concatMap, first, takeUntil } from 'rxjs/operators';
import { FormGroupHelper } from '@services/helpers/utils/form-group-helper';
import { DialogModalComponent, DialogType } from '@components/common/modals/dialog-modal/dialog-modal.component';
import { MatDialog } from '@angular/material/dialog';
import { AutocompleteComponent } from '@directives/autocomplete/autocomplete.component';
import { InvoicesService } from '@views/main/accounting/accounts-receivable/invoices/invoices.service';
import { ARInvoicePaymentStateEnum, ARInvoicePaymentTypeEnum } from '@services/app-layer/app-layer.enums';
import {
  AccountingAttachment,
  AccountingAttachmentsService
} from '@services/app-layer/accounting-attachments/accounting-attachments.service';
import { InvoicesApiService } from '@services/app-layer/invoices/invoices-api.services';
import { NotificationHelperService } from '@services/helpers/notification-helper/notification-helper.service';
import { Environment } from '@services/app-layer/app-layer.environment';

@Component({
  selector: 'app-add-edit-invoice-payment',
  templateUrl: 'add-edit-invoice-payment.component.html',
  styleUrls: ['./add-edit-invoice-payment.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddEditInvoicePaymentComponent implements OnInit, OnDestroy {
  @Input() data: ARInvoicePayment;
  @Input() invoice: ARInvoice;
  @Input() accounts: AccountEntity[] = [];
  @Input() editMode = false;

  @Output() back = new EventEmitter<void>();

  @ViewChildren(AutocompleteComponent) autocompleteItems: QueryList<AutocompleteComponent>;

  form: FormGroup;
  settlementFormGroup: FormGroup;

  readonly types = ObjectUtil.enumToArray(ARInvoicePaymentTypeEnum).filter(
    type => type !== ARInvoicePaymentTypeEnum.CREDIT_MEMO
  );
  readonly statuses = ObjectUtil.enumToArray(ARInvoicePaymentStateEnum);
  readonly currencies = ['USD'];
  attachments = [];
  unpaidAmountAvailable = false;

  showSettlementFields = false;
  initialFormValue = {};
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private invoicesService: InvoicesService,
    private router: Router,
    private fb: FormBuilder,
    private accountsService: AccountsService,
    private cd: ChangeDetectorRef,
    private dialog: MatDialog,
    private accountingAttachmentsService: AccountingAttachmentsService,
    private invoicesApiService: InvoicesApiService,
    private notificationHelperService: NotificationHelperService
  ) {}

  ngOnInit() {
    this.createForm();
    if (this.editMode) {
      this.setInitialData();
    } else {
      this.accounts = this.accounts.filter(item => !item.system && !item.archived);
      this.unpaidAmountAvailable = this.invoice.unpaid > 0;
    }
    this.initialFormValue = this.form.value;
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setInitialData() {
    const { cashAccount, attachments } = this.data;
    this.accounts = this.accounts.filter(item => item.id === cashAccount || (!item.system && !item.archived));
    this.attachments = attachments;

    this.form.patchValue(this.data);
  }

  archivedAccountValidator = (control: FormControl) =>
    this.isArchivedAccount(control.value) ? { system: 'Archived account is not allowed' } : null;

  isArchivedAccount(accountId: string) {
    return this.accounts.find(item => item.id === accountId)?.archived || false;
  }

  statusBadgeClass(status: ARInvoicePaymentStateEnum) {
    switch (status) {
      case ARInvoicePaymentStateEnum.DEPOSITED:
      case ARInvoicePaymentStateEnum.SETTLED:
        return Badge.success;
      case ARInvoicePaymentStateEnum.RECEIVED:
        return Badge.warning;
      case ARInvoicePaymentStateEnum.VOIDED:
        return Badge.secondary;
      default:
        return '';
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

  get invoiceId() {
    const isFromSalesOrder = this.router.url.includes('sales-orders');
    const paramName = isFromSalesOrder ? 'invoiceId' : 'id';
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
      return this.invoicesApiService.addPaymentAttachments(
        this.invoiceId,
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
    const { state, ...rest } = this.form.value;
    const payment = {
      ...rest,
      state: state === ARInvoicePaymentStateEnum.RECEIVED ? null : state
    };
    const payload = { payment: ObjectUtil.deleteEmptyProperties(payment, true) };

    this.invoicesService
      .addInvoicePayment(this.invoiceId, payload)
      .pipe(
        concatMap(updatedInvoice => {
          this.data = updatedInvoice.payments.pop();
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

    return this.invoicesService.editInvoicePayment(this.invoiceId, this.data.id, payload);
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

  private createForm(): void {
    this.settlementFormGroup = new FormGroup({
      paymentDate: new FormControl(null),
      postDate: new FormControl(null),
      amount: new FormControl(0),
      type: new FormControl(null)
    });

    this.settlementFormGroup.disable();

    const config = {
      state: [ARInvoicePaymentStateEnum.RECEIVED],
      type: ['', Validators.required],
      description: ['', [Validators.maxLength(500)]],
      notes: ['', Validators.maxLength(500)],
      recvDate: ['', Validators.required],
      amount: [0, [Validators.required, Validators.min(0.01), Validators.max(Environment.maxSafeNumber)]],
      cashAccount: [null, [Validators.required, this.archivedAccountValidator]],
      currency: [this.currencies[0], Validators.required],
      settlement: this.settlementFormGroup
    };

    this.form = this.fb.group(config);
    this.form.get('state').valueChanges.pipe(takeUntil(this.destroy$)).subscribe(this.onStatusChange);
  }

  onSelectFullUnpaidAmount() {
    this.form.get('amount').setValue(this.invoice.unpaid);
  }

  isStateOptionDisabled(state: ARInvoicePaymentStateEnum) {
    return (
      !this.editMode && (state === ARInvoicePaymentStateEnum.DEPOSITED || state === ARInvoicePaymentStateEnum.VOIDED)
    );
  }

  onStatusChange = (state: ARInvoicePaymentStateEnum) => {
    if (state === ARInvoicePaymentStateEnum.SETTLED) {
      this.settlementFormGroup.enable();
      this.settlementFormGroup.get('paymentDate').setValidators(Validators.required);
      this.settlementFormGroup.get('postDate').setValidators(Validators.required);
      this.settlementFormGroup
        .get('amount')
        .setValidators([Validators.required, Validators.min(0), Validators.max(Environment.maxSafeNumber)]);
      this.settlementFormGroup.get('type').setValidators(Validators.required);
      this.showSettlementFields = true;
    } else {
      this.showSettlementFields = false;
      this.settlementFormGroup.get('paymentDate').clearValidators();
      this.settlementFormGroup.get('postDate').clearValidators();
      this.settlementFormGroup.get('amount').clearValidators();
      this.settlementFormGroup.get('type').clearValidators();
      this.settlementFormGroup.disable();
    }
  };

  removeAttachment(attachmentToRemove: AccountingAttachment) {
    this.accountingAttachmentsService
      .removeFile(attachmentToRemove?.id)
      .pipe(
        first(),
        concatMap(() =>
          this.invoicesApiService.deletePaymentAttachment(this.invoiceId, this.data.id, attachmentToRemove.id)
        ),
        catchError(() => {
          this.notificationHelperService.showValidation('Something unexpected happened. Please try again.');
          return EMPTY;
        })
      )
      .subscribe(() => {
        this.attachments = this.attachments.filter(attachment => attachment.id !== attachmentToRemove.id);
        this.cd.markForCheck();
      });
  }

  get s3KeyPrefix() {
    return `invoice-payments/${this.data.id}`;
  }
}
