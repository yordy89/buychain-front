import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  QueryList,
  ViewChildren,
  SimpleChanges
} from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSelect } from '@angular/material/select';
import { Badge } from '@app/constants';
import { DialogModalComponent, DialogType } from '@components/common/modals/dialog-modal/dialog-modal.component';
import { AutocompleteComponent } from '@directives/autocomplete/autocomplete.component';
import {
  AccountingJournalReviewStatusEnum,
  AccountingJournalSourceEnum,
  AccountingJournalStatusEnum,
  AccountingJournalTypeEnum
} from '@services/app-layer/app-layer.enums';
import { Environment } from '@services/app-layer/app-layer.environment';
import { AccountEntity } from '@services/app-layer/entities/account';
import { CrmAccountEntity } from '@services/app-layer/entities/crm';
import { DimensionEntity } from '@services/app-layer/entities/dimension';
import { GroupEntity } from '@services/app-layer/entities/group';
import { JournalEntryEntity } from '@services/app-layer/entities/journal-entries';
import { MemberEntity } from '@services/app-layer/entities/member';
import { JournalEntriesApiService } from '@services/app-layer/journal-entries/journal-entries-api.service';
import { NotificationHelperService } from '@services/helpers/notification-helper/notification-helper.service';
import { FormGroupHelper } from '@services/helpers/utils/form-group-helper';
import { ObjectUtil } from '@services/helpers/utils/object-util';
import { TransformHelper } from '@services/helpers/utils/transform-helper';
import { ViewportHelperService } from '@services/helpers/viewport-helper.service';
import { combineLatest, EMPTY, of, Subject, Observable, forkJoin } from 'rxjs';
import {
  catchError,
  concatMap,
  debounceTime,
  distinctUntilChanged,
  filter,
  first,
  map,
  takeUntil,
  takeWhile,
  tap
} from 'rxjs/operators';
import { addDays, isValid } from 'date-fns';
import {
  AccountingAttachment,
  AccountingAttachmentsService
} from '@services/app-layer/accounting-attachments/accounting-attachments.service';
import { JournalEntriesService } from '@views/main/accounting/financial/journal-entries/journal-entries.service';

