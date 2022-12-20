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
import { TransactionTrackingDataBase } from './transactionTrackingDataBase';
import { TransactionTrackingDataBuyerData } from './transactionTrackingDataBuyerData';
import { TransactionTrackingDataSellerData } from './transactionTrackingDataSellerData';


export interface TransactionTrackingData { 
    transportMethod?: any;
    transportTerm?: TransactionTrackingData.TransportTermEnum;
    /**
     * Null is allowed.
     */
    estimatedShipDate?: Date;
    readonly creatorId?: string;
    /**
     * Null is allowed.
     */
    pONumber?: string;
    /**
     * Null is allowed.
     */
    sONumber?: string;
    readonly auditAddress?: string;
    buyerData?: TransactionTrackingDataBuyerData;
    sellerData?: TransactionTrackingDataSellerData;
}
export namespace TransactionTrackingData {
    export type TransportTermEnum = 'FOB_DEST_PREPAY' | 'FOB_DEST_COLLECT' | 'FOB_DEST_PREPAY_CHARGE' | 'FOB_ORIGIN_PREPAY' | 'FOB_ORIGIN_COLLECT' | 'FOB_ORIGIN_PREPAY_CHARGE';
    export const TransportTermEnum = {
        DESTPREPAY: 'FOB_DEST_PREPAY' as TransportTermEnum,
        DESTCOLLECT: 'FOB_DEST_COLLECT' as TransportTermEnum,
        DESTPREPAYCHARGE: 'FOB_DEST_PREPAY_CHARGE' as TransportTermEnum,
        ORIGINPREPAY: 'FOB_ORIGIN_PREPAY' as TransportTermEnum,
        ORIGINCOLLECT: 'FOB_ORIGIN_COLLECT' as TransportTermEnum,
        ORIGINPREPAYCHARGE: 'FOB_ORIGIN_PREPAY_CHARGE' as TransportTermEnum
    };
}
