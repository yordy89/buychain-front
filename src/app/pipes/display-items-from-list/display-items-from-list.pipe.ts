import { Pipe, PipeTransform } from '@angular/core';
import { ListUtilHelper } from '@services/helpers/utils/list-util.helper';

@Pipe({
  name: 'displayItemsFromList'
})
export class DisplayItemsFromListPipe implements PipeTransform {
  transform(
    values: string[],
    list: unknown[],
    matchKey: string | number,
    displayKey: string | number,
    delimiter = ' | '
  ): string | number {
    return values
      .map(value => ListUtilHelper.getDisplayValueFromList(value, list, matchKey, displayKey))
      .join(delimiter);
  }
}
