import { Injectable } from '@angular/core';
import { FacilitiesService } from '@app/services/app-layer/facilities/facilities.service';
import { CompaniesService } from '@services/app-layer/companies/companies.service';
import { FacilityEntity } from '@services/app-layer/entities/facility';
import { MemberEntity } from '@services/app-layer/entities/member';
import { forkJoin } from 'rxjs';
import { first, tap } from 'rxjs/operators';
import { Environment } from '@services/app-layer/app-layer.environment';

@Injectable({
  providedIn: 'root'
})
export class ReportingService {
  companyMembers: MemberEntity[] = [];
  companyFacilities: FacilityEntity[] = [];

  constructor(private companiesService: CompaniesService, private facilitiesService: FacilitiesService) {}

  loadData() {
    return forkJoin([
      this.companiesService.getCompanyCompleteMembers(),
      this.facilitiesService.getCompanyFacilitiesAll(Environment.getCurrentUser().companyId)
    ]).pipe(
      first(),
      tap(([members, facilities]) => {
        this.companyMembers = members;
        this.companyFacilities = facilities;
      })
    );
  }
}
