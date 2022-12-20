import { Environment } from '@services/app-layer/app-layer.environment';
import { SpecLib } from '@buychain/lib';
import { ProductSpec } from '@services/data-layer/http-api/base-api/swagger-gen';

export class SpecHelper {
  public static getSpecShorthand(spec: ProductSpec): string {
    const uiProducts = Environment.getUiProducts();
    if (!uiProducts) return '';
    return SpecLib.getShorthand(spec, uiProducts) || '';
  }

  public static substituteTemplate(template, specs) {
    return SpecLib._generateShorthand(template, specs);
  }

  public static getUomSymbol(uom: string) {
    const uomSymbolMap = new Map([
      ['feet', "'"],
      ['inch', '"']
    ]);
    return uomSymbolMap.get(uom);
  }
}
