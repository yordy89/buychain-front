import { FormControl, ValidatorFn } from '@angular/forms';

/*
 */
export function HexColorValidator(): ValidatorFn {
  return (control: FormControl): { [key: string]: any } => {
    const val = control.value;

    const regExp = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3}|[A-Fa-f0-9]{4})$/;

    if (val && !val.match(regExp)) return { hexColor: 'The input must be a valid hex color code' };
    return null;
  };
}
