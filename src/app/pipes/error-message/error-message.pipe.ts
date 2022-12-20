import { Pipe, PipeTransform } from '@angular/core';
import { TypeCheck } from '@services/helpers/utils/type-check';
import { format } from 'date-fns';

@Pipe({
  name: 'errorMessage'
})
export class ErrorMessagePipe implements PipeTransform {
  transform(errors: null | undefined | { [key: string]: string & { [key: string]: unknown } }): string {
    if (!errors) {
      return '';
    }

    const message = this.getErrorMessage(errors);

    if (message) {
      return message;
    }

    const key = Object.keys(errors)[0];
    const value = errors[key];
    if (key && TypeCheck.isString(value)) {
      return value;
    }

    return '';
  }

  private getErrorMessage(errors) {
    if (errors.required) {
      return 'Field is required';
    }

    if (errors.max) {
      return `The number must be less then or equal to ${errors.max.max}`;
    }
    if (errors.min) {
      return `The number must be grater then or equal to ${errors.min.min}`;
    }

    if (errors.email) {
      return 'Please provide a valid email address';
    }

    if (errors.maxlength) {
      const msg = errors.maxlength.requiredLength as string;
      return `Max ${msg} characters`;
    }

    if (errors.minlength) {
      const msg = errors.minlength.requiredLength as string;
      return `Min ${msg} characters`;
    }

    if (errors.websiteUrl) {
      return 'The input mast be a valid website url';
    }

    if (errors.notAnArray) {
      return 'The value of the form should be an array';
    }

    if (errors.arraylength) {
      const minLength = errors.arraylength.requiredLength as string;
      return `At least should contain ${minLength} item(s)`;
    }

    if (errors.matDatepickerMin?.min instanceof Date) {
      const date = format(errors.matDatepickerMin.min, 'M/d/yyyy');
      return `Date must be greater or equal to ${date}`;
    }

    if (errors.integer) {
      return 'The input field cannot contain characters other then digits';
    }

    if (errors.password) {
      return (errors.password[0] as any).message;
    }

    if (errors.emptyString) {
      return 'Field is not allowed to be empty';
    }
  }
}
