/**
 * Base API
 * Base API Definition.
 *
 * OpenAPI spec version: 0.242.0
 * Contact: hambardzumyan.albert@gmail.com
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 */


export interface ProductLotsBulkUpdatePermissionPayload { 
    ids?: Array<string>;
    permission?: ProductLotsBulkUpdatePermissionPayload.PermissionEnum;
}
export namespace ProductLotsBulkUpdatePermissionPayload {
    export type PermissionEnum = 'PRIVATE' | 'INTERNAL' | 'EXTERNAL';
    export const PermissionEnum = {
        PRIVATE: 'PRIVATE' as PermissionEnum,
        INTERNAL: 'INTERNAL' as PermissionEnum,
        EXTERNAL: 'EXTERNAL' as PermissionEnum
    };
}