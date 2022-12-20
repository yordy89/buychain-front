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
import { Badge } from '@app/constants';
import { DialogModalComponent, DialogType } from '@components/common/modals/dialog-modal/dialog-modal.component';
import { ARSalesOrderStateEnum } from '@services/app-layer/app-layer.enums';
import { Environment } from '@services/app-layer/app-layer.environment';
import { CrmAccountEntity, CrmContactEntity, CrmLocationEntity } from '@services/app-layer/entities/crm';
import { GroupEntity } from '@services/app-layer/entities/group';
import { NotificationHelperService } from '@services/helpers/notification-helper/notification-helper.service';
import { FormGroupHelper } from '@services/helpers/utils/form-group-helper';
import { ObjectUtil } from '@services/helpers/utils/object-util';
import { ViewportHelperService } from '@services/helpers/viewport-helper.service';
import { combineLatest, of, Subject, Observable, EMPTY, forkJoin } from 'rxjs';
import { catchError, concatMap, first, map, takeUntil } from 'rxjs/operators';
import { ARSalesOrder } from '@services/app-layer/entities/accounts-receivable';
import { DimensionEntity } from '@services/app-layer/entities/dimension';
import { TransformHelper } from '@services/helpers/utils/transform-helper';
import { SalesOrdersService } from '@views/main/accounting/accounts-receivable/sales-orders/sales-orders.service';
import { SelectWithSearchComponent } from '@components/common/inputs/select-with-search/select-with-search.component';
import {
  AccountingAttachment,
  AccountingAttachmentsService
} from '@services/app-layer/accounting-attachments/accounting-attachments.service';
import { SalesOrdersApiService } from '@services/app-layer/sales-orders/sales-orders-api.service';

