import { ChangeDetectionStrategy, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { APBillStateEnum } from '@services/app-layer/app-layer.enums';
import { ObjectUtil } from '@services/helpers/utils/object-util';
import { Subject } from 'rxjs';

export interface APBillsFilters {
  state: APBillStateEnum[];
  dueDate: string;
}

export interface APBillsFiltersState {
  stateExpanded: boolean;
  dueDateExpanded: boolean;
}

@Component({
  selector: 'app-bills-filters',
  templateUrl: './bills-filters.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BillsFiltersComponent implements OnInit, OnDestroy {
  @Input() filters: APBillsFilters;

  @Input() filtersState: APBillsFiltersState;

  readonly states = ObjectUtil.enumToArray(APBillStateEnum).map(key => ({ key: key, isSelected: false }));

  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.setFilterValues(this.filters);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  setFilterValues(filters: APBillsFilters) {
    this.states.forEach(item => (item.isSelected = (filters.state || []).some(state => item.key === state)));
  }

  onStateCheckboxToggle() {
    this.filters.state = this.states.filter(item => item.isSelected).map(item => item.key);
  }

  resetDate(e, name) {
    e.stopPropagation();
    this.filters[name] = null;
  }
}
