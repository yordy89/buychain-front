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
import { ARInvoiceReviewStateEnum, ARInvoiceStateEnum } from '@services/app-layer/app-layer.enums';
import { AccountEntity } from '@services/app-layer/entities/account';
import { NotificationHelperService } from '@services/helpers/notification-helper/notification-helper.service';
import { FormGroupHelper } from '@services/helpers/utils/form-group-helper';
import { ObjectUtil } from '@services/helpers/utils/object-util';
import { ViewportHelperService } from '@services/helpers/viewport-helper.service';
import { EMPTY, of, Subject, Observable, forkJoin } from 'rxjs';
import { catchError, concatMap, first, takeUntil, tap } from 'rxjs/operators';
import { ARInvoice, ARLineItem, ARSalesOrder } from '@services/app-layer/entities/accounts-receivable';
import { CompanyDetails } from '@services/data-layer/http-api/base-api/swagger-gen';
import { formatCurrency } from '@angular/common';
import {
  InvoicePdfTemplateData,
  InvoicesService
} from '@views/main/accounting/accounts-receivable/invoices/invoices.service';
import { AltBillToModalComponent } from '@views/main/accounting/accounts-receivable/invoices/components/alt-bill-to-modal/alt-bill-to-modal.component';
import { CrmLocationEntity } from '@services/app-layer/entities/crm';
import { MemberEntity } from '@services/app-layer/entities/member';
import { ActivatedRoute } from '@angular/router';
import {
  AccountingAttachment,
  AccountingAttachmentsService
} from '@services/app-layer/accounting-attachments/accounting-attachments.service';
import { InvoicesApiService } from '@services/app-layer/invoices/invoices-api.services';
import { AddRejectNoteModalComponent } from '@views/main/accounting/accounts-receivable/invoices/components/add-rejected-note-modal/add-reject-note-modal.component';
import { MilestoneEntity } from '@services/app-layer/entities/transaction';
import { AddEditInvoiceService } from '@views/main/accounting/accounts-receivable/invoices/components/add-edit-invoice/add-edit-invoice.service';

