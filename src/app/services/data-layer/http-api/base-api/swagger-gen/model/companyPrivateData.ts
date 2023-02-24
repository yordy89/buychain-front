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
import { CompanyPrivateDataAccountingPractices } from './companyPrivateDataAccountingPractices';
import { CompanyPrivateDataPrivacySettings } from './companyPrivateDataPrivacySettings';
import { CompanyPrivateDataSalesPractices } from './companyPrivateDataSalesPractices';


export interface CompanyPrivateData { 
    accountingPractices?: CompanyPrivateDataAccountingPractices;
    privacySettings?: CompanyPrivateDataPrivacySettings;
    salesPractices?: CompanyPrivateDataSalesPractices;
}