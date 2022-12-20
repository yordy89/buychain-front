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
import { APBillStateEnum } from '@services/app-layer/app-layer.enums';
import { AccountEntity } from '@services/app-layer/entities/account';
import { NotificationHelperService } from '@services/helpers/notification-helper/notification-helper.service';
import { FormGroupHelper } from '@services/helpers/utils/form-group-helper';
import { ObjectUtil } from '@services/helpers/utils/object-util';
import { ViewportHelperService } from '@services/helpers/viewport-helper.service';
import { EMPTY, forkJoin, Observable, of, Subject } from 'rxjs';
import { catchError, concatMap, takeUntil } from 'rxjs/operators';
import { APBill, APPurchaseOrder } from '@services/app-layer/entities/accounts-payable';
import { CompanyDetails } from '@services/data-layer/http-api/base-api/swagger-gen';
import { formatCurrency } from '@angular/common';
import { BillsService } from '@views/main/accounting/accounts-payable/bills/bills.service';
import { MemberEntity } from '@services/app-layer/entities/member';
import { ActivatedRoute } from '@angular/router';
import { BillsApiService } from '@services/app-layer/bills/bills-api.services';
import { GroupEntity } from '@services/app-layer/entities/group';
import { Environment } from '@services/app-layer/app-layer.environment';
import {
  AccountingAttachment,
  AccountingAttachmentsService
} from '@services/app-layer/accounting-attachments/accounting-attachments.service';
import { MilestoneEntity } from '@services/app-layer/entities/transaction';

