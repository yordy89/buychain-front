/**
 * Base API
 * Base API Definition.
 *
 * OpenAPI spec version: 1.0.0
 * Contact: hambardzumyan.albert@gmail.com
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 */


export interface TransactionChangePendingTypes { 
    type?: TransactionChangePendingTypes.TypeEnum;
}
export namespace TransactionChangePendingTypes {
    export type TypeEnum = 'CANCEL';
    export const TypeEnum = {
        CANCEL: 'CANCEL' as TypeEnum
    };
}
