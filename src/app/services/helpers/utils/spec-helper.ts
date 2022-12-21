import { Environment } from '@services/app-layer/app-layer.environment';
//import { SpecLib } from '@buychain/lib';
import { ProductSpec } from '@services/data-layer/http-api/base-api/swagger-gen';

export class SpecHelper {
  public static getSpecShorthand(): string {
    const uiProducts = Environment.getUiProducts();
    if (!uiProducts) return '';
    //return SpecLib.getShorthand(spec, uiProducts) || '';
    return '';
  }

  public static substituteTemplate() {
    //return SpecLib._generateShorthand(template, specs);
    return '';
  }

  public static getUomSymbol(uom: string) {
    const uomSymbolMap = new Map([
      ['feet', "'"],
      ['inch', '"']
    ]);
    return uomSymbolMap.get(uom);
  }
}
