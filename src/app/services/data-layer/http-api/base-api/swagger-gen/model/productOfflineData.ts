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


export interface ProductOfflineData { 
    readonly organizationName?: string;
    /**
     * Hex, ref Crm-Accounts.
     */
    organizationId: string;
    readonly shipFromShortName?: string;
    /**
     * Hex, ref Crm-Locations.
     */
    shipFromId: string;
    readonly sellingContactName?: string;
    /**
     * Hex, ref Crm-Contacts.
     */
    sellingContactId: string;
    /**
     * Hex, ref Companies.
     */
    readonly creatingCompanyId?: string;
}
