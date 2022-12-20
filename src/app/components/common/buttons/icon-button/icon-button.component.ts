import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-icon-button',
  templateUrl: './icon-button.component.html',
  styleUrls: ['./icon-button.component.scss']
})
export class IconButtonComponent {
  @Input() isPrimary: boolean = null;
  @Input() isWarn: boolean = null;
  @Input() icon: string = null;
  @Input() isDisabled: boolean = null;
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

      return 'primary';
    }
  }
}
