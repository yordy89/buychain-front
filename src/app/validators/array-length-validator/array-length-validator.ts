import { FormControl, ValidatorFn } from '@angular/forms';
import { TypeCheck } from '@services/helpers/utils/type-check';

export function ArrayLengthValidator(minLength: number): ValidatorFn {
  return (control: FormControl): { [key: string]: any } => {
    const val = control.value;

    if (!TypeCheck.isArray(val)) {
      return { notAnArray: true };
    }

    if (minLength && val && val.length < minLength) {
      return {
        arraylength: {
          requiredLength: minLength,
          actualLength: val.length
        }
      };
    }

    return null;
  };
}
