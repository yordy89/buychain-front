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


export interface CompanyBase { 
    readonly id?: string;
    /**
     * Unique.
     */
    readonly name?: string;
    /**
     * Website.
     */
    website?: string;
    streetAddress?: string;
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
    /**
     * Null is allowed.
     */
    logoUrl?: string;
}
