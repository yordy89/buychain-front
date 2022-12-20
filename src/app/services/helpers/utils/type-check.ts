import { Observable } from 'rxjs';

export class TypeCheck {
  public static isArray(data: any): boolean {
    return data && Object.prototype.toString.call(data) === '[object Array]';
  }

  public static isObject(data: any): boolean {
    return data && Object.prototype.toString.call(data) === '[object Object]';
  }

  public static isString(data: any): boolean {
    return typeof data === 'string';
  }

  public static isFunction(data: any): boolean {
    return data && {}.toString.call(data) === '[object Function]';
  }

  public static isBoolean(data: any): boolean {
    return typeof data === 'boolean';
  }

  public static isNumber(data: any): boolean {
    return typeof data === 'number' && !isNaN(data) && isFinite(data);
  }

  public static isObservable(data: any): boolean {
    return data instanceof Observable;
  }

  public static isHex(value: string): boolean {
    const regEx = /^[0-9a-fA-F]+$/;
    return regEx.test(value);
  }

  public static isWebsiteUrl(value: string): boolean {
    const regEx =
      /^(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?[a-z0-9]+([-.]?[-.][a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$/;
    return regEx.test(value);
  }

  static hasSupportedExtension(file: File, extensions: string[]): boolean {
    if (!file?.name || file.name.indexOf('.') < 0) {
      return false;
    }

    const ext = file.name.slice(file.name.lastIndexOf('.') + 1)?.toLowerCase() || '';

    return (extensions || []).includes(ext);
  }

  static hasImageFileExtension(file: File): boolean {
    return TypeCheck.hasSupportedExtension(file, ['png', 'jpg', 'jpeg', 'gif']);
  }
}
