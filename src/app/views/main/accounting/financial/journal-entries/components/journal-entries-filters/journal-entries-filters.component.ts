import { ChangeDetectionStrategy, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import {
  AccountingJournalSourceEnum,
  AccountingJournalStatusEnum,
  AccountingJournalTypeEnum
} from '@services/app-layer/app-layer.enums';
import { AccountEntity } from '@services/app-layer/entities/account';
import { DimensionEntity } from '@services/app-layer/entities/dimension';
import { GroupEntity } from '@services/app-layer/entities/group';
import { MemberEntity } from '@services/app-layer/entities/member';
import { ObjectUtil } from '@services/helpers/utils/object-util';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

interface JournalEntriesFilters {
  group: string;
  includeChildGroups: boolean;
  source: string[];
  type: string[];
  postDateFrom: string;
  postDateTo: string;
  reverseDateFrom: string;
  reverseDateTo: string;
  approvalDateFrom: string;
  approvalDateTo: string;
  account: string;
  status: string[];
  dimension: string;
  approver: string;
  createdBy: string;
  lastModifiedBy: string;
}

interface JournalEntriesFiltersState {
  groupExpanded: boolean;
  sourceExpanded: boolean;
  typeExpanded: boolean;
  postDateExpanded: boolean;
  reverseDateExpanded: boolean;
  approvalDateExpanded: boolean;
  accountExpanded: boolean;
  statusExpanded: boolean;
  dimensionExpanded: boolean;
  approverExpanded: boolean;
  createdByExpanded: boolean;
  lastModifiedByExpanded: boolean;
}

@Component({
  selector: 'app-journal-entries-filters',
  templateUrl: './journal-entries-filters.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class JournalEntriesFiltersComponent implements OnInit, OnDestroy {
  @Input() set groupsList(items: GroupEntity[]) {
    this.groups = items.filter(item => !!item.id);
  }

  @Input() accountsList: AccountEntity[] = [];
  @Input() dimensionsList: DimensionEntity[] = [];
  @Input() members: MemberEntity[] = [];
  @Input() filtersState: JournalEntriesFiltersState;

  @Input() set filters(value) {
    this._filters = value;
  }

  get filters() {
    return this._filters;
  }

  readonly sources = ObjectUtil.enumToArray(AccountingJournalSourceEnum).map(key => ({ key: key, isSelected: false }));
  readonly types = ObjectUtil.enumToArray(AccountingJournalTypeEnum).map(key => ({ key: key, isSelected: false }));
  readonly statuses = ObjectUtil.enumToArray(AccountingJournalStatusEnum).map(key => ({ key: key, isSelected: false }));
  readonly sourceEnum = AccountingJournalSourceEnum;
  groupControl: FormControl = new FormControl();
  accountControl: FormControl = new FormControl();
  dimensionControl: FormControl = new FormControl();
  approverControl: FormControl = new FormControl();
  createdByControl: FormControl = new FormControl();
  lastModifiedByControl: FormControl = new FormControl();
  typeControl: FormControl = new FormControl();
  form: FormGroup;
  groups: GroupEntity[] = [];
  readonly currentDate = new Date();

  private _filters: JournalEntriesFilters;
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.initForm();
    this.handleFormControls();
    this.setFilterValues(this.filters);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  setFilterValues(filters: JournalEntriesFilters) {
    this.statuses.forEach(item => (item.isSelected = (filters.status || []).some(status => item.key === status)));
    this.types.forEach(item => (item.isSelected = (filters.type || []).some(type => item.key === type)));
    this.sources.forEach(item => (item.isSelected = (filters.source || []).some(source => item.key === source)));
    this.form.patchValue(filters);
  }

  onStatusCheckboxToggle() {
    this.filters.status = this.statuses.filter(item => item.isSelected).map(item => item.key);
  }

  onTypeCheckboxToggle() {
    this.filters.type = this.types.filter(item => item.isSelected).map(item => item.key);
  }

  onSourceCheckboxToggle() {
    this.filters.source = this.sources.filter(item => item.isSelected).map(item => item.key);
  }

  reset(e, name) {
    e.stopPropagation();
    this.filters[name] = '';
  }

  resetDate(e, name) {
    e.stopPropagation();
    this.filters[name] = null;
  }

  private initForm() {
    this.form = new FormGroup({
      group: this.groupControl,
      account: this.accountControl,
      dimension: this.dimensionControl,
      approver: this.approverControl,
      createdBy: this.createdByControl,
      lastModifiedBy: this.lastModifiedByControl,
      type: this.typeControl
    });
  }

  private handleFormControls(): void {
    this.form.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(data => {
      Object.assign(this.filters, data);
    });

    this.groupControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(value => {
      if (!value) {
        this.filters.includeChildGroups = false;
      }
    });
  }
}
