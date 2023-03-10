/**
 * Base API
 * Base API Definition.
 *
 * OpenAPI spec version: 0.270.0
 * Contact: hambardzumyan.albert@gmail.com
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 */


export interface ProductLotsUpdatePermissionBulkPayload { 
    ids: Array<string>;
    permission: ProductLotsUpdatePermissionBulkPayload.PermissionEnum;
}
export namespace ProductLotsUpdatePermissionBulkPayload {
    export type PermissionEnum = 'PRIVATE' | 'INTERNAL' | 'EXTERNAL';
    export const PermissionEnum = {
        PRIVATE: 'PRIVATE' as PermissionEnum,
        INTERNAL: 'INTERNAL' as PermissionEnum,
        EXTERNAL: 'EXTERNAL' as PermissionEnum
    };
}
