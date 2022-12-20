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
import { ProductLotEmbeddedInTransactionTallyUnitOfflineData } from './productLotEmbeddedInTransactionTallyUnitOfflineData';
import { ProductLotEmbeddedInTransactionTallyUnitOnlineData } from './productLotEmbeddedInTransactionTallyUnitOnlineData';
import { ProductLotProductEmbeddedInTransactionTallyUnit } from './productLotProductEmbeddedInTransactionTallyUnit';
import { ProductLotSalesData } from './productLotSalesData';
import { ProductLotSpec } from './productLotSpec';


export interface ProductLotEmbeddedInTransactionTallyUnit { 
    readonly id?: string;
    readonly mfgFacilityShortName?: string;
    offlineData?: ProductLotEmbeddedInTransactionTallyUnitOfflineData;
    onlineData?: ProductLotEmbeddedInTransactionTallyUnitOnlineData;
    salesData?: ProductLotSalesData;
    spec?: ProductLotSpec;
    readonly products?: Array<ProductLotProductEmbeddedInTransactionTallyUnit>;
}
