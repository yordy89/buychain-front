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


export interface UserCreatePayload { 
    /**
     * Case insensitive.
     */
    username: string;
    /**
     * Minimum of a) 1 lowercase letter, b) 1 uppercase letter, c) 1 digit, d) 1 symbol, and NO spaces.
     */
    password: string;
    applicationUrl: string;
}
