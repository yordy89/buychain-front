import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Inject,
  Input,
  LOCALE_ID,
  OnDestroy,
  OnInit,
  Output,
  QueryList,
  ViewChildren
} from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { DialogModalComponent, DialogType } from '@components/common/modals/dialog-modal/dialog-modal.component';
import { AutocompleteComponent } from '@directives/autocomplete/autocomplete.component';
import { ARInvoicePaymentTypeEnum } from '@services/app-layer/app-layer.enums';
import { NotificationHelperService } from '@services/helpers/notification-helper/notification-helper.service';
import { FormGroupHelper } from '@services/helpers/utils/form-group-helper';
import { ObjectUtil } from '@services/helpers/utils/object-util';
import { ViewportHelperService } from '@services/helpers/viewport-helper.service';
import { EMPTY, Observable, of, Subject } from 'rxjs';
import { catchError, concatMap, takeUntil } from 'rxjs/operators';
import {
  ARCreditMemo,
  ARInvoice,
  ARInvoicePayment,
  ARSalesOrder
} from '@services/app-layer/entities/accounts-receivable';
import { formatCurrency } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CreditMemosService } from '@views/main/accounting/accounts-receivable/credit-memos/credit-memos.service';
import { CrmAccountEntity } from '@services/app-layer/entities/crm';
import { AccountEntity } from '@services/app-layer/entities/account';
import { InvoicesApiService } from '@services/app-layer/invoices/invoices-api.services';
import {
  AccountingAttachment,
  AccountingAttachmentsService
} from '@services/app-layer/accounting-attachments/accounting-attachments.service';

interface CreditMemoAutocompleteListValue {
  id: string;
  displayName: string;
  amount: number;
  createdAt: string;
  revenueAccount: string;
}