@Component({
  selector: 'app-add-edit-journal-entry',
  templateUrl: './add-edit-journal-entry.component.html',
  styleUrls: ['./add-edit-journal-entry.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddEditJournalEntryComponent implements OnInit, OnDestroy, OnChanges {
  @Input() data: JournalEntryEntity;
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
    this._lineGroups = groups.filter(item => item.id);
  }

  get groups() {
    if (this.form && !this.editMode && this.interCompanies?.length) {
      let groups = this._groups;
      this.interCompanies.controls
        .map(form => form.value.group)
        .filter(val => !!val)
        .forEach(groupId => {
          groups = this.skipGroupFromList(groupId, groups);
        });

      return groups;
    }
    return this._groups;
  }

  get lineGroups() {
    const selectedGroup = this.form?.get('group').value;

    if (!this.editMode && selectedGroup) {
      return this.skipGroupFromList(selectedGroup, this._lineGroups);
    }
    return this._lineGroups;
  }

  @Input() accounts: AccountEntity[] = [];
  @Input() dimensions: DimensionEntity[] = [];
  @Input() members: MemberEntity[] = [];
  @Input() editMode = false;
  @Output() resultChange = new EventEmitter<JournalEntryEntity>();
  @Output() back = new EventEmitter<void>();

  @ViewChildren(MatSelect) matSelectItems: QueryList<MatSelect>;
  @ViewChildren(AutocompleteComponent) autocompleteItems: QueryList<AutocompleteComponent>;

  form: FormGroup;
  entryNumber: string;
  attachments = [];

  initialFormValue = {};
  isTablet$: Observable<boolean>;
  filteredAccounts: AccountEntity[] = [];

  readonly typesEnum = AccountingJournalTypeEnum;
  readonly types = ObjectUtil.enumToArray(AccountingJournalTypeEnum);
  readonly statuses = ObjectUtil.enumToArray(AccountingJournalStatusEnum);

  private entryDescriptionValue = null;
  private hasSelectedSystemAccounts = true;
  private hasSelectedArchivedAccounts = true;
  private totalDifferenceHasError = false;
  private _groups: GroupEntity[] = [];
  private _lineGroups: GroupEntity[] = [];
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private notificationHelperService: NotificationHelperService,
    private cd: ChangeDetectorRef,
    private journalEntriesApiService: JournalEntriesApiService,
    private journalEntriesService: JournalEntriesService,
    private dialog: MatDialog,
    private viewportHelperService: ViewportHelperService,
    private zone: NgZone,
    private accountingAttachmentsService: AccountingAttachmentsService
  ) {}

  ngOnInit(): void {
    this.isTablet$ = this.viewportHelperService.isTablet$;
    this.createForm();
    this.listenFormValueChanges();
    this.handleEmptyLineAccountValidation();

    if (this.editMode) {
      this.handleLineControlsAccountChange();
      this.setInitialData();
      this.interCompanies.disable();
      this.filterAccounts();
    } else {
      this.filterDimensions();
    }

    this.initialFormValue = this.form.value;
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnChanges({ accounts }: SimpleChanges) {
    if (accounts?.currentValue) {
      this.filterAccounts();
    }
  }

  isFormValid() {
    return this.form.valid;
  }

  getControlFromGroup(ctrl, ctrlName): FormControl {
    return ctrl.get(ctrlName);
  }

  skipGroupFromList(selectedGroup, list: GroupEntity[]) {
    return list
      .filter(item => item.id !== selectedGroup)
      .map(group => {
        if (group.parentTree.includes(selectedGroup)) {
          const newTreeList = group.parentTree.filter(el => el !== selectedGroup);
          group = new GroupEntity().init({ ...group, parentTree: newTreeList });
        }

        if (group.parent === selectedGroup) {
          const newParentGroup = group.parentTree[group.parentTree.length - 1];
          group = new GroupEntity().init({ ...group, parent: newParentGroup });
        }

        return group;
      });
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

      if (this.editMode) {
        this.emitResult();
      } else {
        this.back.emit();
      }
    });
  }

  onEnter(event) {
    event.preventDefault();

    const items = this.getOrderedControlNodes();
    let targetIndex = items.findIndex(item => item === event.target);
    const targetElem = items.find(item => item === event.target);

    if (!targetElem) {
      return;
    }

    if (this.canAddNewLine(targetElem)) {
      this.onAddLine();
      this.delayedFocus(targetIndex);
      return;
    }

    if (this.canAddNewICLine(targetElem)) {
      this.onAddInterCompanyLine();
      this.delayedFocus(targetIndex);
      return;
    }

    targetIndex++;
    items[targetIndex]?.focus();
  }

  private delayedFocus(targetIndex) {
    this.zone.onStable.pipe(debounceTime(100), first(), takeUntil(this.destroy$)).subscribe(() => {
      const items = this.getOrderedControlNodes();
      targetIndex++;
      items[targetIndex]?.focus();
    });
  }

  onFocusAmount(ctrl: AbstractControl) {
    if (ctrl.value === 0) {
      ctrl.setValue(null, { emitEvent: false });
    }
  }

  onBlurDebitCredit(currentControl: AbstractControl, relatedControl: AbstractControl) {
    if (currentControl.value === null) {
      currentControl.setValue(0, { emitEvent: false });
      currentControl.markAsDirty();
    } else if (currentControl.value !== 0 && relatedControl.value !== 0) {
      relatedControl.setValue(0, { emitEvent: false });
      relatedControl.markAsDirty();
    } else if (currentControl.value === 0) {
      currentControl.updateValueAndValidity({ emitEvent: false });
    } else if (relatedControl.value === 0) {
      relatedControl.updateValueAndValidity({ emitEvent: false });
    }
  }

  onBlurAmount(ctrl: AbstractControl) {
    if (ctrl.value === null) {
      ctrl.setValue(0, { emitEvent: false });
    }
  }

  private canAddNewLine(targetElem) {
    const lastLine = this.lines.value.reverse()[0];
    return (
      targetElem.getAttribute('formControlName') === 'credit' &&
      targetElem === this.getJournalLinesRowControls().reverse()[0] &&
      lastLine.account &&
      lastLine.description
    );
  }

  private canAddNewICLine(targetElem) {
    if (!this.isAllowedInterCompanies || !this.interCompanies.length) {
      return false;
    }
    const lastLineControl = this.interCompanies.at(this.interCompanies.length - 1) as FormGroup;
    if (!lastLineControl) {
      return false;
    }
    const amount = lastLineControl.get('amount').value;

    return (
      (targetElem.getAttribute('formControlName') === 'amount' &&
        lastLineControl.get('group').valid &&
        lastLineControl.get('description').valid &&
        amount === 0) ||
      amount === null
    );
  }

  private getOrderedControlNodes() {
    const selectors = ['input', 'textarea', 'select', 'mat-select'].join(', ');

    const descriptionRowElems = Array.from(document.querySelector('.description-row').querySelectorAll(selectors));
    const notesRowElems = Array.from(document.querySelector('.notes-row').querySelectorAll(selectors));
    let icLinesRowElems = [];

    if (this.isAllowedInterCompanies) {
      icLinesRowElems = Array.from(document.querySelector('.ic-lines-section').querySelectorAll(selectors));
    }

    const nodes = []
      .concat(this.getTopRowControls(selectors))
      .concat(descriptionRowElems)
      .concat(this.getJournalLinesRowControls())
      .concat(icLinesRowElems)
      .concat(notesRowElems);

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

  private getJournalLinesRowControls() {
    const selectors = ['input', 'textarea', 'select', 'mat-select'].join(', ');
    return Array.from(document.querySelector('.journal-lines-section').querySelectorAll(selectors));
  }

  private getChangedValues() {
    const { lines, ...data } = this.form.value;
    const result = { ...data };

    if (lines) {
      result['lines'] = lines.filter(line => line.account && line.description);
    }

    return FormGroupHelper.getChangedValues(result, this.initialFormValue);
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

    const linesCount = this.lines.length;

    if (linesCount < 2 || linesCount > 30) {
      this.notificationHelperService.showValidation('Journal Lines count must be between 2 and 30.');
      return;
    }

    if (this.isAllowedInterCompanies && this.interCompanies.length > 10) {
      this.notificationHelperService.showValidation('Inter-company lines count must be less or equal to 10.');
      return;
    }

    if (this.totalDifference !== 0) {
      const message = this.interCompanies.length
        ? 'The sum of credits of all lines must equal the sum of the debits plus the sum of the inter-company amounts'
        : 'Total Difference between Debit and Credit must be equal to 0.';

      this.notificationHelperService.showValidation(message);
      this.handleTotalDifferenceError();
      return;
    }

    if (this.editMode) {
      this.editJournalEntry();
    } else {
      this.addJournalEntry();
    }
  }

  private handleTotalDifferenceError() {
    if (this.totalDifferenceHasError) {
      return;
    }

    this.totalDifferenceHasError = true;

    const triggerAmountControlsValidation = () => {
      this.lines.controls.forEach(group => {
        group.get('credit').markAsTouched();
        group.get('credit').updateValueAndValidity();
        group.get('debit').markAsTouched();
        group.get('debit').updateValueAndValidity();
      });

      if (!this.editMode) {
        this.interCompanies.controls.forEach(group => {
          group.get('amount').markAsTouched();
          group.get('amount').updateValueAndValidity();
        });
      }
    };

    triggerAmountControlsValidation();

    this.lines.valueChanges
      .pipe(
        filter(() => this.totalDifference === 0),
        first(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.totalDifferenceHasError = false;
        triggerAmountControlsValidation();
      });
  }

  emitResult(entity?: JournalEntryEntity): void {
    this.resultChange.emit(entity);
  }

  statusBadgeClass(status) {
    switch (status) {
      case AccountingJournalStatusEnum.APPROVED:
        return Badge.success;
      case AccountingJournalStatusEnum.DRAFT:
        return Badge.primary;
      case AccountingJournalStatusEnum.REJECTED:
        return Badge.danger;
      case AccountingJournalStatusEnum.UNDER_REVIEW:
        return Badge.warning;
      default:
        return '';
    }
  }

  get isVisible4thColumn() {
    return this.data && !this.data.isManual;
  }

  get filteredStatuses() {
    if (!this.data || this.data.status === AccountingJournalStatusEnum.DRAFT) {
      return this.statuses;
    }
    return this.statuses.filter(item => item !== AccountingJournalStatusEnum.DRAFT);
  }

  get source() {
    return this.editMode
      ? this.data?.displaySource
      : TransformHelper.stringUnderscoreToSpaceTitleCase(AccountingJournalSourceEnum.MANUAL);
  }

  private handleLineControlsAccountChange() {
    const observables = this.lines.controls.map(item =>
      item.valueChanges.pipe(
        map(line => line.account),
        distinctUntilChanged()
      )
    );
    combineLatest(observables)
      .pipe(
        debounceTime(300),
        takeWhile(() => this.hasSelectedSystemAccounts || this.hasSelectedArchivedAccounts),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.filterAccounts();
      });
  }

  private handleEmptyLineAccountValidation() {
    this.lines.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(values => {
      values.forEach((value, index) => {
        if (!value.account) {
          this.lines.at(index).get('account').updateValueAndValidity({ emitEvent: false });
        }
      });
    });
  }

  private filterAccounts() {
    let filteredAccounts: any[];

    if (
      this.editMode &&
      (this.hasSelectedSystemAccounts || this.hasSelectedArchivedAccounts) &&
      this.form &&
      this.lines?.length
    ) {
      const accountIds = this.lines.getRawValue().map(item => item.account);
      this.hasSelectedSystemAccounts = accountIds.some(id => this.isSystemAccount(id));
      this.hasSelectedArchivedAccounts = accountIds.some(id => this.isArchivedAccount(id));
      filteredAccounts = this.accounts.filter(item => accountIds.includes(item.id) || (!item.system && !item.archived));
    } else {
      filteredAccounts = this.accounts.filter(item => !item.system && !item.archived);
    }

    if (this.isDifferentAccountIds(filteredAccounts)) {
      this.filteredAccounts = filteredAccounts;
    }
  }

  private filterDimensions() {
    this.dimensions = this.dimensions.filter(item => !item.archived);
  }

  private isDifferentAccountIds(newFilteredAccounts: AccountEntity[]) {
    const newIds = newFilteredAccounts.sort((a, b) => a.id.localeCompare(b.id)).map(item => item.id);
    const ids = this.filteredAccounts.sort((a, b) => a.id.localeCompare(b.id)).map(item => item.id);
    return Array.from(new Set(newIds)).toString() !== Array.from(new Set(ids)).toString();
  }

  removeAttachment(attachmentToRemove: AccountingAttachment) {
    this.accountingAttachmentsService
      .removeFile(attachmentToRemove?.id)
      .pipe(
        concatMap(() =>
          this.journalEntriesApiService.deleteJournalEntryAttachment(this.data.id, attachmentToRemove.id)
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
    return `journal-entries/${this.data.id}`;
  }

  private addJournalEntry() {
    const payload = this.getNormalizedCreatePayload(this.form.value);

    this.journalEntriesApiService
      .addJournalEntry(payload)
      .pipe(
        concatMap(createdJournalEntry => {
          this.data = createdJournalEntry;
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

  private saveAttachmentsMetadata = (uploadedAttachments: AccountingAttachment[]) =>
    this.journalEntriesApiService.addJournalEntryAttachments(
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

  editJournalEntry(): void {
    forkJoin([this.getUpdateEntryRequest(), this.saveAttachments()])
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        if (data) {
          this.emitResult(data[0]);
        }
      });
  }

  private getUpdateEntryRequest() {
    const changedValues = this.getChangedValues();

    let entryResp = null;

    return this.updateJournalEntry(changedValues).pipe(
      tap(resp => (entryResp = resp)),
      concatMap(() => this.getUpdateLinesRequest(changedValues)),
      map(linesResp => {
        if (entryResp && linesResp) {
          return linesResp;
        }

        return entryResp || linesResp;
      }),
      concatMap(resp => {
        if (changedValues.status !== AccountingJournalStatusEnum.APPROVED) {
          return of(resp);
        }

        return this.journalEntriesApiService.approveJournalEntry(this.data.id);
      })
    );
  }

  private updateJournalEntry(payload) {
    const { status, ...rest } = payload;
    const entry = {};
    ['description', 'notes', 'postDate', 'reverseDate'].forEach(key => {
      if (key in rest) {
        entry[key] = rest[key];
      }
    });

    if ('status' in payload) {
      if (status === AccountingJournalStatusEnum.REJECTED) {
        entry['reviewStatus'] = AccountingJournalReviewStatusEnum.REJECT;
      } else if (status === AccountingJournalStatusEnum.UNDER_REVIEW) {
        entry['reviewStatus'] = AccountingJournalReviewStatusEnum.REQUEST;
      }
    }

    if (ObjectUtil.isEmptyObject(entry)) {
      return of(null);
    }

    return this.journalEntriesApiService.editJournalEntry(this.data.id, entry);
  }

  private getUpdateLinesRequest(changedValues) {
    return ['lines'].some(key => key in changedValues)
      ? this.journalEntriesApiService.editJournalEntryLines(
          this.data.id,
          this.getNormalizedUpdateEntryLinePayload(this.form.value)
        )
      : of(null);
  }

  private createForm(): void {
    const config = {
      type: [{ value: '', disabled: this.editMode }, Validators.required],
      status: [{ value: AccountingJournalStatusEnum.DRAFT, disabled: !this.editMode }],
      description: [this.entryDescriptionValue, [Validators.required, Validators.maxLength(280)]],
      notes: [null, Validators.maxLength(500)],
      postDate: ['', Validators.required],
      group: [{ value: this.getUserGroup(), disabled: this.editMode }, this.groupRequiredValidator],
      dimensions: [{ value: [], disabled: this.editMode }],
      lines: this.fb.array([this.getNewLineGroup(), this.getNewLineGroup()]),
      interCompanies: this.fb.array([])
    };

    this.form = this.fb.group(config);
  }

  getUserGroup = () => {
    const userGroup = Environment.getCurrentUser().group;

    if (!userGroup) {
      return '';
    }

    return this.groups.find(item => item.id === userGroup)?.id || '';
  };

  groupRequiredValidator = (control: AbstractControl) => (this.isRequiredGroup ? Validators.required(control) : null);

  systemAccountValidator = (control: FormControl) =>
    this.isSystemAccount(control.value) ? { system: 'System account is not allowed' } : null;
  archivedAccountValidator = (control: FormControl) =>
    this.isArchivedAccount(control.value) ? { system: 'Archived account is not allowed' } : null;

  requiredAccountValidator = (control: FormControl) => {
    if (!control.parent) {
      return null;
    }

    if (this.isRequiredAccount(control.parent.value)) {
      return { required: true };
    }

    return null;
  };

  isRequiredAccount = ({ account, debit, credit }) => !account && (debit || credit);

  isSystemAccount(accountId: string) {
    return this.accounts.find(item => item.id === accountId)?.system || false;
  }

  isArchivedAccount(accountId: string) {
    return this.accounts.find(item => item.id === accountId)?.archived || false;
  }

  get isRequiredGroup() {
    if (!this.form) {
      return false;
    }
    return !(this.form.get('group').value === '' && this.getUserGroup() === '');
  }

  private getNewLineGroup() {
    const required = this.isRequiredLineItems ? [Validators.required] : [];
    const debitValidators = this.isRequiredLineItems
      ? [Validators.min(0), this.debitCreditCrossValidator('credit'), this.totalDifferenceValidator]
      : [Validators.min(0), this.totalDifferenceValidator];

    const creditValidators = this.isRequiredLineItems
      ? [Validators.min(0), this.debitCreditCrossValidator('debit'), this.totalDifferenceValidator]
      : [Validators.min(0), this.totalDifferenceValidator];

    return this.fb.group({
      account: [
        '',
        [...required, this.systemAccountValidator, this.archivedAccountValidator, this.requiredAccountValidator]
      ],
      debit: [
        0,
        {
          updateOn: 'blur',
          validators: debitValidators
        }
      ],
      credit: [
        0,
        {
          updateOn: 'blur',
          validators: creditValidators
        }
      ],
      description: [this.entryDescriptionValue, [...required, Validators.maxLength(500)]]
    });
  }

  get isRequiredLineItems() {
    return !this.form;
  }

  private getNewInterCompanyLineGroup() {
    return this.fb.group({
      group: ['', Validators.required],
      amount: [
        0,
        {
          updateOn: 'blur',
          validators: [Validators.required, Validators.min(0), this.totalDifferenceValidator]
        }
      ],
      description: [this.entryDescriptionValue, [Validators.required, Validators.maxLength(280)]]
    });
  }

  private totalDifferenceValidator = () => (this.totalDifferenceHasError ? { totalDifferenceError: true } : null);

  private setInitialData(): void {
    const {
      type,
      notes = '',
      group = '',
      dimensions = [],
      lines,
      reverseDate,
      description,
      interCompanies,
      attachments = [],
      ...rest
    } = this.data;
    const filteredLines = lines.filter(item => item.isStandard);
    const config = {
      ...rest,
      type,
      notes,
      description,
      group,
      dimensions,
      lines: filteredLines,
      interCompanies
    };
    this.entryDescriptionValue = description;
    this.attachments = attachments;

    if (type === this.typesEnum.REVERSING) {
      config['reverseDate'] = reverseDate;
    }

    while (this.lines.length < filteredLines.length) {
      this.onAddLine();
    }

    if (this.isAllowedInterCompanies) {
      while (this.interCompanies.length < interCompanies.length) {
        this.onAddInterCompanyLine();
      }
    }

    this.entryNumber = TransformHelper.getShortHexGuid(this.data.id);
    this.form.patchValue(config);
  }

  get minReverseDate() {
    let postDate = this.form.get('postDate')?.value;
    if (!postDate) {
      return null;
    }

    postDate = new Date(postDate);

    if (!isValid(postDate)) {
      return null;
    }

    return addDays(postDate, 1);
  }

  private debitCreditCrossValidator(field: string) {
    return (ctrl: AbstractControl) => {
      if (!ctrl.parent) {
        return null;
      }

      if (ctrl.parent.get(field).value === 0 && !(ctrl.value > 0)) {
        return {
          greater: {
            greater: true
          }
        };
      }

      return null;
    };
  }

  get lines() {
    return this.form.get('lines') as FormArray;
  }

  get interCompanies() {
    return this.form.get('interCompanies') as FormArray;
  }

  get totalDebit() {
    const debit = this.lines.value.reduce((acc, curr) => acc + curr.debit || 0, 0);

    if (!this.isAllowedInterCompanies) {
      return debit;
    }

    const icAmount = this.interCompanies.value.reduce((acc, curr) => acc + curr.amount || 0, 0);
    return debit + icAmount;
  }

  get totalCredit() {
    return this.lines.value.reduce((acc, curr) => acc + curr.credit || 0, 0);
  }

  get totalDifference() {
    return this.totalDebit - this.totalCredit;
  }

  onAddLine() {
    this.lines.push(this.getNewLineGroup());
  }

  onAddInterCompanyLine() {
    this.interCompanies.push(this.getNewInterCompanyLineGroup());
  }

  onRemoveLine(index) {
    this.lines.removeAt(index);
  }

  onRemoveInterCompanyLine(index) {
    this.interCompanies.removeAt(index);
  }

  get type() {
    return this.editMode ? this.data?.type : this.form.get('type').value;
  }

  get isAllowedInterCompanies() {
    return this.type === this.typesEnum.STANDARD;
  }

  private getNormalizedCreatePayload(payload) {
    const { lines, group, interCompanies, ...rest } = payload;
    let resultLines = Object.keys(lines).map(key => lines[key]);
    resultLines = resultLines.filter(line => line.account && line.description);

    let resultGroup = group;
    if (group) {
      const targetGroup = this.groups.find(item => item.id === group);
      resultGroup = targetGroup.archived ? '' : group;
    }

    const result = {
      ...rest,
      group: resultGroup,
      lines: resultLines
    };

    if (this.isAllowedInterCompanies) {
      result['interCompanies'] = interCompanies;
    }

    return ObjectUtil.deleteEmptyProperties(result, true);
  }

  private getNormalizedUpdateEntryLinePayload({ lines }) {
    return {
      lines: Object.keys(lines)
        .map(key => lines[key])
        .map(line => ObjectUtil.deleteEmptyProperties(line))
    };
  }

  onBlurDescription() {
    const newDescription = this.form.get('description').value;

    this.lines.controls.forEach(ctrl => {
      this.setDescriptionValue(ctrl, newDescription);
    });

    this.interCompanies.controls.forEach(ctrl => {
      this.setDescriptionValue(ctrl, newDescription);
    });

    this.entryDescriptionValue = newDescription;
  }

  private setDescriptionValue(ctrl, newDescription) {
    if (ctrl.get('description').value === this.entryDescriptionValue) {
      ctrl.get('description').setValue(newDescription, { emitEvent: false });
    }
  }

  private listenFormValueChanges() {
    if (this.editMode) {
      this.handleReverseDateControl();
    } else {
      this.form
        .get('type')
        .valueChanges.pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          this.handleReverseDateControl();
        });
    }
  }

  private handleReverseDateControl() {
    if (this.type === this.typesEnum.REVERSING) {
      this.form.addControl('reverseDate', this.fb.control('', Validators.required));
    } else {
      this.form.removeControl('reverseDate');
    }
  }
}
