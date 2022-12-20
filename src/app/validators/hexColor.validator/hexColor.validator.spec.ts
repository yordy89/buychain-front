import { HexColorValidator } from './hexColor.validator';

describe('HecColorValidator', () => {
  let validationFunction: () => void;

  beforeEach(() => {
    validationFunction = HexColorValidator;
  });

  it('should be of type function', () => {
    expect(typeof validationFunction).toBe('function');
  });
});
