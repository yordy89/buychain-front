import { FormControl, ValidatorFn } from '@angular/forms';

export function IntegerValidator(): ValidatorFn {
  return (control: FormControl): { integer: boolean } => (isValid(control.value) ? null : { integer: true });
}

function isValid(value) {
  if (!value) {
    return true;
  }

  return /^\d*$/.test(value);
}
