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
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSelect } from '@angular/material/select';
import { DialogModalComponent, DialogType } from '@components/common/modals/dialog-modal/dialog-modal.component';
import { Environment } from '@services/app-layer/app-layer.environment';
import { CrmAccountEntity } from '@services/app-layer/entities/crm';
import { GroupEntity } from '@services/app-layer/entities/group';
import { NotificationHelperService } from '@services/helpers/notification-helper/notification-helper.service';
import { FormGroupHelper } from '@services/helpers/utils/form-group-helper';
import { ObjectUtil } from '@services/helpers/utils/object-util';
import { ViewportHelperService } from '@services/helpers/viewport-helper.service';
import { of, Subject, Observable, EMPTY, forkJoin } from 'rxjs';
import { catchError, concatMap, first, takeUntil } from 'rxjs/operators';
import { APPurchaseOrder } from '@services/app-layer/entities/accounts-payable';
import { DimensionEntity } from '@services/app-layer/entities/dimension';
import { TransformHelper } from '@services/helpers/utils/transform-helper';
import { PurchaseOrdersService } from '@views/main/accounting/accounts-payable/purchase-orders/purchase-orders.service';
import { SelectWithSearchComponent } from '@components/common/inputs/select-with-search/select-with-search.component';
import { PurchaseOrdersApiService } from '@services/app-layer/purchase-orders/purchase-orders-api.service';
import {
  AccountingAttachment,
  AccountingAttachmentsService
} from '@services/app-layer/accounting-attachments/accounting-attachments.service';
import { FacilityEntity } from '@services/app-layer/entities/facility';
import { MemberEntity } from '@services/app-layer/entities/member';

