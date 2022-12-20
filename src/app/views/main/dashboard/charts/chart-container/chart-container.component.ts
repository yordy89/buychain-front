import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-chart-container',
  templateUrl: './chart-container.component.html',
  styleUrls: ['./chart-container.component.scss']
})
export class ChartContainerComponent {
  @Input() caption: string;
  @Input() showViewAll = false;
  @Output() viewAllClick = new EventEmitter();

  onViewAll(event) {
    event.preventDefault();
    this.viewAllClick.emit();
  }
}
