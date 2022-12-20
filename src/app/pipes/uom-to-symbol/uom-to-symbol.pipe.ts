import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'uomToSymbol'
})
export class UomToSymbolPipe implements PipeTransform {
  private uomSymbolMap = new Map([
    ['feet', "'"],
    ['inch', '"']
  ]);

  transform(value: any, uom: string): any {
    return value + (this.uomSymbolMap.get(uom) || '');
  }
}
