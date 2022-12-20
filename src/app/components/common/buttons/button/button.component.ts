import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-button',
  templateUrl: './button.component.html',
  styleUrls: ['./button.component.scss']
})
export class ButtonComponent {
  @Input() isPrimary: boolean = null;
  @Input() isNarrow: boolean = null;
  @Input() isWarn: boolean = null;
  @Input() isDisabled: boolean = null;
  @Input() icon: string = null;
  @Output() clicked = new EventEmitter();

  click(e) {
    if (!this.isDisabled) this.clicked.emit(e);
  }

  get color() {
    if (!this.isDisabled) {
      if (this.isPrimary) {
        return 'primary';
      } else if (this.isWarn) {
        return 'warn';
      }
    }
  }
}
