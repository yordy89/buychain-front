import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-filter-expander',
  templateUrl: './filter-expander.component.html',
  styleUrls: ['./filter-expander.component.scss']
})
export class FilterExpanderComponent {
  @Input() isExpanded = false;
  @Output() isExpandedChange = new EventEmitter();
  @Input() caption = '';

  toggle() {
    this.isExpanded = !this.isExpanded;
    this.isExpandedChange.emit(this.isExpanded);
  }
}
