import { Pipe, PipeTransform } from '@angular/core';
import { TransformHelper } from '@services/helpers/utils/transform-helper';

@Pipe({
  name: 'stringUnderscoreToSpaceTitleCase'
})
export class StringUnderscoreToSpaceTitleCasePipe implements PipeTransform {
  transform(data: string): string {
    return TransformHelper.stringUnderscoreToSpaceTitleCase(data);
  }
}
