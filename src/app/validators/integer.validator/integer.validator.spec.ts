import { IntegerValidator } from './integer.validator';
import { FormControl } from '@angular/forms';

describe('IntegerValidator', () => {
  let validationFunction: () => void;

  beforeEach(() => {
    validationFunction = IntegerValidator;
  });

  it('should be of type function', () => {
    expect(typeof validationFunction).toBe('function');
  });

  it('should validate number #1', () => {
    const formControl = new FormControl('988', IntegerValidator());

    expect(formControl.errors).toBeFalsy();
  });

  it('should validate number #2', () => {
    const formControl = new FormControl('', IntegerValidator());

    expect(formControl.errors).toBeFalsy();
  });

  it('should validate number #3', () => {
    const formControl = new FormControl('/43342', IntegerValidator());

    expect(formControl.errors).toEqual({ integer: true });
  });

  it('should validate number #4', function () {
    const formControl = new FormControl('8.8', IntegerValidator());

    expect(formControl.errors).toEqual({ integer: true });
  });
});
