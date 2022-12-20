import { Component, Input } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'app-tab-expansion-icon',
  templateUrl: './tab-expansion-icon.component.html',
  styleUrls: ['./tab-expansion-icon.component.scss']
})
export class TabExpansionIconComponent {
  @Input() isLeftPartVisible$: BehaviorSubject<boolean>;

  public toggleExpandedMode(value: boolean): void {
    this.isLeftPartVisible$.next(value);
  }
}
