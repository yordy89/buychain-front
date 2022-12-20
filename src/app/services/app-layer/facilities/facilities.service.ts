import { Injectable } from '@angular/core';
import {
  FacilityEntity,
  FacilityPersonnelEntity,
  TransportMethodEntity
} from '@app/services/app-layer/entities/facility';
import { Observable, throwError } from 'rxjs';
import { BaseApiService } from '@app/services/data-layer/http-api/base-api/base-api.service';
import { catchError, first, map, mergeMap } from 'rxjs/operators';
import { TypeCheck } from '@app/services/helpers/utils/type-check';
import { CompaniesService } from '../companies/companies.service';
import { NotificationHelperService } from '@services/helpers/notification-helper/notification-helper.service';

@Injectable({
  providedIn: 'root'
})
export class FacilitiesService {
  constructor(
    private baseApi: BaseApiService,
    private companiesService: CompaniesService,
    private notificationHelperService: NotificationHelperService
  ) {}

  public getUserFacilityById(facilityId: string): Observable<FacilityEntity> {
    if (!TypeCheck.isHex(facilityId)) {
      this.notificationHelperService.showValidation('There is an invalid facility id');
      return throwError('invalidFacilityId');
    }
    return this.baseApi.facilities.getFacility(facilityId).pipe(map(facility => new FacilityEntity(facility)));
  }

  public getCompanyFacilitiesAll(companyId: string): Observable<FacilityEntity[]> {
    return this.fetchCompanyFacilitiesByOffset(companyId, null, 0);
  }

  public getCompanyFacilities(companyId: string): Observable<FacilityEntity[]> {
    return this.fetchCompanyFacilitiesByOffset(companyId, false, 0);
  }

  private fetchCompanyFacilitiesByOffset(
    companyId: string,
    archived: boolean,
    offset: number
  ): Observable<FacilityEntity[]> {
    return this.baseApi.facilities.getFacilitiesSummary(companyId, archived, 1000, offset).pipe(
      first(),
      mergeMap(async (data: any[]) => {
        if (data.length === 1000) {
          const chunk = await this.fetchCompanyFacilitiesByOffset(companyId, archived, offset + 1000).toPromise();
          data = data.concat(chunk);
        }
        return data.map(f => new FacilityEntity(f));
      })
    );
  }

  public getCompanyFacility(companyId: string, facilityId: string): Observable<FacilityEntity> {
    return this.getCompanyFacilities(companyId).pipe(map(facilities => facilities.find(x => x.id === facilityId)));
  }

  public addFacility(facility): Observable<FacilityEntity> {
    return this.baseApi.facilities.addFacility(facility).pipe(
      catchError(({ error }) => {
        throw this.handleAddFacilityError(error);
      }),
      map(newFacility => new FacilityEntity(newFacility))
    );
  }

  public updateFacility(facilityId: string, payload: any): Observable<FacilityEntity> {
    return this.baseApi.facilities.updateFacility(facilityId, payload).pipe(map(data => new FacilityEntity(data)));
  }

  public toggleFacilityArchive(facilityId: string, archive: boolean): Observable<FacilityEntity> {
    const payload: any = { archived: archive };
    return this.updateFacility(facilityId, payload);
  }

  public addFacilityPersonnel(facilityId: string, data): Observable<FacilityPersonnelEntity> {
    return this.baseApi.facilities
      .addFacilityPersonnel(facilityId, data)
      .pipe(map(dto => new FacilityPersonnelEntity(dto)));
  }

  public deleteFacilityPersonnel(facilityId: string, personnelId: string): Observable<void> {
    return this.baseApi.facilities.deleteFacilityPersonnel(facilityId, personnelId);
  }

  public createFacilityTransportMethod(facilityId: string, data): Observable<TransportMethodEntity> {
    return this.baseApi.facilities
      .addFacilityTransportMethod(facilityId, data)
      .pipe(map(dto => new TransportMethodEntity(dto)));
  }

  public deleteFacilityTransportMethod(facilityId: string, transportMethodId: string): Observable<void> {
    return this.baseApi.facilities.deleteFacilityTransportMethod(facilityId, transportMethodId);
  }

  private handleAddFacilityError(error): any {
    if (error.status === 400 && (error.message === 'ID must be unique' || error.message === 'Duplicate entry.')) {
      this.notificationHelperService.showValidation(
        'The specified name is already in use in BuyChain platform, either in an active or an archived facilities.' +
          ' Please specify a different name.'
      );
    }
    return error;
  }
}
