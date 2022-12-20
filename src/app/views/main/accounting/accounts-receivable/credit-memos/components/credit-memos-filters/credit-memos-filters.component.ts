import { ChangeDetectionStrategy, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { ARCreditMemoReviewStateEnum, ARCreditMemoStateEnum } from '@services/app-layer/app-layer.enums';
import { CrmAccountEntity } from '@services/app-layer/entities/crm';
import { ObjectUtil } from '@services/helpers/utils/object-util';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

export interface ARCreditMemosFilters {
  state?: ARCreditMemoStateEnum[];
  reviewState?: ARCreditMemoReviewStateEnum[];
  customers?: string[];
}

export interface ARCreditMemosFiltersState {
  stateExpanded: boolean;
  reviewStateExpanded: boolean;
  customersExpanded: boolean;
}

@Component({
  selector: 'app-credit-memos-filters',
  templateUrl: './credit-memos-filters.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreditMemosFiltersComponent implements OnInit, OnDestroy {
  @Input() filters: ARCreditMemosFilters;

  @Input() crmAccounts: CrmAccountEntity[] = [];
  @Input() filtersState: ARCreditMemosFiltersState;

  readonly states = ObjectUtil.enumToArray(ARCreditMemoStateEnum).map(key => ({ key: key, isSelected: false }));
  readonly reviewStates = ObjectUtil.enumToArray(ARCreditMemoReviewStateEnum).map(key => ({
    key: key,
    isSelected: false
  }));

  customersControl: FormControl = new FormControl();
  form: FormGroup;
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

  setFilterValues(filters: ARCreditMemosFilters) {
    this.states.forEach(item => (item.isSelected = (filters.state || []).some(states => item.key === states)));
    this.reviewStates.forEach(
      item => (item.isSelected = (filters.reviewState || []).some(reviewState => item.key === reviewState))
    );
    this.form.patchValue(filters);
  }

  onStateCheckboxToggle() {
    this.filters.state = this.states.filter(item => item.isSelected).map(item => item.key);
  }

  onReviewStateCheckboxToggle() {
    this.filters.reviewState = this.reviewStates.filter(item => item.isSelected).map(item => item.key);
  }

  private initForm() {
    this.form = new FormGroup({
      customers: this.customersControl
    });
  }

  private handleFormControls(): void {
    this.form.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(data => {
      Object.assign(this.filters, data);
    });
  }
}
