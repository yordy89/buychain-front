/**
 * Base API
 * Base API Definition.
 *
 * OpenAPI spec version: 0.247.0
 * Contact: hambardzumyan.albert@gmail.com
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 */
import { CrmAccountBasic } from './crmAccountBasic';
import { CrmAccountCreditInfo } from './crmAccountCreditInfo';
import { CrmAccountSalesInfo } from './crmAccountSalesInfo';


export interface CrmAccountCreatePayload { 
    readonly id?: string;
    link?: string;
    name?: string;
    website?: string;
    streetAddress?: string;
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
    logoUrl?: string;
    salesTeam?: Array<string>;
    readonly source?: string;
    readonly companyId?: string;
    readonly archived?: string;
    readonly createdAt?: Date;
    readonly updatedAt?: Date;
    salesInfo?: CrmAccountSalesInfo;
    creditInfo?: CrmAccountCreditInfo;
    type?: CrmAccountCreatePayload.TypeEnum;
}
export namespace CrmAccountCreatePayload {
    export type TypeEnum = 'CUSTOMER' | 'VENDOR';
    export const TypeEnum = {
        CUSTOMER: 'CUSTOMER' as TypeEnum,
        VENDOR: 'VENDOR' as TypeEnum
    };
}
