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


export interface CompanyAccountingPracticesDefaultAccounts { 
    /**
     * Hex, ref Accounts.
     */
    accountsPayable?: string;
    /**
     * Hex, ref Accounts.
     */
    accountsReceivable?: string;
    /**
     * Hex, ref Accounts.
     */
    cogsFees?: string;
    /**
     * Hex, ref Accounts.
     */
    cogsOther?: string;
    /**
     * Hex, ref Accounts.
     */
    cogsShipping?: string;
    /**
     * Hex, ref Accounts.
     */
    expense?: string;
    /**
     * Hex, ref Accounts.
     */
    inventoryInTransit?: string;
    /**
     * Hex, ref Accounts.
     */
    inventoryOnConsignment?: string;
    /**
     * Hex, ref Accounts.
     */
    inventoryOnHand?: string;
    /**
     * Hex, ref Accounts.
     */
    inventoryOnOrder?: string;
    /**
     * Hex, ref Accounts.
     */
    inventoryRawMaterials?: string;
    /**
     * Hex, ref Accounts.
     */
    retainedEarnings?: string;
    /**
     * Hex, ref Accounts.
     */
    revenue?: string;
    /**
     * Hex, ref Accounts.
     */
    taxExpense?: string;
}