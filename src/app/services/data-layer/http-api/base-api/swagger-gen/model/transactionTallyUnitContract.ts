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


export interface TransactionTallyUnitContract { 
    readonly state?: TransactionTallyUnitContract.StateEnum;
    number?: string;
    readonly internalRefNumber?: number;
    contractPrice?: number;
    /**
     * The date-time notation as defined by RFC 3339, section 5.6.
     */
    expirationDate?: Date;
    terms?: string;
}
export namespace TransactionTallyUnitContract {
    export type StateEnum = 'DRAFT' | 'OPEN' | 'CLOSED';
    export const StateEnum = {
        DRAFT: 'DRAFT' as StateEnum,
        OPEN: 'OPEN' as StateEnum,
        CLOSED: 'CLOSED' as StateEnum
    };
}
