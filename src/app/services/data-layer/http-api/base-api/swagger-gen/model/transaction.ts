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
import { TransactionChangePending } from './transactionChangePending';
import { TransactionCostDataBase } from './transactionCostDataBase';
import { TransactionLog } from './transactionLog';
import { TransactionMilestone } from './transactionMilestone';
import { TransactionRegister } from './transactionRegister';
import { TransactionTally } from './transactionTally';
import { TransactionTrackingData } from './transactionTrackingData';
import { TransactionTransactionalJournal } from './transactionTransactionalJournal';


export interface Transaction { 
    readonly id?: string;
    state?: Transaction.StateEnum;
    costData?: TransactionCostDataBase;
    tally?: TransactionTally;
    trackingData?: TransactionTrackingData;
    transactionalJournalAllRead?: Array<string>;
    milestones?: Array<TransactionMilestone>;
    register?: TransactionRegister;
    changePending?: TransactionChangePending;
    transactionJournal?: TransactionTransactionalJournal;
    readonly log?: Array<TransactionLog>;
    /**
     * The date-time notation as defined by RFC 3339, section 5.6.
     */
    readonly createdAt?: Date;
    /**
     * The date-time notation as defined by RFC 3339, section 5.6.
     */
    readonly updatedAt?: Date;
}
export namespace Transaction {
    export type StateEnum = 'DRAFT' | 'QUOTE' | 'REVIEW' | 'CONFIRMED' | 'IN_TRANSIT' | 'COMPLETE' | 'CHANGE_PENDING' | 'CANCELED';
    export const StateEnum = {
        DRAFT: 'DRAFT' as StateEnum,
        QUOTE: 'QUOTE' as StateEnum,
        REVIEW: 'REVIEW' as StateEnum,
        CONFIRMED: 'CONFIRMED' as StateEnum,
        INTRANSIT: 'IN_TRANSIT' as StateEnum,
        COMPLETE: 'COMPLETE' as StateEnum,
        CHANGEPENDING: 'CHANGE_PENDING' as StateEnum,
        CANCELED: 'CANCELED' as StateEnum
    };
}