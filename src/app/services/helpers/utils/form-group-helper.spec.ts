import { FormGroupHelper } from './form-group-helper';
import { FormControl, FormGroup } from '@angular/forms';

describe('FormGroupHelper', () => {
  let formcontrol1: FormControl;
  let formcontrol2: FormControl;
  let formcontrol3: FormControl;
  let form: FormGroup;
  let greatForm: FormGroup;

  beforeEach(() => {
    formcontrol1 = new FormControl('');
    formcontrol2 = new FormControl('');
    formcontrol3 = new FormControl('');
    form = new FormGroup({
      control1: formcontrol1,
      control2: formcontrol2
    });
    greatForm = new FormGroup({
      generalControl: form,
      simpleControl: formcontrol3
    });
  });

  it('control should be touched and dirty', function () {
    FormGroupHelper.markControlTouchedAndDirty(formcontrol1);

    expect(formcontrol1.touched).toBeTruthy();
    expect(formcontrol1.dirty).toBeTruthy();
  });

  it('control should be untouched and pristine', function () {
    FormGroupHelper.markControlTouchedAndDirty(formcontrol1);

    expect(formcontrol1.touched).toBeTruthy();
    expect(formcontrol1.dirty).toBeTruthy();
    FormGroupHelper.markControlUntouchedAndPristine(formcontrol1);

    expect(formcontrol1.touched).toBeFalsy();
    expect(formcontrol1.dirty).toBeFalsy();
  });

  it('form controls should be touched and dirty', function () {
    FormGroupHelper.markTouchedAndDirty(form);

    expect(formcontrol1.touched).toBeTruthy();
    expect(formcontrol1.dirty).toBeTruthy();
    expect(formcontrol2.touched).toBeTruthy();
    expect(formcontrol2.dirty).toBeTruthy();
  });

  it('form controls should be untouched and pristine', function () {
    FormGroupHelper.markTouchedAndDirty(form);

    expect(formcontrol1.touched).toBeTruthy();
    expect(formcontrol1.dirty).toBeTruthy();
    expect(formcontrol2.touched).toBeTruthy();
    expect(formcontrol2.dirty).toBeTruthy();
    FormGroupHelper.markUntouchedAndPristine(form);

    expect(formcontrol1.touched).toBeFalsy();
    expect(formcontrol1.dirty).toBeFalsy();
    expect(formcontrol2.touched).toBeFalsy();
    expect(formcontrol2.dirty).toBeFalsy();
  });

  it('form controls and child controls of a control should be touched and dirty', function () {
    FormGroupHelper.markTouchedAndDirty(greatForm);

    expect(formcontrol1.touched).toBeTruthy();
    expect(formcontrol1.dirty).toBeTruthy();
    expect(formcontrol2.touched).toBeTruthy();
    expect(formcontrol2.dirty).toBeTruthy();
    expect(formcontrol3.touched).toBeTruthy();
    expect(formcontrol3.dirty).toBeTruthy();
  });

  it('form controls and child controls of a control should be untouched and pristine', function () {
    FormGroupHelper.markTouchedAndDirty(greatForm);

    expect(formcontrol1.touched).toBeTruthy();
    expect(formcontrol1.dirty).toBeTruthy();
    expect(formcontrol2.touched).toBeTruthy();
    expect(formcontrol2.dirty).toBeTruthy();
    expect(formcontrol3.touched).toBeTruthy();
    expect(formcontrol3.dirty).toBeTruthy();
    FormGroupHelper.markUntouchedAndPristine(greatForm);

    expect(formcontrol1.touched).toBeFalsy();
    expect(formcontrol1.dirty).toBeFalsy();
    expect(formcontrol2.touched).toBeFalsy();
    expect(formcontrol2.dirty).toBeFalsy();
    expect(formcontrol3.touched).toBeFalsy();
    expect(formcontrol3.dirty).toBeFalsy();
  });
});
