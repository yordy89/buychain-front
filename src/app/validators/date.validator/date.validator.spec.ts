import { DateValidator } from './date.validator';

describe('WebsiteUrlValidator', () => {
  let validationFunction: (params: { min?: Date; max?: Date }, allowEmpty?: boolean) => void;

  beforeEach(() => {
    validationFunction = DateValidator;
  });

  it('should be of type function', () => {
    expect(typeof validationFunction).toBe('function');
  });
});
