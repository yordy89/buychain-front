import { Directive, HostListener } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  selector: '[appNullOnEmpty]'
})
export class NullOnEmptyDirective {
  constructor(private control: NgControl) {}

  @HostListener('input', ['$event.target'])
  onEvent(target: HTMLInputElement) {
    if (target.value !== null && target.value.trim() === '') {
      this.control.control.setValue(null);
    }
  }
}
