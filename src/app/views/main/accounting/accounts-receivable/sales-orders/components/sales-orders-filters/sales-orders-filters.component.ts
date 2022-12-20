import { ChangeDetectionStrategy, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { ARLineItemTypeEnum, ARSalesOrderStateEnum } from '@services/app-layer/app-layer.enums';
import { CrmAccountEntity } from '@services/app-layer/entities/crm';
import { GroupEntity } from '@services/app-layer/entities/group';
import { MemberEntity } from '@services/app-layer/entities/member';
import { ObjectUtil } from '@services/helpers/utils/object-util';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

export interface ARSalesOrdersFilters {
  state?: ARSalesOrderStateEnum[];
  dateFrom?: string;
  dateTo?: string;
  openLineItems?: ARLineItemTypeEnum[];
  customer?: string;
  owner?: string;
  group?: string;
  childGroups?: boolean;
  invoiceIds?: string[];
}

export interface ARSalesOrdersFiltersState {
  stateExpanded: boolean;
  openLineItemsExpanded: boolean;
  createdOnExpanded: boolean;
  customerExpanded: boolean;
  ownerExpanded: boolean;
  groupExpanded: boolean;
}

@Component({
  selector: 'app-sales-orders-filters',
  templateUrl: './sales-orders-filters.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SalesOrdersFiltersComponent implements OnInit, OnDestroy {
  @Input() filters: ARSalesOrdersFilters;

  @Input() set groupsList(items: GroupEntity[]) {
    this.groups = items.filter(item => !!item.id);
  }

  @Input() crmAccounts: CrmAccountEntity[] = [];
  @Input() members: MemberEntity[] = [];
  @Input() filtersState: ARSalesOrdersFiltersState;

  readonly openLineItemsTypes = ObjectUtil.enumToArray(ARLineItemTypeEnum).map(key => ({
    key: key,
    isSelected: false
  }));
  readonly states = ObjectUtil.enumToArray(ARSalesOrderStateEnum).map(key => ({ key: key, isSelected: false }));

  groupControl: FormControl = new FormControl();
  customerControl: FormControl = new FormControl();
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

  setFilterValues(filters: ARSalesOrdersFilters) {
    this.states.forEach(item => (item.isSelected = (filters.state || []).some(states => item.key === states)));
    this.openLineItemsTypes.forEach(
      item => (item.isSelected = (filters.openLineItems || []).some(type => item.key === type))
    );
    this.form.patchValue(filters);
  }

  onStateCheckboxToggle() {
    this.filters.state = this.states.filter(item => item.isSelected).map(item => item.key);
  }

  onTypeCheckboxToggle() {
    this.filters.openLineItems = this.openLineItemsTypes.filter(item => item.isSelected).map(item => item.key);
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
      customer: this.customerControl,
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
