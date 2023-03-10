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


export interface Personnel { 
    userId: string;
    description: string;
    department: Personnel.DepartmentEnum;
    readonly updatedAt?: Date;
    readonly createdAt?: Date;
}
export namespace Personnel {
    export type DepartmentEnum = 'LOADING' | 'RECEIVING';
    export const DepartmentEnum = {
        LOADING: 'LOADING' as DepartmentEnum,
        RECEIVING: 'RECEIVING' as DepartmentEnum
    };
}
