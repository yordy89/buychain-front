import { WebsiteUrlValidator } from './websiteUrl.validator';
import { FormControl } from '@angular/forms';

describe('WebsiteUrlValidator', () => {
  let validationFunction: () => void;

  beforeEach(() => {
    validationFunction = WebsiteUrlValidator;
  });

  it('should be of type function', () => {
    expect(typeof validationFunction).toBe('function');
  });

  it('should be valid a very basic simple website url with https and www prefix', function () {
    const formControl = new FormControl('https://www.a.com', WebsiteUrlValidator());

    expect(formControl.errors).toBeFalsy();
  });

  it('should be valid a very basic simple website url with http and www prefix', function () {
    const formControl = new FormControl('http://www.a.com', WebsiteUrlValidator());

    expect(formControl.errors).toBeFalsy();
  });

  it('should be valid a very basic simple website url with https prefix', function () {
    const formControl = new FormControl('https://a.com', WebsiteUrlValidator());

    expect(formControl.errors).toBeFalsy();
  });

  it('should be valid a very basic simple website url with http prefix', function () {
    const formControl = new FormControl('http://a.com', WebsiteUrlValidator());

    expect(formControl.errors).toBeFalsy();
  });

  it('should be valid a very basic simple website url', function () {
    const formControl = new FormControl('a.com', WebsiteUrlValidator());

    expect(formControl.errors).toBeFalsy();
  });

  it('should be valid a very basic simple website url using -', function () {
    const formControl = new FormControl('a-a.com', WebsiteUrlValidator());

    expect(formControl.errors).toBeFalsy();
  });

  it('should be valid a very basic simple website url using dot', function () {
    const formControl = new FormControl('a.a.com', WebsiteUrlValidator());

    expect(formControl.errors).toBeFalsy();
  });

  it('should be a valid website url random link from google', function () {
    const formControl = new FormControl(
      'https://www.google.ru/search?newwindow=1&hl=ru-PL&authuser=0&ei=A4ECXL39COXorgTyiK_4Dw&q=angular+confirm+dialog&oq=angular+confirm&gs_l=psy-ab.3.0.0l10.493059.496507..497530...0.0..0.95.1215.15......0....1..gws-wiz.......0i71j0i67.BAzIp7B9Fi4',
      WebsiteUrlValidator()
    );

    expect(formControl.errors).toBeFalsy();
  });

  it('should be valid if characters after dot are more then one', function () {
    const formControl = new FormControl('a.com.co', WebsiteUrlValidator());

    expect(formControl.errors).toBeFalsy();
  });

  it('should be invalid website url if characters after dot are less then 2', function () {
    const formControl = new FormControl('website.c', WebsiteUrlValidator());

    expect(formControl.errors).toEqual({ websiteUrl: true });
  });

  it('should be a valid website url when using numbers', function () {
    const formControl = new FormControl('0.co', WebsiteUrlValidator());

    expect(formControl.errors).toBeFalsy();
  });

  it('should be a valid website url if two consequent dashes are used', function () {
    const formControl = new FormControl('a--a.com', WebsiteUrlValidator());

    expect(formControl.errors).toBeFalsy();
  });
});
