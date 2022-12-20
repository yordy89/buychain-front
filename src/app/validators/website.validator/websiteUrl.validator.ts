import { FormControl, ValidatorFn } from '@angular/forms';
import { TypeCheck } from '@services/helpers/utils/type-check';

/*
 */
export function WebsiteUrlValidator(): ValidatorFn {
  return (control: FormControl): { websiteUrl: boolean } => (isValid(control.value) ? null : { websiteUrl: true });
}

function isValid(value) {
  if (!value) {
    return true;
  }

  return TypeCheck.isWebsiteUrl(value);
}