@Component({
  selector: 'app-apply-credit-memo',
  templateUrl: './apply-credit-memo.component.html',
  styleUrls: ['./apply-credit-memo.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ApplyCreditMemoComponent implements OnInit, OnDestroy {
  @Input() salesOrder: ARSalesOrder;
  @Input() crmAccounts: CrmAccountEntity[] = [];
  @Input() accounts: AccountEntity[] = [];
  @Input() set creditMemos(items: ARCreditMemo[]) {
    this.mapCreditMemosToAutocompleteList(items);
    this.invoice = this.salesOrder.invoices.find(invoice => invoice.id === this.invoiceId);
  }
  @Output() resultChange = new EventEmitter<string>();
  @Output() back = new EventEmitter<void>();
  @ViewChildren(AutocompleteComponent) autocompleteItems: QueryList<AutocompleteComponent>;

  form: FormGroup;
  initialFormValue;

  isTablet$: Observable<boolean>;
  permissions = { canApply: false };

  payment: ARInvoicePayment = null;
  invoice: ARInvoice = null;
  _creditMemos: CreditMemoAutocompleteListValue[];
  selectedCreditMemo: CreditMemoAutocompleteListValue = null;
  attachments = [];

  private destroy$ = new Subject<void>();
  constructor(
    @Inject(LOCALE_ID) private localeId: string,
    private fb: FormBuilder,
    private notificationHelperService: NotificationHelperService,
    private cd: ChangeDetectorRef,
    private creditMemosService: CreditMemosService,
    private dialog: MatDialog,
    private viewportHelperService: ViewportHelperService,
    private route: ActivatedRoute,
    private invoicesApiService: InvoicesApiService,
    private accountingAttachmentsService: AccountingAttachmentsService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.isTablet$ = this.viewportHelperService.isTablet$;
    this.createForm();
    this.permissions = this.creditMemosService.getPermissions();
    this.accounts = this.accounts.filter(item => !item.system && !item.archived);
    this.initialFormValue = this.form.value;
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private mapCreditMemosToAutocompleteList(creditMemos: ARCreditMemo[]) {
    this._creditMemos = creditMemos.map(creditMemo => ({
      id: creditMemo.id,
      displayName: `CM - ${creditMemo.number}`,
      amount: creditMemo.amount,
      createdAt: creditMemo.createdAt,
      revenueAccount: creditMemo.revenueAccount || null
    }));
  }

  isFormValid() {
    return this.form.valid;
  }

  formatAmountCurrency = e => formatCurrency(e.value, this.localeId, '$');

  getControlFromGroup(ctrl, ctrlName): FormControl {
    return ctrl.get(ctrlName);
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

  private getChangedValues() {
    return FormGroupHelper.getChangedValues(this.form.value, this.initialFormValue);
  }

  onEnter(event) {
    event.preventDefault();

    const items = this.getOrderedControlNodes();
    let targetIndex = items.findIndex(item => item === event.target);
    const targetElem = items.find(item => item === event.target);

    if (!targetElem) {
      return;
    }

    targetIndex++;
    items[targetIndex]?.focus();
  }

  private getOrderedControlNodes() {
    const selectors = ['input', 'textarea'].join(', ');

    const nodes = [].concat(this.getTopRowControls(selectors));

    this.autocompleteItems.forEach(item => item.closePanel());

    return Array.from(nodes) as HTMLElement[];
  }

  private getTopRowControls(selectors) {
    const mainSelector = Array.from(document.querySelectorAll('.top-section-row .flex-col'));

    const nodesArr = mainSelector.map(item => Array.from(item.querySelectorAll(selectors)));
    const itemsCountArr = nodesArr.map(el => el.length);
    const maxCount = Math.max.apply(null, itemsCountArr);
    let nodes = [];

    for (let i = 0; i < maxCount; i++) {
      const targetNodes = nodesArr.map(items => items[i]).filter(val => !!val);
      nodes = nodes.concat(targetNodes);
    }

    return nodes;
  }

  onSubmit() {
    if (!this.isFormValid()) {
      this.autocompleteItems.forEach(item => {
        FormGroupHelper.markControlTouchedAndDirty(item.formControl);
        item.formControl.updateValueAndValidity();
      });
      FormGroupHelper.markTouchedAndDirty(this.form);
      return;
    }

    this.applyCreditMemo();
  }

  get invoiceId() {
    return this.route.snapshot.queryParamMap.get('invoiceId');
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
        this.payment.id,
        this.generateAttachmentsPayload(uploadedAttachments)
      );
    }
    return of(this.payment);
  };

  private applyCreditMemo() {
    const payload = {
      payment: {
        ...ObjectUtil.deleteEmptyProperties(this.form.value, true),
        recvDate: this.selectedCreditMemo.createdAt,
        type: ARInvoicePaymentTypeEnum.CREDIT_MEMO,
        currency: 'USD'
      }
    };

    this.invoicesApiService
      .addInvoicePayment(this.invoiceId, payload)
      .pipe(
        concatMap(updatedInvoice => {
          this.payment = updatedInvoice.payments.pop();
          if (this.attachments?.length) {
            return this.accountingAttachmentsService.uploadFiles(this.attachments, this.s3KeyPrefix);
          }
          return of(this.payment);
        }),
        concatMap(this.saveAttachmentsMetadata),
        catchError(({ error }) => {
          this.notificationHelperService.showValidation(error.message);
          return EMPTY;
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((result?: ARInvoice): void => {
        if (result) {
          this.router.navigate(['/accounting/invoices', this.invoiceId], {
            relativeTo: this.route
          });
        }
      });
  }

  archivedAccountValidator = (control: FormControl) =>
    this.isArchivedAccount(control.value) ? { system: 'Archived account is not allowed' } : null;

  isArchivedAccount(accountId: string) {
    return this.accounts.find(item => item.id === accountId)?.archived || false;
  }

  private createForm(): void {
    const config = {
      creditMemo: [null, Validators.required],
      amount: [0, [Validators.required, Validators.min(0)]],
      cashAccount: [null, [Validators.required, this.archivedAccountValidator]],
      description: ['', [Validators.maxLength(500)]],
      notes: ['', Validators.maxLength(500)]
    };

    this.form = this.fb.group(config);
    this.form.get('creditMemo').valueChanges.pipe(takeUntil(this.destroy$)).subscribe(this.onCreditMemoChange);
  }

  private onCreditMemoChange = (creditMemoId: string) => {
    if (creditMemoId && creditMemoId !== this.selectedCreditMemo?.id) {
      this.form.get('amount').enable();
      this.selectedCreditMemo = this._creditMemos.find(creditMemo => creditMemo.id === creditMemoId);
      this.form.controls.cashAccount.setValue(this.selectedCreditMemo.revenueAccount);
      this.form.get('amount').addValidators([Validators.max(this.selectedCreditMemo.amount)]);
    } else if (!creditMemoId) {
      this.form.get('amount').reset(0);
      this.form.get('amount').disable();
    }
  };

  get s3KeyPrefix() {
    return `invoice-payments/${this.payment.id}`;
  }
}
