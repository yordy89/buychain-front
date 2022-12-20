import { Component, Input, Output, EventEmitter, HostBinding } from '@angular/core';

@Component({
  selector: 'app-table-chart',
  templateUrl: './table-chart.component.html'
})
export class TableChartComponent {
  @Input() caption: string;
  @Input() columns: string[];
  @Input() showViewAll = true;
  @Output() viewAllClick = new EventEmitter();
  @HostBinding('class.table-chart') readonly hostClass = true;
}
