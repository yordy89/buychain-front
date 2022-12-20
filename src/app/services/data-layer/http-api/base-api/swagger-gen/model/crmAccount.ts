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
import { CrmAccountBase } from './crmAccountBase';
import { CrmAccountCreditInfo } from './crmAccountCreditInfo';
import { CrmAccountPaymentInfo } from './crmAccountPaymentInfo';
import { CrmAccountSalesInfo } from './crmAccountSalesInfo';


export interface CrmAccount { 
    readonly id?: string;
    /**
     * Hex, ref Companies. Unique within company. Null is allowed.
     */
    link?: string;
    /**
     * Unique within company.
     */
    name: string;
    /**
     * Website. Null is allowed.
     */
    website?: string;
    /**
     * Null is allowed.
     */
    streetAddress?: string;
    /**
     * Null is allowed.
     */
    city?: string;
    /**
     * Null is allowed.
     */
    state?: string;
    /**
     * Null is allowed.
     */
    country?: string;
    /**
     * Null is allowed.
     */
    zipCode?: string;
    /**
     * Null is allowed.
     */
    logoUrl?: string;
    salesTeam?: Array<string>;
    /**
     * Hex, ref Crm-Contacts. Null is allowed.
     */
    defaultBillToContact?: string;
    /**
     * Hex, ref Crm-Locations. Null is allowed.
     */
    defaultBillToLocation?: string;
    /**
     * Hex, ref Companies.
     */
    readonly companyId?: string;
    archived?: boolean;
    /**
     * The date-time notation as defined by RFC 3339, section 5.6.
     */
    readonly createdAt?: Date;
    /**
     * The date-time notation as defined by RFC 3339, section 5.6.
     */
    readonly updatedAt?: Date;
    salesInfo?: CrmAccountSalesInfo;
    creditInfo?: CrmAccountCreditInfo;
    paymentInfo?: CrmAccountPaymentInfo;
}
