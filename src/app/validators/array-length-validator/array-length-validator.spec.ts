import { ArrayLengthValidator } from '@validators/array-length-validator/array-length-validator';
import { FormControl } from '@angular/forms';

describe('ArrayLengthValidator', () => {
  let validationFunction: (minLength: number) => void;

  beforeEach(() => {
    validationFunction = ArrayLengthValidator;
  });

  it('should be of type function', () => {
    expect(typeof validationFunction).toBe('function');
  });

  it('should validate number #1', function () {
    const formControl = new FormControl([1, 2], ArrayLengthValidator(2));

    expect(formControl.errors).toBeFalsy();
  });

  it('should validate number #2', function () {
    const formControl = new FormControl([], ArrayLengthValidator(2));

    expect(formControl.errors).toBeTruthy();
  });

  it('should validate number #3', function () {
    try {
      const formControl = new FormControl({}, ArrayLengthValidator(2));

      expect(formControl.errors).toBeTruthy();
    } catch (error) {
      expect(error.message).toEqual('The value of the form should be an array');
    }
  });
});
