import { ChangeDetectionStrategy, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { APPurchaseOrderStateEnum } from '@services/app-layer/app-layer.enums';
import { CrmAccountEntity } from '@services/app-layer/entities/crm';
import { GroupEntity } from '@services/app-layer/entities/group';
import { MemberEntity } from '@services/app-layer/entities/member';
import { ObjectUtil } from '@services/helpers/utils/object-util';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

export interface APPurchaseOrdersFilters {
  state?: APPurchaseOrderStateEnum[];
  dateFrom?: string;
  dateTo?: string;
  vendor?: string;
  owner?: string;
  group?: string;
  childGroups?: boolean;
  billsIds?: string[];
}

export interface APPurchaseOrdersFiltersState {
  stateExpanded: boolean;
  createdOnExpanded: boolean;
  vendorExpanded: boolean;
  ownerExpanded: boolean;
  groupExpanded: boolean;
}

@Component({
  selector: 'app-purchase-orders-filters',
  templateUrl: './purchase-orders-filters.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PurchaseOrdersFiltersComponent implements OnInit, OnDestroy {
  @Input() filters: APPurchaseOrdersFilters;

  @Input() set groupsList(items: GroupEntity[]) {
    this.groups = items.filter(item => !!item.id);
  }

  @Input() crmAccounts: CrmAccountEntity[] = [];
  @Input() members: MemberEntity[] = [];
  @Input() filtersState: APPurchaseOrdersFiltersState;

  readonly states = ObjectUtil.enumToArray(APPurchaseOrderStateEnum).map(key => ({ key: key, isSelected: false }));

  groupControl: FormControl = new FormControl();
  vendorControl: FormControl = new FormControl();
  ownerControl: FormControl = new FormControl();
  form: FormGroup;
  groups: GroupEntity[] = [];
  readonly currentDate = new Date();
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

  setFilterValues(filters: APPurchaseOrdersFilters) {
    this.states.forEach(item => (item.isSelected = (filters.state || []).some(states => item.key === states)));
    this.form.patchValue(filters);
  }

  onStateCheckboxToggle() {
    this.filters.state = this.states.filter(item => item.isSelected).map(item => item.key);
  }

  resetDate(e, name) {
    e.stopPropagation();
    this.filters[name] = null;
  }

  get maxFromDate() {
    return this.filters?.dateTo || this.currentDate;
  }

  private initForm() {
    this.form = new FormGroup({
      group: this.groupControl,
      vendor: this.vendorControl,
      owner: this.ownerControl
    });
  }

  private handleFormControls(): void {
    this.form.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(data => {
      Object.assign(this.filters, data);
    });

    this.groupControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(value => {
      if (!value) {
        this.filters.childGroups = false;
      }
    });
  }
}
