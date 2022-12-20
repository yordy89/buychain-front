import { Component, ChangeDetectionStrategy, Input, ElementRef, ViewChild, Output, EventEmitter } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatFormFieldAppearance } from '@angular/material/form-field';

@Component({
  selector: 'app-select-with-search',
  templateUrl: './select-with-search.component.html',
  styleUrls: ['./select-with-search.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SelectWithSearchComponent {
  @ViewChild('searchInput') private searchInput: ElementRef;

  @Input() appearance: MatFormFieldAppearance;
  @Input() label: string;
  @Input() form: FormControl;
  @Input() allowClear = false;

  private _optionList: any[] = [];
  @Input() set optionList(value) {
    this._optionList = value;
    this.resetFilter();
  }
  get optionList() {
    return this._optionList;
  }
  @Input() displayField: string;
  @Input() valueField: string;
  @Input() searchTerm = '';

  @Input() withLoadMore: boolean;
  @Input() allLoaded: boolean;
  @Output() loadMore = new EventEmitter<string>();

  public filteredOptionList: any[] = [];

  onSearchTermChange(event) {
    this.searchTerm = event.target.value;
    this.applyFilter();
  }

  openedChange(isOpening) {
    if (isOpening) this.searchInput.nativeElement.focus();
    if (this.filteredOptionList.length === 0) this.resetFilter();
  }

  applyFilter() {
    this.filteredOptionList = this.optionList.filter(option =>
      (this.displayField ? option[this.displayField] : option)
        .toString()
        .toLowerCase()
        .trim()
        .includes(this.searchTerm.toLowerCase())
    );
  }

  resetFilter() {
    this.searchTerm = '';
    this.filteredOptionList = this.optionList;
  }

  triggerLoadMore(e: Event): void {
    e.stopPropagation();
    this.loadMore.emit();
  }

  onClear(e) {
    e.stopPropagation();
    this.form.setValue('');
    this.resetFilter();
  }
}
