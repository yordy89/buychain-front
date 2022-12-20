import { Injectable } from '@angular/core';
import { FacilitiesService } from './swagger-gen/api/facilities.service';
import {
  CompaniesService,
  CrmService,
  StatusService,
  TemporaryCompaniesService,
  LabelsService,
  RateTablesService, GroupsService, TransactionsService, ProductsService
} from '@app/services/data-layer/http-api/base-api/swagger-gen';
import {UsersApiExtendedService} from '@services/data-layer/http-api/base-api/extensions/services/users/users.service';


@Injectable({
  providedIn: 'root'
})
export class BaseApiService {
  constructor(
    public transactions: TransactionsService,
    public facilities: FacilitiesService,
    // public facilities: FacilitiesApiExtendedService,
    public companies: CompaniesService,
    public crm: CrmService,
    public status: StatusService,
    public products: ProductsService,
    // public users: UsersService,
    public users: UsersApiExtendedService,
    public temporaryCompany: TemporaryCompaniesService,
    public labels: LabelsService,
    public rateTables: RateTablesService,
    public groups: GroupsService,
  ) { }
}
