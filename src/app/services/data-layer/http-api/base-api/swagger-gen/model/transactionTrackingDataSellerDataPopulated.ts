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
import { TransactionTrackingDataSellerData } from './transactionTrackingDataSellerData';
import { TransactionTrackingDataSellerDataCrmData } from './transactionTrackingDataSellerDataCrmData';
import { TransactionTrackingDataSellerDataOnlineData } from './transactionTrackingDataSellerDataOnlineData';
import { TransactionTrackingDataSellerDataOnlineOrCrmDataPopulated } from './transactionTrackingDataSellerDataOnlineOrCrmDataPopulated';


export interface TransactionTrackingDataSellerDataPopulated { 
    readonly sellerApproved?: boolean;
    readonly reviewApproved?: boolean;
    readonly reviewApprover?: string;
    crmData?: TransactionTrackingDataSellerDataOnlineOrCrmDataPopulated;
    onlineData?: TransactionTrackingDataSellerDataOnlineOrCrmDataPopulated;
}
