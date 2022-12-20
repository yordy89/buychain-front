import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { first } from 'rxjs/operators';
import { ObjectUtil } from '@services/helpers/utils/object-util';
import { TypeCheck } from '@services/helpers/utils/type-check';
import { TemporaryCompany } from '@app/services/data-layer/http-api/base-api/swagger-gen';
import { BaseApiService } from '@app/services/data-layer/http-api/base-api/base-api.service';
import { Environment } from '@services/app-layer/app-layer.environment';

@Injectable({ providedIn: 'root' })
export class TemporaryCompanyService {
  constructor(private baseApi: BaseApiService) {}

  public getUserTempCompany(id?: string): Observable<TemporaryCompany> {
    return this.baseApi.temporaryCompany.getTemporaryCompany(id).pipe(first());
  }

  public createCompany(formData: any): Observable<TemporaryCompany> {
    const payload = ObjectUtil.deleteEmptyProperties({
      name: formData.name,
      website: formData.website,
      streetAddress: formData.streetAddress,
      city: TypeCheck.isObject(formData.city) ? formData.city.name : formData.city,
      state: TypeCheck.isObject(formData.state) ? formData.state.name : formData.state,
      country: TypeCheck.isObject(formData.country) ? formData.country.name : formData.country,
      zipCode: formData.zipCode,
      applicationUrl: Environment.linkToAdminUi()
    });

    return this.baseApi.temporaryCompany.addTemporaryCompany(payload).pipe(first());
  }
}
