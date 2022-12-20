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
import { MatSelect } from '@angular/material/select';
import { Badge } from '@app/constants';
import { DialogModalComponent, DialogType } from '@components/common/modals/dialog-modal/dialog-modal.component';
import { AutocompleteComponent } from '@directives/autocomplete/autocomplete.component';
import {
  AccountingTypeEnum,
  ARCreditMemoReviewStateEnum,
  ARCreditMemoStateEnum,
  ARCreditMemoTypeEnum
} from '@services/app-layer/app-layer.enums';
import { NotificationHelperService } from '@services/helpers/notification-helper/notification-helper.service';
import { FormGroupHelper } from '@services/helpers/utils/form-group-helper';
import { ObjectUtil } from '@services/helpers/utils/object-util';
import { ViewportHelperService } from '@services/helpers/viewport-helper.service';
import { EMPTY, forkJoin, Observable, of, Subject } from 'rxjs';
import { catchError, concatMap, first, map, takeUntil } from 'rxjs/operators';
import { ARCreditMemo, ARInvoice, ARSalesOrder } from '@services/app-layer/entities/accounts-receivable';
import { AccountEntity } from '@services/app-layer/entities/account';
import { formatCurrency } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { CreditMemosService } from '@views/main/accounting/accounts-receivable/credit-memos/credit-memos.service';
import { CreditMemosApiService } from '@services/app-layer/credit-memos/credit-memos-api.services';
import { CrmAccountEntity } from '@services/app-layer/entities/crm';
import { SpinnerHelperService } from '@services/helpers/spinner-helper/spinner-helper.service';
import { SalesOrdersApiService } from '@services/app-layer/sales-orders/sales-orders-api.service';
import { Environment } from '@services/app-layer/app-layer.environment';
import {
  AccountingAttachment,
  AccountingAttachmentsService
} from '@services/app-layer/accounting-attachments/accounting-attachments.service';

interface InvoiceAutocompleteList {
  id: string;
  displayName: string;
}

