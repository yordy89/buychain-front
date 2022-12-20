import { TypeCheck } from '@services/helpers/utils/type-check';

export class TransformHelper {
  static getShortHexGuid(str: string) {
    return str ? str.slice(-6).toLocaleUpperCase() : '';
  }

  static stringUnderscoreToSpaceTitleCase(value: string) {
    if (!TypeCheck.isString(value)) {
      return '';
    }

    return value
      .replace(/_/g, ' ')
      .toLowerCase()
      .split(' ')
      .map(s => s.charAt(0).toUpperCase() + s.substring(1))
      .join(' ');
  }
}
