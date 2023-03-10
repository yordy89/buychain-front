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


export interface ProductContract { 
    readonly state?: ProductContract.StateEnum;
    /**
     * Hex, ref Crm-Accounts.
     */
    readonly supplier?: string;
    /**
     * Hex, ref Crm-Accounts.
     */
    readonly broker?: string;
    readonly number?: string;
    readonly internalRefNumber?: number;
    /**
     * The date-time notation as defined by RFC 3339, section 5.6.
     */
    readonly openedDate?: Date;
    /**
     * The date-time notation as defined by RFC 3339, section 5.6.
     */
    readonly closedDate?: Date;
    readonly contractPrice?: number;
    /**
     * The date-time notation as defined by RFC 3339, section 5.6.
     */
    readonly expirationDate?: Date;
    readonly terms?: string;
}
export namespace ProductContract {
    export type StateEnum = 'DRAFT' | 'OPEN' | 'CLOSED';
    export const StateEnum = {
        DRAFT: 'DRAFT' as StateEnum,
        OPEN: 'OPEN' as StateEnum,
        CLOSED: 'CLOSED' as StateEnum
    };
}
