import { TypeCheck } from '@services/helpers/utils/type-check';
import { differenceInSeconds } from 'date-fns';
import { TransactionStateEnum } from '@services/app-layer/app-layer.enums';

export class Utils {
  public static arrayDiff(arr1: any[], arr2: any[], key1?: string, key2?: string): any[] {
    if (!TypeCheck.isArray(arr1) || !TypeCheck.isArray(arr2)) throw new Error('Both arguments should be Arrays');
    if (arr1.length === arr2.length) return [];

    return arr1.length > arr2.length ? this.calcDiff(arr1, arr2, key1, key2) : this.calcDiff(arr2, arr1, key2, key1);
  }
  private static calcDiff(arr1: any[], arr2: any[], key1: string, key2: string): any[] {
    return arr1.filter(item1 => !arr2.find(item2 => (item2[key2] || item2) === (item1[key1] || item1)) && item1);
  }

  public static camelCaseToTitleCase(camelCase: string) {
    let result = camelCase.replace(/([A-Z])/g, ' $1');
    result = result.charAt(0).toUpperCase() + result.slice(1);
    return result;
  }

  /**
   * Calculates the shortest distance over the earth’s surface between the two points.
   * */
  public static calcStraightLineDistance(
    p1: { latitude: number; longitude: number },
    p2: { latitude: number; longitude: number }
  ): number {
    const p = 0.017453292519943295;
    const cos = Math.cos;
    const a =
      0.5 -
      cos((p2.latitude - p1.latitude) * p) / 2 +
      (cos(p1.latitude * p) * cos(p2.latitude * p) * (1 - cos((p2.longitude - p1.longitude) * p))) / 2;
    return 12742 * Math.asin(Math.sqrt(a));
  }

  public static abbreviateNumber(num, fixed = 0) {
    if (num === null) {
      return null;
    }
    if (num === 0) {
      return '0';
    }
    fixed = !fixed || fixed < 0 ? 0 : fixed; // number of decimal places to show
    const b = num.toPrecision(2).split('e'), // get power
      k = b.length === 1 ? 0 : Math.floor(Math.min(b[1].slice(1), 14) / 3), // floor at decimals, ceiling at trillions
      c = k < 1 ? num.toFixed(0 + fixed) : (num / Math.pow(10, k * 3)).toFixed(1 + fixed), // divide by power
      d = c < 0 ? c : Math.abs(c), // enforce -0 is 0
      e = d + ['', 'K', 'M', 'B', 'T'][k]; // append power
    return e;
  }

  public static lastUpdatedTimeDiffString(lastRefreshedTime): string {
    const seconds = differenceInSeconds(new Date(), lastRefreshedTime);
    if (seconds > 60) return `Last Refreshed: ${Math.floor(seconds / 60)} minute${seconds < 120 ? 's' : ''} ago.`;
    else return 'Last Refreshed: Seconds ago.';
  }

  public static getSearchTxCancelStateExcludePayload(): any {
    return {
      children: {
        logicalOperator: 'or',
        items: [
          { value: { field: 'state', comparisonOperator: 'eq', fieldValue: TransactionStateEnum.Draft } },
          { value: { field: 'state', comparisonOperator: 'eq', fieldValue: TransactionStateEnum.Quote } },
          { value: { field: 'state', comparisonOperator: 'eq', fieldValue: TransactionStateEnum.Review } },
          { value: { field: 'state', comparisonOperator: 'eq', fieldValue: TransactionStateEnum.Confirmed } },
          { value: { field: 'state', comparisonOperator: 'eq', fieldValue: TransactionStateEnum.ChangePending } },
          { value: { field: 'state', comparisonOperator: 'eq', fieldValue: TransactionStateEnum.InTransit } },
          { value: { field: 'state', comparisonOperator: 'eq', fieldValue: TransactionStateEnum.Complete } }
        ]
      }
    };
  }
  public static getSearchTxExcludeArchivedPayload(): any {
    return { value: { field: 'archived', comparisonOperator: 'eq', fieldValue: false } };
  }
}
