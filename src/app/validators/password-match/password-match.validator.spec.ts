import { PasswordMatchValidator } from '@validators/password-match/password-match.validator';
import { FormControl, FormGroup, Validators } from '@angular/forms';

describe('PasswordMatchValidator', () => {
  let validationFunction: (passwordKey: string, passwordConfirmationKey: string) => void;

  beforeEach(() => {
    validationFunction = PasswordMatchValidator;
  });

  it('should be of type function', () => {
    expect(typeof validationFunction).toBe('function');
  });

  it('should verify password matching 1', () => {
    const formControl1 = new FormControl('asdf', [Validators.required]);
    const formControl2 = new FormControl('asdf', [Validators.required]);
    const formControl3 = new FormControl('xar@mail.com', [Validators.required]);
    const form = new FormGroup(
      {
        control1: formControl1,
        control2: formControl2,
        control3: formControl3
      },
      PasswordMatchValidator('control1', 'control2')
    );

    expect(form.invalid).toBeFalsy();
  });

  it('should verify password matching 2', () => {
    const formControl1 = new FormControl('xar@mail.com', [Validators.required]);

    expect(formControl1.errors).toBeNull();
  });
});
