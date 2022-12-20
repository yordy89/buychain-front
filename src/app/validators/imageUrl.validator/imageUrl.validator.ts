import { FormControl, ValidatorFn } from '@angular/forms';

/*
 */
export function ImageUrlValidator(): ValidatorFn {
  return (control: FormControl): { [key: string]: any } => {
    const val = control.value;

    const regExp = /^(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?([/|.|\w|\s|-])*\.(?:jpg|gif|png)/;

    if (val && !val.match(regExp)) return { imageUrl: 'The input must be a valid url' };
    return null;
  };
}
