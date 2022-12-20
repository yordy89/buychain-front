import { TypeCheck } from '@services/helpers/utils/type-check';

describe('type-checkValidator', () => {
  it('should be of type string #1', () => {
    expect(TypeCheck.isString('string')).toBeTruthy();
  });

  it('should be of type string #2', () => {
    expect(TypeCheck.isString('')).toBeTruthy();
  });

  it('should be of type string #3', () => {
    expect(TypeCheck.isString([])).toBeFalsy();
  });

  it('should be of type string #4', () => {
    expect(TypeCheck.isString({})).toBeFalsy();
  });

  it('should be of type string #5', () => {
    expect(TypeCheck.isString(null)).toBeFalsy();
  });

  it('should be of type string #6', () => {
    expect(TypeCheck.isString(true)).toBeFalsy();
  });

  it('should be of type array #1', () => {
    expect(TypeCheck.isArray([])).toBeTruthy();
  });

  it('should be of type array #2', () => {
    expect(TypeCheck.isArray([1, 2])).toBeTruthy();
  });

  it('should be of type array #3', () => {
    expect(TypeCheck.isArray('')).toBeFalsy();
  });

  it('should be of type array #4', () => {
    expect(TypeCheck.isArray({})).toBeFalsy();
  });

  it('should be of type array #5', () => {
    expect(TypeCheck.isArray({ object: [] })).toBeFalsy();
  });

  it('should be of type object #1', () => {
    expect(TypeCheck.isArray(undefined)).toBeFalsy();
  });

  it('should be of type object #2', () => {
    expect(TypeCheck.isArray(TypeCheck.isArray)).toBeFalsy();
  });

  it('should be of type object #3', () => {
    expect(TypeCheck.isObject({ object: 'object' })).toBeTruthy();
  });

  it('should be of type object #4', () => {
    expect(TypeCheck.isObject({})).toBeTruthy();
  });

  it('should be of type object #5', () => {
    expect(TypeCheck.isObject('')).toBeFalsy();
  });

  it('should be of type object #6', () => {
    expect(TypeCheck.isObject([])).toBeFalsy();
  });

  it('should be of type object #7', () => {
    expect(TypeCheck.isObject(undefined)).toBeFalsy();
  });

  it('should be of type object #8', () => {
    expect(TypeCheck.isObject(TypeCheck.isObject)).toBeFalsy();
  });

  it('should be of type object #9', () => {
    expect(TypeCheck.isFunction(TypeCheck.isString)).toBeTruthy();
  });

  it('should be of type object #10', () => {
    expect(TypeCheck.isFunction(undefined)).toBeFalsy();
  });

  it('should be of type object #11', () => {
    expect(TypeCheck.isFunction({})).toBeFalsy();
  });

  it('should be of type object #12', () => {
    expect(TypeCheck.isFunction('')).toBeFalsy();
  });

  it('should be of type object #13', () => {
    expect(TypeCheck.isFunction([])).toBeFalsy();
  });

  it('should be of type object #14', () => {
    expect(TypeCheck.isString(undefined)).toBeFalsy();
  });

  it('should be of type object #15', () => {
    expect(TypeCheck.isString(TypeCheck.isString)).toBeFalsy();
  });
});
