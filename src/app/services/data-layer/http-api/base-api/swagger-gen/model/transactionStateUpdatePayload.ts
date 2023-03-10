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


export interface TransactionStateUpdatePayload { 
    state: TransactionStateUpdatePayload.StateEnum;
}
export namespace TransactionStateUpdatePayload {
    export type StateEnum = 'QUOTE' | 'REVIEW' | 'IN_TRANSIT' | 'COMPLETE';
    export const StateEnum = {
        QUOTE: 'QUOTE' as StateEnum,
        REVIEW: 'REVIEW' as StateEnum,
        INTRANSIT: 'IN_TRANSIT' as StateEnum,
        COMPLETE: 'COMPLETE' as StateEnum
    };
}