@Component({
  selector: 'app-add-edit-invoice',
  templateUrl: './add-edit-invoice.component.html',
  styleUrls: ['./add-edit-invoice.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddEditInvoiceComponent implements OnInit, OnDestroy {
  @Input() data: ARInvoice;
  @Input() salesOrder: ARSalesOrder;
  @Input() accounts: AccountEntity[] = [];
  @Input() company: CompanyDetails;
  @Input() billToLocation: CrmLocationEntity;
  @Input() shipToLocation: CrmLocationEntity;
  @Input() members: MemberEntity[];
  @Input() milestones: MilestoneEntity[];
  @Input() editMode = false;

  @Output() resultChange = new EventEmitter<string>();
  @Output() back = new EventEmitter<void>();

  @ViewChildren(MatSelect) matSelectItems: QueryList<MatSelect>;
  @ViewChildren(AutocompleteComponent) autocompleteItems: QueryList<AutocompleteComponent>;

  form: FormGroup;

  billTo: CrmLocationEntity;
  initialFormValue;
  isTablet$: Observable<boolean>;
  paymentsTabTitle = '';
  permissions = { canReview: false };
  attachments = [];
  openLineItems: ARLineItem[] = [];

  readonly states = ObjectUtil.enumToArray(ARInvoiceStateEnum);
  readonly reviewStates = ObjectUtil.enumToArray(ARInvoiceReviewStateEnum);

  private destroy$ = new Subject<void>();

  constructor(
    @Inject(LOCALE_ID) private localeId: string,
    private fb: FormBuilder,
    private notificationHelperService: NotificationHelperService,
    private cd: ChangeDetectorRef,
    private invoicesService: InvoicesService,
    private dialog: MatDialog,
    private viewportHelperService: ViewportHelperService,
    private route: ActivatedRoute,
    private accountingAttachmentsService: AccountingAttachmentsService,
    private invoicesApiService: InvoicesApiService,
    private addEditInvoiceService: AddEditInvoiceService
  ) {}

  ngOnInit(): void {
    this.isTablet$ = this.viewportHelperService.isTablet$;
    this.billTo = this.data?.altBillTo || this.billToLocation;
    this.createForm();
    this.permissions = this.invoicesService.getInvoicePermissions();

    if (this.editMode) {
      this.setPaymentTabTitle();
      this.setInitialData();
    } else {
      this.accounts = this.accounts.filter(item => item.id === this.ARAccount || (!item.system && !item.archived));
      this.openLineItems = this.salesOrder.openLineItems;
    }

    this.initialFormValue = this.form.value;
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setPaymentTabTitle() {
    this.paymentsTabTitle = `Payments - ${formatCurrency(this?.data?.paymentAmountSum, this.localeId, '$')}`;
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

  stateBadgeClass(state: ARInvoiceStateEnum) {
    switch (state) {
      case ARInvoiceStateEnum.DRAFT:
        return Badge.primary;
      case ARInvoiceStateEnum.CLOSED:
        return Badge.success;
      case ARInvoiceStateEnum.ISSUED:
        return Badge.warning;
      case ARInvoiceStateEnum['CLOSED_WRITE_OFF']:
        return Badge.danger;
      case ARInvoiceStateEnum.VOIDED:
        return Badge.secondary;
    }
  }

  reviewStateBadgeClass(reviewState: ARInvoiceReviewStateEnum) {
    switch (reviewState) {
      case ARInvoiceReviewStateEnum.NONE:
        return Badge.secondary;
      case ARInvoiceReviewStateEnum.REVIEW:
        return Badge.primary;
      case ARInvoiceReviewStateEnum.APPROVED:
        return Badge.success;
      case ARInvoiceReviewStateEnum.REJECT:
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
      this.editInvoice();
    } else {
      this.addInvoice();
    }
  }

  emitResult(entity?: ARInvoice): void {
    this.resultChange.emit(entity.id);
  }

  get lineItemId() {
    return this.route.snapshot.queryParamMap.get('lineItemId');
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
      return this.invoicesApiService.addInvoiceAttachments(
        this.data.id,
        this.generateAttachmentsPayload(uploadedAttachments)
      );
    }

    return of(this.data);
  };

  private assignLineItemFromSO = (createdInvoice: ARInvoice) => {
    const queryParamLineItemId = this.route.snapshot.queryParamMap.get('lineItemId');
    const openLineItemIds = queryParamLineItemId
      ? [queryParamLineItemId]
      : this.openLineItems.map(lineItem => lineItem.id);
    if (openLineItemIds.length) {
      const assignLineItemPayload = {
        salesOrderId: this.salesOrder.id,
        lineItemIds: openLineItemIds
      };
      return this.invoicesApiService.addInvoiceLineItemFromSalesOrder(createdInvoice.id, assignLineItemPayload);
    }
    return of(createdInvoice);
  };

  private addInvoice() {
    const payload = this.getNormalizedCreatePayload();

    this.invoicesService
      .addInvoice(payload)
      .pipe(
        concatMap(this.assignLineItemFromSO),
        concatMap(createdInvoice => {
          this.data = createdInvoice;
          if (this.attachments?.length) {
            return this.accountingAttachmentsService.uploadFiles(this.attachments, this.s3KeyPrefix);
          }
          return of(this.data);
        }),
        concatMap(this.saveAttachmentsMetadata),
        catchError(error => {
          this.notificationHelperService.showValidation(error.message);
          return EMPTY;
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(result => {
        if (result) {
          this.emitResult(result);
        }
      });
  }

  private updateInvoice(payload) {
    if (ObjectUtil.isEmptyObject(payload)) {
      return of(null);
    }

    return this.invoicesService.editInvoice(this.data.id, payload);
  }

  private editInvoiceReview(payload) {
    if (!payload) {
      return of(this.data);
    }

    return this.invoicesApiService.editInvoiceReviewState(this.data.id, payload).pipe(
      concatMap(updatedInvoice => {
        if (updatedInvoice.isApproved && updatedInvoice?.isIssued) {
          const InvoicePDFTemplateData: InvoicePdfTemplateData = {
            invoice: updatedInvoice,
            salesOrderNumber: this.salesOrder?.number,
            shipToLocation: this.shipToLocation,
            billToLocation: this.billToLocation
          };
          return this.invoicesService.generateInvoicePDF(InvoicePDFTemplateData);
        }
        if (updatedInvoice.isRejected) {
          return this.invoicesApiService.addInvoiceMilestone(this.data.id, {
            icon: 'note',
            description: payload.reason
          });
        }
      }),
      tap(milestone => {
        this.data.milestones.push(milestone);
      })
    );
  }

  private voidInvoice(state: ARInvoiceStateEnum) {
    if (state !== ARInvoiceStateEnum.VOIDED) {
      return of(this.data);
    }

    return this.invoicesApiService.voidInvoice(this.data.id);
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

  private editInvoice() {
    const { payload, reviewState, state } = this.getNormalizedEditPayload();

    this.addRejectNote(reviewState)
      .pipe(
        concatMap(note => {
          if (reviewState === ARInvoiceReviewStateEnum.REJECT && !note) {
            return of(null);
          }
          const reviewStatePayload = this.getReviewStatePayload(note, reviewState);
          return forkJoin([
            this.updateInvoice(payload),
            this.editInvoiceReview(reviewStatePayload),
            this.voidInvoice(state),
            this.saveAttachments()
          ]);
        }),
        concatMap(result => {
          const updatedInvoice: ARInvoice = result[1];
          if (reviewState === ARInvoiceReviewStateEnum.APPROVED && updatedInvoice?.isIssued) {
            const InvoicePDFTemplateData: InvoicePdfTemplateData = {
              invoice: updatedInvoice,
              salesOrderNumber: this.salesOrder?.number,
              shipToLocation: this.shipToLocation,
              billToLocation: this.billToLocation
            };
            this.invoicesService.generateInvoicePDF(InvoicePDFTemplateData);
          }
          return of(result);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(result => {
        if (result) {
          this.emitResult(this.data);
        }
      });
  }

  editAltBillToLocation() {
    this.dialog
      .open(AltBillToModalComponent, {
        width: '648px',
        disableClose: false,
        data: this.billTo
      })
      .afterClosed()
      .subscribe(altBillToData => {
        if (altBillToData) {
          this.billTo = altBillToData;
          this.form.get('altBillTo').setValue(altBillToData);
          this.cd.markForCheck();
        }
      });
  }

  get isNotEditable() {
    return this.editMode && !this.data?.isDraft;
  }

  get isStateDisabled() {
    return !this.editMode || !this.data?.isApproved || !(this.data?.isDraft || this?.data.isIssued);
  }

  get ARAccount() {
    const receivableAccountId = this.company?.accountingPractices?.defaultAccounts?.accountsReceivable;
    return this.isArchivedAccount(receivableAccountId) ? null : receivableAccountId;
  }

  archivedAccountValidator = (control: FormControl) =>
    this.isArchivedAccount(control.value) ? { system: 'Archived account is not allowed' } : null;

  isArchivedAccount(accountId: string) {
    return this.accounts.find(item => item.id === accountId)?.archived || false;
  }

  private createForm(): void {
    const config = {
      terms: [{ value: this.salesOrder.terms, disabled: this.isNotEditable }],
      description: [{ value: '', disabled: this.isNotEditable }, Validators.maxLength(500)],
      internalNotes: [null, Validators.maxLength(500)],
      externalNotes: [{ value: '', disabled: this.isNotEditable }, Validators.maxLength(500)],
      ARAccount: [
        { value: this.ARAccount, disabled: this.editMode },
        [Validators.required, this.archivedAccountValidator]
      ],
      dueDate: [{ value: '', disabled: this.isNotEditable }, Validators.required],
      altBillTo: [undefined],
      customerRefField: [{ value: '', disabled: this.isNotEditable }, Validators.maxLength(500)],
      state: [{ value: ARInvoiceStateEnum.DRAFT, disabled: this.isStateDisabled }],
      reviewState: [{ value: ARInvoiceReviewStateEnum.NONE, disabled: !this.editMode || this.isNotEditable }]
    };

    this.form = this.fb.group(config);
  }

  stateOptionDisabledTooltip(state: ARInvoiceStateEnum) {
    const currentState = this.data?.state || ARInvoiceStateEnum.DRAFT;

    if (state === currentState || !this.data) {
      return null;
    }

    return this.addEditInvoiceService.validateInvoiceState(state, this.data);
  }

  reviewStateOptionDisabledTooltip(state: ARInvoiceReviewStateEnum) {
    const hasNoLineItems = !this.data?.lineItems?.length;

    switch (state) {
      case ARInvoiceReviewStateEnum.APPROVED:
      case ARInvoiceReviewStateEnum.REJECT: {
        if (!this.permissions.canReview) {
          return `Insufficient Access.`;
        }
        if (state === ARInvoiceReviewStateEnum.APPROVED && hasNoLineItems) {
          return `Can't approve an invoice without line items.`;
        }
        break;
      }
    }

    return null;
  }

  private setInitialData(): void {
    const data = new ARInvoice().init({
      ...this.data,
      altBillTo: undefined
    });

    const { attachments, ...rest } = data;

    this.attachments = attachments;
    this.accounts = this.accounts.filter(
      item => item.id === this.ARAccount || item.id === this.data?.ARAccount || (!item.system && !item.archived)
    );

    this.form.patchValue(rest);
    this.cd.markForCheck();
  }

  private getNormalizedCreatePayload() {
    const { ARAccount, dueDate, terms, altBillTo, description, customerRefField, internalNotes, externalNotes } =
      this.form.value;

    const result = {
      ARAccount,
      dueDate,
      salesOrderId: this.salesOrder.id,
      terms,
      altBillTo: altBillTo && {
        ...altBillTo,
        crmAccountId: this.billToLocation.crmAccountId,
        companyId: this.billToLocation.companyId
      },
      description,
      customerRefField,
      internalNotes,
      externalNotes,
      currency: 'USD'
    };

    return ObjectUtil.deleteEmptyProperties(result, true);
  }

  addRejectNote(reviewState: ARInvoiceReviewStateEnum) {
    if (reviewState === ARInvoiceReviewStateEnum.REJECT) {
      return this.dialog
        .open(AddRejectNoteModalComponent, {
          width: '648px',
          disableClose: false
        })
        .afterClosed();
    }

    return of(null);
  }

  private getReviewStatePayload(note: string, reviewState: ARInvoiceReviewStateEnum) {
    let reviewStatePayload;
    const isApprovedOrReject =
      reviewState === ARInvoiceReviewStateEnum.REJECT || reviewState === ARInvoiceReviewStateEnum.APPROVED;
    if (isApprovedOrReject) {
      reviewStatePayload = { reviewState, reason: note };
    }

    return ObjectUtil.deleteEmptyProperties(reviewStatePayload, true);
  }

  private getNormalizedEditPayload() {
    const { altBillTo, reviewState, state, ...rest } = this.getChangedValues();

    const isApprovedOrReject =
      reviewState === ARInvoiceReviewStateEnum.REJECT || reviewState === ARInvoiceReviewStateEnum.APPROVED;

    const payload = {
      altBillTo: altBillTo && {
        ...altBillTo,
        crmAccountId: this.billToLocation.crmAccountId,
        companyId: this.billToLocation.companyId
      },
      reviewState: isApprovedOrReject ? null : reviewState,
      state: state === ARInvoiceStateEnum.VOIDED ? null : state,
      ...rest
    };

    return {
      payload: ObjectUtil.deleteEmptyProperties(payload, true),
      reviewState: isApprovedOrReject ? reviewState : null,
      state: state === ARInvoiceStateEnum.VOIDED ? state : null
    };
  }

  onPaymentsUpdated() {
    this.setPaymentTabTitle();
  }

  onSelectedOpenLineItemsChange(openLineItems: ARLineItem[]) {
    this.openLineItems = openLineItems;
  }

  removeAttachment(attachmentToRemove: AccountingAttachment) {
    this.accountingAttachmentsService
      .removeFile(attachmentToRemove?.id)
      .pipe(
        first(),
        concatMap(() => this.invoicesApiService.deleteInvoiceAttachment(this.data.id, attachmentToRemove.id)),
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
    return `invoices/${this.data.id}`;
  }
}