@Component({
  selector: 'app-add-edit-credit-memo',
  templateUrl: './add-edit-credit-memo.component.html',
  styleUrls: ['./add-edit-credit-memo.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddEditCreditMemoComponent implements OnInit, OnDestroy {
  @Input() data: ARCreditMemo;
  @Input() crmAccounts: CrmAccountEntity[] = [];
  @Input() accounts: AccountEntity[] = [];
  @Input() editMode = false;
  @Input() set salesOrders(items: ARSalesOrder[]) {
    this.mapInvoiceToAutocompleteList(items);
  }
  @Output() resultChange = new EventEmitter<string>();
  @Output() back = new EventEmitter<void>();
  @ViewChildren(MatSelect) matSelectItems: QueryList<MatSelect>;

  @ViewChildren(AutocompleteComponent) autocompleteItems: QueryList<AutocompleteComponent>;
  form: FormGroup;

  invoices: InvoiceAutocompleteList[] = [];
  attachments = [];

  initialFormValue;
  isTablet$: Observable<boolean>;
  permissions = { canReview: false };

  customerId = null;

  readonly states = ObjectUtil.enumToArray(ARCreditMemoStateEnum);
  readonly reviewStates = ObjectUtil.enumToArray(ARCreditMemoReviewStateEnum);
  readonly types = ObjectUtil.enumToArray(ARCreditMemoTypeEnum);

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
    private creditMemosApiService: CreditMemosApiService,
    private salesOrdersApiService: SalesOrdersApiService,
    private spinnerService: SpinnerHelperService,
    private accountingAttachmentsService: AccountingAttachmentsService
  ) {}

  ngOnInit(): void {
    this.isTablet$ = this.viewportHelperService.isTablet$;
    this.accounts = this.accounts.filter(account => account.type === AccountingTypeEnum.Revenue);
    this.createForm();
    this.permissions = this.creditMemosService.getPermissions();
    if (this.editMode) {
      this.setInitialData();
    }
    this.initialFormValue = this.form.value;
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setInitialData(): void {
    const { customer, relatedTo, amount, revenueAccount, state, reviewState, description, internalNotes, attachments } =
      this.data;
    const customerData = customer as CrmAccountEntity;
    const relatedToData = relatedTo as ARInvoice;
    const revenueAccountData = revenueAccount as AccountEntity;
    const formData = {
      customer: customerData.id,
      relatedTo: relatedToData?.id,
      amount,
      revenueAccount: revenueAccountData?.id,
      state,
      reviewState,
      description,
      internalNotes
    };
    this.attachments = attachments;
    this.customerId = customerData.id;
    this.form.patchValue(formData);
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

  stateBadgeClass(state: ARCreditMemoStateEnum) {
    switch (state) {
      case ARCreditMemoStateEnum.DRAFT:
        return Badge.primary;
      case ARCreditMemoStateEnum.SUBMITTED:
        return Badge.warning;
      case ARCreditMemoStateEnum.CREDITED:
      case ARCreditMemoStateEnum.APPLIED:
      case ARCreditMemoStateEnum.PARTIAL_APPLIED:
        return Badge.success;
    }
  }

  reviewStateBadgeClass(reviewState: ARCreditMemoReviewStateEnum) {
    switch (reviewState) {
      case ARCreditMemoReviewStateEnum.DRAFT:
        return Badge.primary;
      case ARCreditMemoReviewStateEnum.REVIEW:
        return Badge.warning;
      case ARCreditMemoReviewStateEnum.APPROVED:
        return Badge.success;
      case ARCreditMemoReviewStateEnum.REJECT:
        return Badge.danger;
    }
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
    const selectors = ['input', 'textarea', 'select', 'mat-select'].join(', ');

    const descriptionRowElems = Array.from(document.querySelector('.description-row').querySelectorAll(selectors));
    const notesRowElems = Array.from(document.querySelector('.notes-row').querySelectorAll(selectors));

    const nodes = [].concat(this.getTopRowControls(selectors)).concat(descriptionRowElems).concat(notesRowElems);

    this.matSelectItems.forEach(item => item.close());
    this.autocompleteItems.forEach(item => item.closePanel());

    return Array.from(nodes).filter(item => {
      const selectElem = this.matSelectItems.find(el => el.id === item.id);
      return selectElem ? !selectElem.disabled : !item['disabled'];
    }) as HTMLElement[];
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

    if (this.editMode) {
      this.editCreditMemo();
    } else {
      this.addCreditMemo();
    }
  }

  private emitResult = (result?: ARCreditMemo): void => {
    if (result) {
      this.resultChange.emit(result.id);
    }
  };

  get crmCustomerId() {
    return this.route.snapshot.queryParamMap.get('customerId');
  }

  private generateAttachmentsPayload(uploadedAttachments: AccountingAttachment[]) {
    return {
      attachments: uploadedAttachments.map(uploadedAttachment => {
        const { createdAt, updatedAt, ...rest } = uploadedAttachment;
        return {
          _createdAt: createdAt,
          _updatedAt: updatedAt,
          ...rest
        };
      })
    };
  }

  private saveAttachmentsMetadata = (uploadedAttachments: AccountingAttachment[]) => {
    if (this.attachments?.length) {
      return this.creditMemosApiService.addCreditMemoAttachments(
        this.data.id,
        this.generateAttachmentsPayload(uploadedAttachments)
      );
    }

    return of(this.data);
  };

  private addCreditMemo() {
    const payload = ObjectUtil.deleteEmptyProperties(this.form.value, true);
    payload.currency = 'USD';
    let endpoint = this.creditMemosApiService.addCreditMemo(payload);

    if (this.crmCustomerId) {
      endpoint = this.creditMemosApiService.addCRMCreditMemo(payload);
      payload.customer = this.crmCustomerId;
    }

    endpoint
      .pipe(
        concatMap(createdInvoice => {
          this.data = createdInvoice;
          if (this.attachments?.length) {
            return this.accountingAttachmentsService.uploadFiles(this.attachments, this.s3KeyPrefix);
          }
          return of(this.data);
        }),
        concatMap(this.saveAttachmentsMetadata),
        catchError(({ error }) => {
          this.notificationHelperService.showValidation(error.message);
          return EMPTY;
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(this.emitResult);
  }

  private saveAttachments() {
    const newAttachments = this.attachments.filter(attachment => attachment instanceof File);
    if (newAttachments?.length) {
      return this.accountingAttachmentsService
        .uploadFiles(newAttachments, this.s3KeyPrefix)
        .pipe(concatMap(this.saveAttachmentsMetadata), takeUntil(this.destroy$));
    }

    return of(null);
  }

  private updateCreditMemo() {
    const payload = ObjectUtil.deleteEmptyProperties(this.getChangedValues(), true);

    if (ObjectUtil.isEmptyObject(payload)) {
      return of(null);
    }

    return this.creditMemosApiService.editCreditMemo(this.data.id, payload).pipe(
      catchError(({ error }) => {
        this.notificationHelperService.showValidation(error.message);
        return EMPTY;
      }),
      takeUntil(this.destroy$)
    );
  }

  private editCreditMemo() {
    forkJoin([this.updateCreditMemo(), this.saveAttachments()])
      .pipe(
        catchError(({ error }) => {
          this.notificationHelperService.showValidation(error.message);
          return EMPTY;
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.emitResult(this.data);
      });
  }

  stateOptionDisabledTooltip(state: ARCreditMemoStateEnum) {
    const currentState = this.data?.state || ARCreditMemoStateEnum.DRAFT;

    if (state === currentState) {
      return null;
    }

    switch (state) {
      case ARCreditMemoStateEnum.DRAFT:
      case ARCreditMemoStateEnum.CREDITED:
      case ARCreditMemoStateEnum.APPLIED:
      case ARCreditMemoStateEnum.PARTIAL_APPLIED: {
        return `Can't manually set the credit memo to ${state}.`;
      }
      case ARCreditMemoStateEnum.SUBMITTED: {
        if (currentState !== ARCreditMemoStateEnum.DRAFT) {
          return `Can't set the invoice to ${state} from the state ${currentState}.`;
        }
        break;
      }
      default:
        return `Can't set the invoice state to ${state}.`;
    }
  }

  reviewStateOptionDisabledTooltip(state: ARCreditMemoReviewStateEnum) {
    const currentState = this.data?.state || ARCreditMemoReviewStateEnum.DRAFT;

    if (state === currentState) {
      return null;
    }

    switch (state) {
      case ARCreditMemoReviewStateEnum.REVIEW: {
        return `Can't manually set the credit memo to ${state}.`;
      }
      case ARCreditMemoReviewStateEnum.APPROVED:
      case ARCreditMemoReviewStateEnum.REJECT: {
        if (currentState === ARCreditMemoReviewStateEnum.DRAFT) {
          return `Can't set the invoice to ${state} from the state ${currentState}.`;
        }
        break;
      }
      default:
        return `Can't set the invoice state to ${state}.`;
    }
  }

  get notAvailableInvoice() {
    return !!this.customerId && !this.invoices?.length;
  }

  private createForm(): void {
    const config = {
      customer: [{ value: this.crmCustomerId, disabled: !!this.crmCustomerId || this.editMode }, Validators.required],
      relatedTo: [{ value: null, disabled: !this.invoices?.length || this.editMode }],
      revenueAccount: [{ value: null, disabled: !this.accounts?.length || this.editMode }, Validators.required],
      amount: [0, [Validators.required, Validators.min(1), Validators.max(Environment.maxSafeNumber)]],
      description: [null, [Validators.required, Validators.maxLength(280)]],
      internalNotes: [null, Validators.maxLength(500)],
      state: [{ value: ARCreditMemoStateEnum.DRAFT, disabled: !this.editMode }],
      reviewState: [{ value: ARCreditMemoReviewStateEnum.DRAFT, disabled: !this.editMode }],
      type: [{ value: null, disabled: true }]
    };

    this.form = this.fb.group(config);
    this.form.get('customer').valueChanges.pipe(takeUntil(this.destroy$)).subscribe(this.onCustomerChange);
  }

  private mapInvoiceToAutocompleteList(salesOrders: ARSalesOrder[]) {
    this.invoices = salesOrders.reduce((acc, curr) => {
      const mappedInvoices: InvoiceAutocompleteList[] = curr.invoices.map(invoice => ({
        id: invoice.id,
        displayName: `Invoice ${invoice.number}`
      }));
      return acc.concat(mappedInvoices);
    }, []);
  }

  private enableDisableRelatedToInput() {
    if (this.invoices.length) {
      this.form.get('relatedTo').enable();
    } else {
      this.form.get('relatedTo').disable();
    }
  }

  private onCustomerChange = customerId => {
    if (customerId && this.customerId !== customerId) {
      this.spinnerService.setStatus(true);
      this.form.get('relatedTo').reset();
      this.salesOrdersApiService
        .getSalesOrders(1000, 0, { customer: customerId })
        .pipe(
          first(),
          map((salesOrders: ARSalesOrder[]) => {
            this.mapInvoiceToAutocompleteList(salesOrders);
            this.customerId = customerId;
            this.enableDisableRelatedToInput();
          })
        )
        .subscribe(() => {
          this.spinnerService.setStatus(false);
        });
    } else if (!customerId) {
      this.customerId = customerId;
      this.invoices = [];
      this.enableDisableRelatedToInput();
    }
  };

  removeAttachment(attachmentToRemove: AccountingAttachment) {
    this.accountingAttachmentsService
      .removeFile(attachmentToRemove?.id)
      .pipe(
        first(),
        concatMap(() => this.creditMemosApiService.deleteCreditMemoAttachment(this.data.id, attachmentToRemove.id)),
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
    return `credit-memos/${this.data.id}`;
  }
}
