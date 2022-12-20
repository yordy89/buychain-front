import { Pipe, PipeTransform } from '@angular/core';
import { ListUtilHelper } from '@services/helpers/utils/list-util.helper';

@Pipe({
  name: 'displayItemFromList'
})
export class DisplayItemFromListPipe implements PipeTransform {
  transform(
    value: string | number,
    list: unknown[],
    matchKey: string | number,
    displayKey: string | number
  ): string | number {
    return ListUtilHelper.getDisplayValueFromList(value, list, matchKey, displayKey);
  }
}
