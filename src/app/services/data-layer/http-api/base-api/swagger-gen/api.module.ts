import { NgModule, ModuleWithProviders, SkipSelf, Optional } from '@angular/core';
import { Configuration } from './configuration';
import { HttpClient } from '@angular/common/http';
import { CompaniesService } from './api/companies.service';
import { CrmService } from './api/crm.service';
import { FacilitiesService } from './api/facilities.service';
import { GroupsService } from './api/groups.service';
import { LabelsService } from './api/labels.service';
import { ProductsService } from './api/products.service';
import { RateTablesService } from './api/rateTables.service';
import { StatusService } from './api/status.service';
import { TemporaryCompaniesService } from './api/temporaryCompanies.service';
import { TransactionsService } from './api/transactions.service';
import { UsersService } from './api/users.service';

@NgModule({
  imports:      [],
  declarations: [],
  exports:      [],
  providers: [
    CompaniesService,
    CrmService,
    FacilitiesService,
    GroupsService,
    LabelsService,
    ProductsService,
    RateTablesService,
    StatusService,
    TemporaryCompaniesService,
    TransactionsService,
    UsersService ]
})
export class ApiModule {
    public static forRoot(configurationFactory: () => Configuration): ModuleWithProviders<ApiModule> {
        return {
            ngModule: ApiModule,
            providers: [ { provide: Configuration, useFactory: configurationFactory } ]
        };
    }

    constructor( @Optional() @SkipSelf() parentModule: ApiModule,
                 @Optional() http: HttpClient) {
        if (parentModule) {
            throw new Error('ApiModule is already loaded. Import in your base AppModule only.');
        }
        if (!http) {
            throw new Error('You need to import the HttpClientModule in your AppModule! \n' +
            'See also https://github.com/angular/angular/issues/20575');
        }
    }
}
