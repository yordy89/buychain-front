import { TypeCheck } from '@services/helpers/utils/type-check';

export class ObjectUtil {
  public static deleteEmptyProperties(obj: any, recursive = true): any {
    if (!obj) return obj;
    const clone = ObjectUtil.getDeepCopy(obj);
    for (const propName in clone) {
      if (Object.prototype.hasOwnProperty.call(clone, propName)) {
        if (recursive && typeof clone[propName] === 'object') {
          clone[propName] = this.deleteEmptyProperties(clone[propName], recursive);
        }
        const val = clone[propName];
        if (val === null || val === undefined || val === '' || this.isEmptyArray(val) || this.isEmptyObject(val)) {
          delete clone[propName];
        }
      }
    }
    return clone;
  }

  public static isEmptyObject(item: any): boolean {
    return TypeCheck.isObject(item) && this.isObjectEmpty(item);
  }

  public static getDeepCopy(obj: any): any {
    return JSON.parse(JSON.stringify(obj));
  }

  public static deepAssign(target, ...sources): any {
    const isObject = item => item && typeof item === 'object' && !Array.isArray(item);

    if (!sources.length) return target;
    const source = sources.shift();

    if (isObject(target) && isObject(source)) {
      for (const key of Object.keys(source)) {
        if (isObject(source[key])) {
          if (!target[key]) Object.assign(target, { [key]: {} });
          ObjectUtil.deepAssign(target[key], source[key]);
        } else {
          Object.assign(target, { [key]: source[key] });
        }
      }
    }

    return ObjectUtil.deepAssign(target, ...sources);
  }

  private static isEmptyArray(item: any): boolean {
    return TypeCheck.isArray(item) && item.length === 0;
  }

  private static isObjectEmpty(obj) {
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) return false;
    }
    return true;
  }

  public static isDeepEquals(x, y) {
    if (x === null || x === undefined || y === null || y === undefined) {
      return x === y;
    }

    if (x === y || x.valueOf() === y.valueOf()) {
      return true;
    }
    if (x instanceof Date) {
      return false;
    }

    if ((Array.isArray(x) || Array.isArray(y)) && x.length !== y.length) {
      return false;
    }

    // arrays having same set of values but having different order should be equal
    if (Array.isArray(x) && Array.isArray(y)) {
      return x.every(
        a =>
          x.filter(val => ObjectUtil.isDeepEquals(a, val)).length ===
          y.filter(val => ObjectUtil.isDeepEquals(a, val)).length
      );
    }

    if (!(x instanceof Object)) {
      return false;
    }
    if (!(y instanceof Object)) {
      return false;
    }

    // recursive object equality check
    const p = Object.keys(x);
    return Object.keys(y).every(i => p.indexOf(i) !== -1) && p.every(i => ObjectUtil.isDeepEquals(x[i], y[i]));
  }

  public static TryParseJSON(str) {
    try {
      return JSON.parse(str);
    } catch (e) {
      return null;
    }
  }

  static enumToArray<T>(enumType: T): T[keyof T][] {
    if (!enumType) {
      return [];
    }
    return Object.keys(enumType)
      .filter(key => isNaN(Number(key)))
      .map(key => enumType[key]);
  }

  static enumToKeyValueArray<T>(enumType: T): { key: string; value: T[keyof T] }[] {
    if (!enumType) {
      return [];
    }
    return Object.keys(enumType)
      .filter(key => isNaN(Number(key)))
      .map(key => ({ key, value: enumType[key] }));
  }
}
