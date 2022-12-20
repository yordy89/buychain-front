import { Component, ChangeDetectionStrategy, Input } from '@angular/core';

@Component({
  selector: 'app-tooltip-info-icon',
  templateUrl: './tooltip-info-icon.component.html',
  styleUrls: ['./tooltip-info-icon.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TooltipInfoIconComponent {
  @Input() tooltipText: string;
}
