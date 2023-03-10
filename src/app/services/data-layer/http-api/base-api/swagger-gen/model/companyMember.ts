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


export interface CompanyMember { 
    readonly id?: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    profilePictureUrl?: string;
    title?: string;
    callingCode?: string;
    workPhone?: string;
    productsOfInterestIds?: Array<string>;
    readonly systemRoles?: Array<CompanyMember.SystemRolesEnum>;
    readonly profileCompletionState?: CompanyMember.ProfileCompletionStateEnum;
    /**
     * Hex, ref Companies.
     */
    readonly companyId?: string;
    /**
     * The date-time notation as defined by RFC 3339, section 5.6.
     */
    readonly createdAt?: Date;
    /**
     * The date-time notation as defined by RFC 3339, section 5.6.
     */
    readonly updatedAt?: Date;
}
export namespace CompanyMember {
    export type SystemRolesEnum = 'COMPANY_ADMIN' | 'BILLING_ADMIN' | 'ANALYTIC_TEST_USER';
    export const SystemRolesEnum = {
        COMPANYADMIN: 'COMPANY_ADMIN' as SystemRolesEnum,
        BILLINGADMIN: 'BILLING_ADMIN' as SystemRolesEnum,
        ANALYTICTESTUSER: 'ANALYTIC_TEST_USER' as SystemRolesEnum
    };
    export type ProfileCompletionStateEnum = 'INITIAL' | 'PENDING_COMPANY' | 'MEMBER' | 'PROFILE' | 'COMPLETE';
    export const ProfileCompletionStateEnum = {
        INITIAL: 'INITIAL' as ProfileCompletionStateEnum,
        PENDINGCOMPANY: 'PENDING_COMPANY' as ProfileCompletionStateEnum,
        MEMBER: 'MEMBER' as ProfileCompletionStateEnum,
        PROFILE: 'PROFILE' as ProfileCompletionStateEnum,
        COMPLETE: 'COMPLETE' as ProfileCompletionStateEnum
    };
}
