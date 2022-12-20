/**
 * Base API
 * Base API Definition.
 *
 * OpenAPI spec version: 1.0.0
 * Contact: hambardzumyan.albert@gmail.com
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 */
import { UiProductsProductGroups } from './uiProductsProductGroups';


export interface UiProducts { 
    priceSystem?: Array<string>;
    unitPieceCount?: string;
    productGroups?: Array<UiProductsProductGroups>;
}
