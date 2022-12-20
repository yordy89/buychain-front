import { AbstractControl, FormArray, FormControl, FormGroup } from '@angular/forms';
import { ObjectUtil } from '@services/helpers/utils/object-util';
import { TypeCheck } from '@services/helpers/utils/type-check';

export class FormGroupHelper {
  /**
   * return only the dirty values of the form group
   */
  public static getDirtyValues(formGroup: any): any {
    const dirtyValues = {};

    Object.keys(formGroup.controls).forEach(key => {
      const currentControl = formGroup.controls[key];

      if (!currentControl.dirty) {
        return;
      }

      if (currentControl instanceof FormGroup) {
        dirtyValues[key] = this.getDirtyValues(currentControl);
      } else if (currentControl instanceof FormArray) {
        dirtyValues[key] = currentControl.controls
          .map(control => this.getDirtyValues(control))
          .filter(item => !ObjectUtil.isEmptyObject(item));
      } else {
        dirtyValues[key] = currentControl.value;
      }
    });

    return dirtyValues;
  }

  // TODO enhance to act on form controls instead of form value, to include disabled as well.
  public static getChangedValues(formValues, initialValues): any {
    const result = {};

    Object.keys(formValues).forEach(key => {
      const formValue = formValues[key];
      const initialValue = initialValues ? initialValues[key] : null;

      if (TypeCheck.isArray(formValue)) {
        let isArrayChanged = false;

        if (formValue.length !== initialValue?.length) {
          isArrayChanged = true;
        } else {
          isArrayChanged = formValue.some((val, index) => {
            const changes = this.getChangedValues(formValue[index], initialValue[index]);
            return !ObjectUtil.isEmptyObject(changes);
          });
        }

        if (isArrayChanged) {
          result[key] = formValue;
        }
      } else if (TypeCheck.isObject(formValue)) {
        const value = this.getChangedValues(formValue, initialValue);

        if (!ObjectUtil.isEmptyObject(value)) {
          result[key] = value;
        }
      } else if (formValue !== initialValue) {
        result[key] = formValue;
      }
    });

    return result;
  }

  /**
   * Recursively Marks all controls in a form group as touched and dirty
   */
  public static markTouchedAndDirty(formGroup: FormGroup): void {
    (<any>Object).values(formGroup.controls).forEach(control => {
      this.markControlTouchedAndDirty(control);

      if (control.controls) this.markTouchedAndDirty(control);
    });
  }

  /**
   * Recursively Marks all controls in a form group as untouched and pristine
   */
  public static markUntouchedAndPristine(formGroup: FormGroup): void {
    (<any>Object).values(formGroup.controls).forEach(control => {
      this.markControlUntouchedAndPristine(control);

      if (control.controls) this.markUntouchedAndPristine(control);
    });
  }

  public static markControlTouchedAndDirty(formControl: FormControl): void {
    formControl.markAsTouched();
    formControl.markAsDirty();
  }

  public static markControlUntouchedAndPristine(formControl: FormControl): void {
    formControl.markAsUntouched();
    formControl.markAsPristine();
  }

  public static enable(formGroup: FormGroup): void {
    (<any>Object).values(formGroup.controls).forEach(control => {
      control.enable({ emitEvent: false });

      if (control.controls) this.enable(control);
    });
  }

  public static disable(formGroup: FormGroup): void {
    (<any>Object).values(formGroup.controls).forEach(control => {
      control.disable({ emitEvent: false });

      if (control.controls) this.disable(control);
    });
  }

  public static isInvalidField(field: AbstractControl): boolean {
    return field.invalid && (field.dirty || field.touched);
  }
}