@Component({
  selector: 'app-add-edit-sales-order',
  templateUrl: './add-edit-sales-order.component.html',
  styleUrls: ['./add-edit-sales-order.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddEditSalesOrderComponent implements OnInit, OnDestroy {
  @Input() data: ARSalesOrder;
  @Input() crmAccounts: CrmAccountEntity[] = [];

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

  public customerFormGroup: FormGroup;
  public customerCompany: FormControl;
  public billToContact: FormControl;
  public billToLocation: FormControl;
  public shipToLocation: FormControl;
  public shipToContact: FormControl;

  public locations: CrmLocationEntity[] = [];
  public contacts: CrmContactEntity[] = [];
  private _groups: GroupEntity[] = [];
  private destroy$ = new Subject<void>();
  private customerCompanyId;

  constructor(
    @Inject(LOCALE_ID) private localeId: string,
    private fb: FormBuilder,
    private notificationHelperService: NotificationHelperService,
    private cd: ChangeDetectorRef,
    private salesOrdersService: SalesOrdersService,
    private dialog: MatDialog,
    private viewportHelperService: ViewportHelperService,
    private accountingAttachmentsService: AccountingAttachmentsService,
    private salesOrdersApiService: SalesOrdersApiService
  ) {}

  ngOnInit(): void {
    this.isTablet$ = this.viewportHelperService.isTablet$;
    this.createForm();

    if (this.editMode) {
      this.setInitialData();
    } else {
      this.customerCompany.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(this.onCustomerChange);
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

  private loadCrmLocations(accountId: string, includeArchived = false) {
    return this.salesOrdersService.getCrmLocations(includeArchived).pipe(
      first(),
      map(locations => {
        this.locations = locations.filter(entity => entity.crmAccountId === accountId);
      })
    );
  }

  private loadCrmContacts(accountId: string, includeArchived = false) {
    return this.salesOrdersService.getCrmContacts(includeArchived).pipe(
      first(),
      map(contacts => {
        this.contacts = contacts.filter(entity => entity.crmAccountId === accountId);
      })
    );
  }

  private loadCrmPaymentInfo(accountId: string) {
    return this.salesOrdersService.getCrmPaymentInfo(accountId).pipe(
      first(),
      map(paymentInfo => {
        this.form.get('terms').setValue(paymentInfo.paymentTerms);
      })
    );
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
    const { notes = '', group = '', description, customer, costCenter, terms, attachments } = this.data;

    const config = {
      notes,
      description,
      group,
      customer,
      dimension: costCenter,
      terms
    };

    this.attachments = attachments;

    const load$ = [];

    load$.push(this.loadCrmLocations(customer.company, true));
    load$.push(this.loadCrmContacts(customer.company, true));

    combineLatest(load$)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.form.patchValue(config);
        this.initialFormValue = this.form.value;
      });

    this.entryNumber = TransformHelper.getShortHexGuid(this.data.id);
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
      this.editSalesOrder();
    } else {
      this.addSalesOrder();
    }
  }

  emitResult(entity?: ARSalesOrder): void {
    this.resultChange.emit(entity.id);
  }

  statusBadgeClass(status: ARSalesOrderStateEnum) {
    switch (status) {
      case ARSalesOrderStateEnum.OPEN:
        return Badge.primary;
      case ARSalesOrderStateEnum.PENDING_CLOSE:
        return Badge.warning;
      case ARSalesOrderStateEnum.CLOSED:
        return Badge.success;
      default:
        return '';
    }
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

  private addSalesOrder() {
    const payload = this.getNormalizedCreatePayload(this.form.value);

    this.salesOrdersService
      .addSalesOrder(payload)
      .pipe(
        concatMap(createdSalesOrder => {
          this.data = createdSalesOrder;
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

  private saveAttachmentsMetadata = (uploadedAttachments: AccountingAttachment[]) =>
    this.salesOrdersApiService.addSalesOrderAttachments(
      this.data.id,
      this.generateAttachmentsPayload(uploadedAttachments)
    );

  private saveAttachments() {
    const newAttachments = this.attachments.filter(attachment => attachment instanceof File);
    if (newAttachments?.length) {
      return this.accountingAttachmentsService
        .uploadFiles(newAttachments, this.s3KeyPrefix)
        .pipe(concatMap(this.saveAttachmentsMetadata), takeUntil(this.destroy$));
    }

    return of(null);
  }

  private editSalesOrder(): void {
    const changedValues = this.getChangedValues();

    forkJoin([this.getUpdateEntryRequest(changedValues), this.saveAttachments()])
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.emitResult(this.data);
      });
  }

  private getUpdateEntryRequest(changedValues) {
    if (ObjectUtil.isEmptyObject(changedValues)) {
      return of(null);
    }
    return this.salesOrdersService.editSalesOrder(this.data.id, changedValues);
  }

  private createForm(): void {
    this.customerCompany = new FormControl({ value: null, disabled: this.editMode }, [Validators.required]);
    this.billToLocation = new FormControl({ value: null, disabled: true }, [Validators.required]);
    this.billToContact = new FormControl({ value: null, disabled: true }, [Validators.required]);
    this.shipToLocation = new FormControl({ value: null, disabled: true }, [Validators.required]);
    this.shipToContact = new FormControl({ value: null, disabled: true }, [Validators.required]);

    this.customerFormGroup = new FormGroup({
      company: this.customerCompany,
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
      customer: this.customerFormGroup
    };

    this.form = this.fb.group(config);
    this.initialFormValue = this.form.value;
  }

  private onCustomerChange = customerCompanyId => {
    if (customerCompanyId !== this.customerCompanyId) {
      this.customerCompanyId = customerCompanyId;
      const load$ = [];

      if (!this.form.get('terms').value) {
        load$.push(this.loadCrmPaymentInfo(customerCompanyId));
      }

      load$.push(this.loadCrmLocations(customerCompanyId));
      load$.push(this.loadCrmContacts(customerCompanyId));

      combineLatest(load$)
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          this.billToLocation.enable({ emitEvent: false });
          this.billToContact.enable({ emitEvent: false });
          this.shipToLocation.enable({ emitEvent: false });
          this.shipToContact.enable({ emitEvent: false });
          this.billToLocation.reset();
          this.billToContact.reset();
          this.shipToLocation.reset();
          this.shipToContact.reset();
          this.setSelectedCustomerDefaultBillTo();
        });
    }
  };

  private setSelectedCustomerDefaultBillTo() {
    const selectedCustomer = this.crmAccounts.find(x => x.id === this.customerCompany.value);
    if (!selectedCustomer) return;

    this.billToLocation.setValue(selectedCustomer.defaultBillToLocation);
    this.billToContact.setValue(selectedCustomer.defaultBillToContact);
  }

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
        concatMap(() => this.salesOrdersApiService.deleteSalesOrderAttachment(this.data.id, attachmentToRemove.id)),
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
    return `sales-orders/${this.data.id}`;
  }
}
