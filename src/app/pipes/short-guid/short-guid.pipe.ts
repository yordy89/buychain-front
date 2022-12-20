import { Pipe, PipeTransform } from '@angular/core';
import { TransformHelper } from '@services/helpers/utils/transform-helper';

@Pipe({
  name: 'shortGuid'
})
export class ShortGuidPipe implements PipeTransform {
  transform(value: string): string {
    return TransformHelper.getShortHexGuid(value);
  }
}
