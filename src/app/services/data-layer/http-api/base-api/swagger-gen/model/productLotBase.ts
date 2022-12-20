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
import { ProductLotLog } from './productLotLog';
import { ProductLotOfflineData } from './productLotOfflineData';
import { ProductLotOnlineData } from './productLotOnlineData';
import { ProductLotSalesData } from './productLotSalesData';
import { ProductLotSpec } from './productLotSpec';


export interface ProductLotBase { 
    readonly id?: string;
    mfgFacilityShortName: string;
    readonly ownerName?: string;
    /**
     * Hex, ref Users.
     */
    readonly ownerId?: string;
    readonly state?: ProductLotBase.StateEnum;
    readonly permission?: ProductLotBase.PermissionEnum;
    readonly allocated?: boolean;
    /**
     * Hex, ref Transactios.
     */
    readonly allocatedTransactionId?: string;
    readonly archived?: boolean;
    salesNotes?: string;
    salesData?: ProductLotSalesData;
    offlineData?: ProductLotOfflineData;
    onlineData?: ProductLotOnlineData;
    spec: ProductLotSpec;
    readonly specShorthand?: string;
    readonly log?: Array<ProductLotLog>;
    /**
     * The date-time notation as defined by RFC 3339, section 5.6.
     */
    readonly createdAt?: Date;
    /**
     * The date-time notation as defined by RFC 3339, section 5.6.
     */
    readonly updatedAt?: Date;
}
export namespace ProductLotBase {
    export type StateEnum = 'DRAFT' | 'ON_ORDER' | 'SOLD' | 'IN_TRANSIT' | 'ON_HAND' | 'CANCELED';
    export const StateEnum = {
        DRAFT: 'DRAFT' as StateEnum,
        ONORDER: 'ON_ORDER' as StateEnum,
        SOLD: 'SOLD' as StateEnum,
        INTRANSIT: 'IN_TRANSIT' as StateEnum,
        ONHAND: 'ON_HAND' as StateEnum,
        CANCELED: 'CANCELED' as StateEnum
    };
    export type PermissionEnum = 'PRIVATE' | 'INTERNAL' | 'EXTERNAL';
    export const PermissionEnum = {
        PRIVATE: 'PRIVATE' as PermissionEnum,
        INTERNAL: 'INTERNAL' as PermissionEnum,
        EXTERNAL: 'EXTERNAL' as PermissionEnum
    };
}
