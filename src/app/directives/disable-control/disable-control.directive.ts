import { NgControl } from '@angular/forms';
import { Directive, Input, OnInit } from '@angular/core';

@Directive({
  selector: '[appDisableControl]',
  exportAs: 'appDisableControl'
})
export class DisableControlDirective implements OnInit {
  constructor(private ngControl: NgControl) {}

  @Input() set appDisableControl(condition: boolean) {
    if (this.disabled !== undefined) {
      this.toggleForm(condition);
    }
    this.disabled = condition;
  }

  private disabled: boolean;

  ngOnInit() {
    this.toggleForm(this.disabled);
  }

  toggleForm(condition: boolean) {
    condition ? this.ngControl.control.disable() : this.ngControl.control.enable();
  }
}
