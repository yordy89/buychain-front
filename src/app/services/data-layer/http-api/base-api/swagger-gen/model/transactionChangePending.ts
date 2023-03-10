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
import { TransactionChangePendingTransport } from './transactionChangePendingTransport';


export interface TransactionChangePending { 
    type?: TransactionChangePending.TypeEnum;
    readonly prevState?: TransactionChangePending.PrevStateEnum;
    readonly buyerApproved?: boolean;
    readonly sellerApproved?: boolean;
    transport?: TransactionChangePendingTransport;
}
export namespace TransactionChangePending {
    export type TypeEnum = 'CANCEL' | 'MODIFY_TRANSPORT';
    export const TypeEnum = {
        CANCEL: 'CANCEL' as TypeEnum,
        MODIFYTRANSPORT: 'MODIFY_TRANSPORT' as TypeEnum
    };
    export type PrevStateEnum = 'CONFIRMED' | 'IN_TRANSIT';
    export const PrevStateEnum = {
        CONFIRMED: 'CONFIRMED' as PrevStateEnum,
        INTRANSIT: 'IN_TRANSIT' as PrevStateEnum
    };
}
