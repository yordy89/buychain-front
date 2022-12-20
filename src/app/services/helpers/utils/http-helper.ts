import { HttpParams } from '@angular/common/http';
import { CustomHttpUrlEncodingCodec } from '@services/data-layer/http-api/base-api/swagger-gen/encoder';
import { ObjectUtil } from '@services/helpers/utils/object-util';

export class HttpHelper {
  static getQueryParams(params) {
    if (ObjectUtil.isEmptyObject(params)) {
      return null;
    }

    let queryParameters = new HttpParams({ encoder: new CustomHttpUrlEncodingCodec() });

    Object.keys(params).forEach(key => {
      const value = params[key];
      if (!value) {
        return;
      }

      if (Array.isArray(value)) {
        for (const valueElement of value) {
          queryParameters = queryParameters.append(`${key}[]`, valueElement);
        }
      } else {
        queryParameters = queryParameters.set(key, value);
      }
    });

    return queryParameters;
  }
}
