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
import { CompanyMemberBase } from './companyMemberBase';
import { UserAccessControlRoles } from './userAccessControlRoles';


export interface CompanyMemberPartial { 
    readonly id?: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    profilePictureUrl?: string;
    title?: string;
    callingCode?: string;
    workPhone?: string;
    accountState?: CompanyMemberPartial.AccountStateEnum;
    accessControlRoles?: UserAccessControlRoles;
}
export namespace CompanyMemberPartial {
    export type AccountStateEnum = 'NOT_ACTIVE' | 'WAIT_APPROVAL' | 'APPROVED' | 'HOLD' | 'UPDATE_REQUIRED';
    export const AccountStateEnum = {
        NOTACTIVE: 'NOT_ACTIVE' as AccountStateEnum,
        WAITAPPROVAL: 'WAIT_APPROVAL' as AccountStateEnum,
        APPROVED: 'APPROVED' as AccountStateEnum,
        HOLD: 'HOLD' as AccountStateEnum,
        UPDATEREQUIRED: 'UPDATE_REQUIRED' as AccountStateEnum
    };
}
