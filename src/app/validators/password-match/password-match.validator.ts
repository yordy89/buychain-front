import { FormGroup } from '@angular/forms';

export function PasswordMatchValidator(passwordKey: string, passwordConfirmationKey: string): any {
  return (group: FormGroup) => {
    const passwordInput = group.controls[passwordKey];
    const passwordConfirmationInput = group.controls[passwordConfirmationKey];
    if (passwordInput.value !== passwordConfirmationInput.value) {
      return passwordConfirmationInput.setErrors({ passwordMatch: 'Password does not match' });
    } else {
      // TODO remove only error related to passwordMatch
      return passwordConfirmationInput.setErrors(null);
    }
  };
}
