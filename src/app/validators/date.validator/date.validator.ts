import { FormControl, ValidatorFn } from '@angular/forms';

/*
 */
export function DateValidator(params: { min?: Date; max?: Date }): ValidatorFn {
  return (control: FormControl): { [key: string]: any } => {
    const val = control.value;
    const max = params.max;
    const min = params.min;

    const date = new Date(val);
    if (!val) return null;

    if (min && max) {
      return max.getTime() < date.getTime() || min.getTime() > date.getTime()
        ? { date: `Date should be between ${min} and ${max}` }
        : null;
    }

    if (max) {
      return max.getTime() < date.getTime() ? { date: `Date should be earlier then ${max}` } : null;
    }
    if (min) {
      return min.getTime() > date.getTime() ? { date: `Date should be later then ${min}` } : null;
    }

    return null;
  };
}
