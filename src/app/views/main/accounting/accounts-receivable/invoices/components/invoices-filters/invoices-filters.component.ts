import { ChangeDetectionStrategy, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ARInvoiceStateEnum } from '@services/app-layer/app-layer.enums';
import { ObjectUtil } from '@services/helpers/utils/object-util';
import { Subject } from 'rxjs';

export interface ARInvoicesFilters {
  state: ARInvoiceStateEnum[];
  invoiceDate: string;
  dueDate: string;
}

export interface ARInvoicesFiltersState {
  stateExpanded: boolean;
  invoiceDateExpanded: boolean;
  dueDateExpanded: boolean;
}

@Component({
  selector: 'app-invoices-filters',
  templateUrl: './invoices-filters.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InvoicesFiltersComponent implements OnInit, OnDestroy {
  @Input() filters: ARInvoicesFilters;

  @Input() filtersState: ARInvoicesFiltersState;

  readonly states = ObjectUtil.enumToArray(ARInvoiceStateEnum).map(key => ({ key: key, isSelected: false }));

  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.setFilterValues(this.filters);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  setFilterValues(filters) {
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