@Component({
  selector: 'app-add-edit-purchase-order',
  templateUrl: './add-edit-purchase-order.component.html',
  styleUrls: ['./add-edit-purchase-order.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddEditPurchaseOrderComponent implements OnInit, OnDestroy {
  @Input() data: APPurchaseOrder;
  @Input() crmAccounts: CrmAccountEntity[] = [];
  @Input() locations: FacilityEntity[] = [];
  @Input() contacts: MemberEntity[] = [];

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

  @Input() dimensions: DimensionEntity[] = [];
  @Input() editMode = false;
  @Output() resultChange = new EventEmitter<string>();
  @Output() back = new EventEmitter<void>();

  @ViewChildren(MatSelect) matSelectItems: QueryList<MatSelect>;
  @ViewChildren(SelectWithSearchComponent) selectWithSearchItems: QueryList<SelectWithSearchComponent>;

  form: FormGroup;
  entryNumber: string;
  attachments = [];

  initialFormValue = {};
  isTablet$: Observable<boolean>;

  public vendorFormGroup: FormGroup;
  public vendorCompany: FormControl;
  public billToContact: FormControl;
  public billToLocation: FormControl;
  public shipToLocation: FormControl;
  public shipToContact: FormControl;

  private _groups: GroupEntity[] = [];
  private destroy$ = new Subject<void>();
  private vendorCompanyId;

  constructor(
    @Inject(LOCALE_ID) private localeId: string,
    private fb: FormBuilder,
    private notificationHelperService: NotificationHelperService,
    private cd: ChangeDetectorRef,
    private purchaseOrdersService: PurchaseOrdersService,
    private purchaseOrdersApiService: PurchaseOrdersApiService,
    private dialog: MatDialog,
    private viewportHelperService: ViewportHelperService,
    private accountingAttachmentsService: AccountingAttachmentsService
  ) {}

  ngOnInit(): void {
    this.isTablet$ = this.viewportHelperService.isTablet$;
    this.createForm();

    if (this.editMode) {
      this.setInitialData();
    } else {
      this.vendorCompany.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(this.onVendorChange);
      this.filterDimensions();
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  isFormValid() {
    return this.form.valid;
  }

  private loadCrmPaymentInfo(accountId: string) {
    this.purchaseOrdersService
      .getCrmPaymentInfo(accountId)
      .pipe(
        first(),
        catchError(({ error }) => {
          if (error.status === 403) {
            this.notificationHelperService.showValidation('Insufficient access for CRM Payment Info');
          }
          return of(null);
        })
      )
      .subscribe(paymentInfo => {
        this.form.get('terms').setValue(paymentInfo.paymentTerms);
      });
  }

  private filterDimensions() {
    this.dimensions = this.dimensions.filter(item => !item.archived);
  }

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

  private setInitialData(): void {
    const { notes = '', group = '', description, vendor, costCenter, terms, attachments } = this.data;

    const config = {
      notes,
      description,
      group,
      vendor,
      dimension: costCenter,
      terms
    };

    this.attachments = attachments;
    this.entryNumber = TransformHelper.getShortHexGuid(this.data.id);

    this.form.patchValue(config);
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

  private getChangedValues() {
    return FormGroupHelper.getChangedValues(this.form.value, this.initialFormValue);
  }

  onSubmit() {
    if (!this.isFormValid()) {
      this.selectWithSearchItems.forEach(item => {
        FormGroupHelper.markControlTouchedAndDirty(item.form);
        item.form.updateValueAndValidity();
      });
      FormGroupHelper.markTouchedAndDirty(this.form);
      return;
    }

    if (this.editMode) {
      this.editPurchaseOrder();
    } else {
      this.addPurchaseOrder();
    }
  }

  emitResult(entity?: APPurchaseOrder): void {
    this.resultChange.emit(entity.id);
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

  private saveAttachmentsMetadata = uploadedAttachments => {
    return this.purchaseOrdersApiService.addPurchaseOrderAttachments(
      this.data.id,
      this.generateAttachmentsPayload(uploadedAttachments)
    );
  };

  private addPurchaseOrder() {
    const payload = this.getNormalizedCreatePayload(this.form.value);

    this.purchaseOrdersApiService
      .addPurchaseOrder(payload)
      .pipe(
        concatMap(createdPurchaseOrder => {
          this.data = createdPurchaseOrder;
          if (this.attachments?.length) {
            return this.accountingAttachmentsService.uploadFiles(this.attachments, this.s3KeyPrefix);
          }
          return of(this.data);
        }),
        concatMap((uploadedAttachments: AccountingAttachment[]) => {
          if (this.attachments?.length) {
            return this.saveAttachmentsMetadata(uploadedAttachments);
          }
          return of(this.data);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(res => {
        if (res) {
          this.emitResult(res);
        }
      });
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

  private editPurchaseOrder(): void {
    const changedValues = this.getChangedValues();

    forkJoin([this.getUpdateEntryRequest(changedValues), this.saveAttachments()])
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        if (data) {
          this.emitResult(data[0]);
        }
      });
  }

  private getUpdateEntryRequest(changedValues) {
    const { description, notes, terms } = changedValues;
    const entry = { description, notes, terms };

    if (ObjectUtil.isEmptyObject(entry)) {
      return of(null);
    }
    return this.purchaseOrdersApiService.editPurchaseOrder(this.data.id, entry);
  }

  private createForm(): void {
    this.vendorCompany = new FormControl({ value: null, disabled: this.editMode }, [Validators.required]);
    this.billToLocation = new FormControl({ value: null, disabled: this.editMode }, [Validators.required]);
    this.billToContact = new FormControl({ value: null, disabled: this.editMode }, [Validators.required]);
    this.shipToLocation = new FormControl({ value: null, disabled: this.editMode }, [Validators.required]);
    this.shipToContact = new FormControl({ value: null, disabled: this.editMode }, [Validators.required]);

    this.vendorFormGroup = new FormGroup({
      company: this.vendorCompany,
      billToLocation: this.billToLocation,
      billToContact: this.billToContact,
      shipToLocation: this.shipToLocation,
      shipToContact: this.shipToContact
    });

    const config = {
      description: ['', [Validators.required, Validators.maxLength(280)]],
      notes: ['', Validators.maxLength(500)],
      group: [{ value: '', disabled: this.editMode }, this.groupRequiredValidator],
      dimension: [{ value: '', disabled: this.editMode }],
      terms: [''],
      vendor: this.vendorFormGroup
    };

    this.form = this.fb.group(config);
    this.initialFormValue = this.form.value;
  }

  private onVendorChange = vendorCompanyId => {
    if (vendorCompanyId !== this.vendorCompanyId) {
      this.vendorCompanyId = vendorCompanyId;
      if (!this.form.get('terms').value) {
        this.loadCrmPaymentInfo(vendorCompanyId);
      }
    }
  };

  getUserGroup = () => {
    const userGroup = Environment.getCurrentUser().group;

    if (!userGroup) {
      return '';
    }

    return this.groups.find(item => item.id === userGroup)?.id || '';
  };

  get isRequiredGroup() {
    if (!this.form) {
      return false;
    }
    return !(this.form.get('group').value === '' && this.getUserGroup() === '');
  }

  groupRequiredValidator = (control: AbstractControl) => (this.isRequiredGroup ? Validators.required(control) : null);

  private getNormalizedCreatePayload(payload) {
    const { group, dimension, ...rest } = payload;
    let groupId;
    if (group) {
      const targetGroup = this.groups.find(item => item.id === group);
      groupId = targetGroup.archived ? '' : group;
    }

    const result = {
      ...rest,
      group: groupId,
      costCenter: dimension,
      currency: 'USD'
    };

    return ObjectUtil.deleteEmptyProperties(result, true);
  }

  removeAttachment(attachmentToRemove: AccountingAttachment) {
    this.accountingAttachmentsService
      .removeFile(attachmentToRemove?.id)
      .pipe(
        concatMap(() =>
          this.purchaseOrdersApiService.deletePurchaseOrderAttachment(this.data.id, attachmentToRemove.id)
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
    return `purchase-orders/${this.data.id}`;
  }
}