@Component({
  selector: 'app-add-edit-bill',
  templateUrl: './add-edit-bill.component.html',
  styleUrls: ['./add-edit-bill.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddEditBillComponent implements OnInit, OnDestroy {
  @Input() data: APBill;
  @Input() purchaseOrder: APPurchaseOrder;
  @Input() accounts: AccountEntity[] = [];
  @Input() company: CompanyDetails;
  @Input() members: MemberEntity[];
  @Input() milestones: MilestoneEntity[];
  @Input() editMode = false;

  @Input() set groups(allGroups: GroupEntity[]) {
    let groups = allGroups;
    if (!this.editMode) {
      const userGroup = Environment.getCurrentUser().group;
      groups = allGroups.filter(item => !item.archived || item.id === userGroup);

      if (userGroup) {
        groups = groups.filter(item => item.id);
      }
    }
    this._groups = groups;
  }

  get groups() {
    return this._groups;
  }

  @Output() resultChange = new EventEmitter<string>();
  @Output() back = new EventEmitter<void>();

  @ViewChildren(MatSelect) matSelectItems: QueryList<MatSelect>;
  @ViewChildren(AutocompleteComponent) autocompleteItems: QueryList<AutocompleteComponent>;

  form: FormGroup;

  initialFormValue;
  isTablet$: Observable<boolean>;
  paymentsTabTitle = '';
  attachments = [];

  private _groups: GroupEntity[] = [];
  readonly states = ObjectUtil.enumToArray(APBillStateEnum);

  private destroy$ = new Subject<void>();

  constructor(
    @Inject(LOCALE_ID) private localeId: string,
    private fb: FormBuilder,
    private notificationHelperService: NotificationHelperService,
    private cd: ChangeDetectorRef,
    private billsService: BillsService,
    private billsApiService: BillsApiService,
    private dialog: MatDialog,
    private viewportHelperService: ViewportHelperService,
    private route: ActivatedRoute,
    private accountingAttachmentsService: AccountingAttachmentsService
  ) {}

  ngOnInit(): void {
    this.isTablet$ = this.viewportHelperService.isTablet$;
    this.createForm();

    if (this.editMode) {
      this.setPaymentTabTitle();
      this.setInitialData();
    }

    this.accounts = this.accounts.filter(item => item.id === this.APAccount || (!item.system && !item.archived));

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

  private getChangedValues() {
    return FormGroupHelper.getChangedValues(this.form.value, this.initialFormValue);
  }

  stateBadgeClass(state: APBillStateEnum) {
    switch (state) {
      case APBillStateEnum.DRAFT:
        return Badge.primary;
      case APBillStateEnum.APPROVED:
        return Badge.success;
      case APBillStateEnum.VOIDED:
        return Badge.secondary;
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
      this.editBill();
    } else {
      this.addBill();
    }
  }

  emitResult(entity?: APBill): void {
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

  private addAttachments(uploadedAttachments) {
    return this.billsApiService.addBillAttachments(this.data.id, this.generateAttachmentsPayload(uploadedAttachments));
  }

  private addBill() {
    const payload = this.getNormalizedCreatePayload();

    this.billsApiService
      .addBill(payload)
      .pipe(
        concatMap(createdBill => {
          this.data = createdBill;
          if (this.attachments?.length) {
            return this.accountingAttachmentsService.uploadFiles(this.attachments, this.s3KeyPrefix);
          }
          return of(this.data);
        }),
        concatMap((uploadedAttachments: AccountingAttachment[]) => {
          if (this.attachments?.length) {
            return this.addAttachments(uploadedAttachments);
          }
          return of(this.data);
        }),
        concatMap((createdBill: APBill) => {
          const lineItemId = this.route.snapshot.queryParamMap.get('lineItemId');
          if (lineItemId) {
            const assignLineItemPayload = {
              purchaseOrderId: this.purchaseOrder.id,
              lineItemIds: [lineItemId]
            };
            return this.billsApiService.addBillLineItemFromPurchaseOrder(createdBill.id, assignLineItemPayload);
          }
          return of(createdBill);
        }),
        catchError(({ error }) => {
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

  private saveAttachmentsMetadata = uploadedAttachments => {
    return this.billsApiService.addBillAttachments(this.data.id, this.generateAttachmentsPayload(uploadedAttachments));
  };

  private saveAttachments() {
    const newAttachments = this.attachments.filter(attachment => attachment instanceof File);
    if (newAttachments?.length) {
      return this.accountingAttachmentsService
        .uploadFiles(newAttachments, this.s3KeyPrefix)
        .pipe(concatMap(this.saveAttachmentsMetadata), takeUntil(this.destroy$));
    }

    return of(this.data);
  }

  private editBill() {
    const payload = ObjectUtil.deleteEmptyProperties(this.getChangedValues(), true);

    forkJoin([this.updateBill(payload), this.saveAttachments()])
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.emitResult(this.data);
      });
  }

  private updateBill(payload) {
    if (ObjectUtil.isEmptyObject(payload)) {
      return of(this.data);
    }

    return this.billsApiService.editBill(this.data.id, payload);
  }

  get isNotEditable() {
    return this.editMode && !this.data?.isDraft;
  }

  get isStateDisabled() {
    return !this.editMode;
  }

  get APAccount() {
    const payableAccountId = this.company?.accountingPractices?.defaultAccounts?.accountsPayable;
    return this.isArchivedAccount(payableAccountId) ? null : payableAccountId;
  }

  archivedAccountValidator = (control: FormControl) =>
    this.isArchivedAccount(control.value) ? { system: 'Archived account is not allowed' } : null;

  isArchivedAccount(accountId: string) {
    return this.accounts.find(item => item.id === accountId)?.archived || false;
  }

  private createForm(): void {
    const config = {
      notes: [null, Validators.maxLength(500)],
      APAccount: [
        { value: this.APAccount, disabled: this.isNotEditable },
        [Validators.required, this.archivedAccountValidator]
      ],
      dueDate: ['', Validators.required],
      state: [{ value: APBillStateEnum.DRAFT, disabled: this.isStateDisabled }],
      group: [{ value: '', disabled: this.editMode }, Validators.required]
    };

    this.form = this.fb.group(config);
  }

  get allPaymentsVoided() {
    return this.data?.payments.every(payment => payment.isVoid);
  }

  stateOptionDisabledTooltip(state: APBillStateEnum) {
    const currentState = this.data?.state || APBillStateEnum.DRAFT;

    if (state === currentState) {
      return null;
    }

    const hasNoLineItems = !this.data?.billLineItems?.length;

    switch (state) {
      case APBillStateEnum.APPROVED: {
        if (currentState !== APBillStateEnum.DRAFT) {
          return `Can't set the vendor invoice to ${state} from the state ${currentState}.`;
        }
        if (hasNoLineItems) {
          return `Can't approve a vendor invoice without line items.`;
        }
        break;
      }
      case APBillStateEnum.VOIDED: {
        if (currentState !== APBillStateEnum.APPROVED || !this.allPaymentsVoided) {
          return `Can only void a vendor invoice from the ${APBillStateEnum.APPROVED} state and with all payments VOIDED.`;
        }
        break;
      }
      default:
        return `Can't set the invoice state to ${state}.`;
    }
  }

  private setInitialData(): void {
    const data = new APBill().init({
      ...this.data,
      altBillTo: undefined
    });

    const { attachments, ...rest } = data;

    this.attachments = attachments;
    this.accounts = this.accounts.filter(
      item => item.id === this.APAccount || item.id === this.data?.APAccount || (!item.system && !item.archived)
    );

    this.form.patchValue(rest);
    this.cd.markForCheck();
  }

  private getNormalizedCreatePayload() {
    const { APAccount, dueDate, notes, group } = this.form.value;

    const result = {
      APAccount,
      dueDate,
      purchaseOrderId: this.purchaseOrder.id,
      group,
      notes,
      currency: 'USD',
      vendor: {
        company: this.purchaseOrder.vendor.company,
        location: this.purchaseOrder.vendor.billToLocation,
        contact: this.purchaseOrder.vendor.shipToContact
      }
    };

    return ObjectUtil.deleteEmptyProperties(result, true);
  }

  onPaymentsUpdated() {
    this.setPaymentTabTitle();
  }

  removeAttachment(attachmentToRemove: AccountingAttachment) {
    this.accountingAttachmentsService
      .removeFile(attachmentToRemove?.id)
      .pipe(
        concatMap(() => this.billsApiService.deleteBillAttachment(this.data.id, attachmentToRemove.id)),
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
    return `bills/${this.data.id}`;
  }
}
