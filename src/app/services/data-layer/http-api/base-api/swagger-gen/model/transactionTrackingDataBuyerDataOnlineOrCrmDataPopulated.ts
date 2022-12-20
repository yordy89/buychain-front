/**
 * Base API
 * Base API Definition.
 *
 * OpenAPI spec version: 0.316.0
 * Contact: hambardzumyan.albert@gmail.com
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 */
import { CompanyEmbeddedInTransaction } from './companyEmbeddedInTransaction';
import { FacilityEmbeddedInTransaction } from './facilityEmbeddedInTransaction';
import { UserEmbeddedInTransaction } from './userEmbeddedInTransaction';


export interface TransactionTrackingDataBuyerDataOnlineOrCrmDataPopulated { 
    buyingCompany?: CompanyEmbeddedInTransaction;
    buyingUser?: UserEmbeddedInTransaction;
    shipTo?: FacilityEmbeddedInTransaction;
    billToContact?: UserEmbeddedInTransaction;
    billToLocation?: FacilityEmbeddedInTransaction;
}
