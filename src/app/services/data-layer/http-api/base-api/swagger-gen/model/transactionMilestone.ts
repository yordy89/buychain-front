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


export interface TransactionMilestone { 
    readonly id?: string;
    description: string;
    icon: string;
    /**
     * Hex, ref Dcouments.
     */
    attachment?: string;
    /**
     * Hex, ref Users.
     */
    readonly creator?: string;
    /**
     * The date-time notation as defined by RFC 3339, section 5.6.
     */
    readonly createdAt?: Date;
    /**
     * The date-time notation as defined by RFC 3339, section 5.6.
     */
    readonly updatedAt?: Date;
}
