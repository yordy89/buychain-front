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
import { TransactionChangePendingTransportCrmData } from './transactionChangePendingTransportCrmData';
import { TransactionChangePendingTransportOnlineData } from './transactionChangePendingTransportOnlineData';
import { TransportMethodEmbeddedInTrackingData } from './transportMethodEmbeddedInTrackingData';


/**
 * Required if type is MODIFY_TRANSPORT.
 */
export interface TransactionChangePendingTransport { 
    crmData?: TransactionChangePendingTransportCrmData;
    estimatedShipDate?: Date;
    onlineData?: TransactionChangePendingTransportOnlineData;
    shippingCost?: number;
    transportMethod?: TransportMethodEmbeddedInTrackingData;
    transportTerm?: TransactionChangePendingTransport.TransportTermEnum;
}
export namespace TransactionChangePendingTransport {
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
