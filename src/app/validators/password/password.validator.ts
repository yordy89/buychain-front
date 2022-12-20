import { FormControl } from '@angular/forms';
import * as PasswordValidator from 'password-validator/src';

export function passwordValidator(control: FormControl) {
  const errors = getErrors(control.value);
  const isValid = !errors.length;

  return isValid ? null : { password: errors };
}

function getErrors(value) {
  const schema = new PasswordValidator();

  schema
    .is()
    .min(8, 'Password should have a minimum length of 8 characters')
    .is()
    .max(20, 'Password should have a maximum length of 20 characters')
    .has()
    .uppercase(1, 'Password should have a minimum of 1 uppercase letter')
    .has()
    .lowercase(1, 'Password should have a minimum of 1 lowercase letter')
    .has()
    .digits(1, 'Password should have a minimum of 1 digit')
    .has()
    .symbols(1, 'Password should have a minimum of 1 symbol')
    .has()
    .not()
    .spaces(null, 'Password should not have spaces');

  return schema.validate(value, { details: true });
}
