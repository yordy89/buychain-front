import { Injectable, Injector } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FacilitiesService } from '@app/services/data-layer/http-api/base-api/swagger-gen';

@Injectable({
  providedIn: 'root'
})
export class FacilitiesApiExtendedService extends FacilitiesService  {

  constructor(private injector: Injector) {
    super(injector.get(HttpClient), null, null);
  }
}
