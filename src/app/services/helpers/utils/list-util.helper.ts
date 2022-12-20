export class ListUtilHelper {
  static getDisplayValueFromList(
    value: string | number,
    list: unknown[],
    matchKey: string | number = 'id',
    displayKey: string | number = 'name',
    notAvailable = ''
  ): string | number {
    if (!list?.length || !matchKey || !displayKey) {
      return value;
    }

    const targetItem = list.find(item => item[matchKey] === value);

    if (!targetItem) {
      return notAvailable;
    }

    return targetItem[displayKey] || notAvailable;
  }

  static getSortedValue(value1, value2) {
    return ('' + value1).localeCompare(value2);
  }

  static getMappedSortedValue(value1, value2, list, matchKey?, displayKey?) {
    const displayVal1 = this.getDisplayValueFromList(value1, list, matchKey, displayKey);
    const displayVal2 = this.getDisplayValueFromList(value2, list, matchKey, displayKey);
    return this.getSortedValue(displayVal1, displayVal2);
  }
}
