import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-value-label',
  templateUrl: './value-label.component.html',
  styleUrls: ['./value-label.component.scss']
})
export class ValueLabelComponent {
  @Input() value: string | number;
  @Input() label: string;
  @Input() unit: string;
  @Input() mode: 'value' | 'total' = 'value';
}
