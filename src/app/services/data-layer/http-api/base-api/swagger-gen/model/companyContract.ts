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


export interface CompanyContract { 
    type?: CompanyContract.TypeEnum;
    basisPoints?: number;
}
export namespace CompanyContract {
    export type TypeEnum = 'BP_ONLY' | 'FREE';
    export const TypeEnum = {
        BPONLY: 'BP_ONLY' as TypeEnum,
        FREE: 'FREE' as TypeEnum
    };
}