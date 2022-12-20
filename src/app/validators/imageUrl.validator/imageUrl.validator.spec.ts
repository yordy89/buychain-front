import { ImageUrlValidator } from './imageUrl.validator';
import { FormControl } from '@angular/forms';

describe('ImageUrlValidator', () => {
  let validationFunction: () => void;

  beforeEach(() => {
    validationFunction = ImageUrlValidator;
  });

  it('should be of type function', () => {
    expect(typeof validationFunction).toBe('function');
  });

  it('should show valid random image url from google', function () {
    const formControl = new FormControl(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Logo_TV_2015.svg/1200px-Logo_TV_2015.svg.png',
      ImageUrlValidator()
    );

    expect(formControl.errors).toBeFalsy();
  });

  it('should be valid also without https link image url from google', function () {
    const formControl = new FormControl('freelogodesign.org/Content/img/logo-ex-7.png', ImageUrlValidator());

    expect(formControl.errors).toBeFalsy();
  });

  it('should be valid with underscore and dash characters with png ending', function () {
    const formControl = new FormControl('random1_-text.png', ImageUrlValidator());

    expect(formControl.errors).toBeFalsy();
  });

  it('should be valid with underscore and dash characters with jpg ending', function () {
    const formControl = new FormControl('random1_-text.jpg', ImageUrlValidator());

    expect(formControl.errors).toBeFalsy();
  });

  it('should be valid with underscore and dash characters with gif ending', function () {
    const formControl = new FormControl('random1_-text.gif', ImageUrlValidator());

    expect(formControl.errors).toBeFalsy();
  });

  it('should be invalid if image url does not end with jpg png and gif', function () {
    const formControl = new FormControl('random1_-text.com', ImageUrlValidator());

    expect(formControl.errors).toBeTruthy();
  });
});
