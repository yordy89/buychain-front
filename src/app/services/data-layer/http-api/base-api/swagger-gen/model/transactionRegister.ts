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


export interface TransactionRegister { 
    /**
     * The date-time notation as defined by RFC 3339, section 5.6.
     */
    readonly draftDate?: Date;
    /**
     * The date-time notation as defined by RFC 3339, section 5.6.
     */
    readonly quoteDate?: Date;
    /**
     * The date-time notation as defined by RFC 3339, section 5.6.
     */
    readonly reviewDate?: Date;
    /**
     * The date-time notation as defined by RFC 3339, section 5.6.
     */
    readonly confirmedDate?: Date;
    /**
     * The date-time notation as defined by RFC 3339, section 5.6.
     */
    readonly inTransitDate?: Date;
    /**
     * The date-time notation as defined by RFC 3339, section 5.6.
     */
    readonly completeDate?: Date;
    /**
     * The date-time notation as defined by RFC 3339, section 5.6.
     */
    readonly canceledDate?: Date;
}
