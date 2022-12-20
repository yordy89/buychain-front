import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-numeric-indicator',
  templateUrl: './numeric-indicator.component.html',
  styleUrls: ['./numeric-indicator.component.scss']
})
export class NumericIndicatorComponent {
  @Input() title: string;
  @Input() currentValue: string | number;
  @Input() previousValue: string | number;
}
