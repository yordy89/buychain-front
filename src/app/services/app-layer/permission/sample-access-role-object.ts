import {
  AccessControlGroup,
  AccessControlScope,
  AccessControlSystem
} from '@services/app-layer/permission/permission.interface';

const AccessControlsComplete = [
  { value: AccessControlScope.Company, order: 2 },
  { value: AccessControlScope.None, order: 1 },
  { value: AccessControlScope.Owner, order: 3 }
];
const AccessControlsLimited = [
  { value: AccessControlScope.Company, order: 2 },
  { value: AccessControlScope.None, order: 1 }
];
const AccessControlsLimitedOwner = [
  { value: AccessControlScope.Company, order: 2 },
  { value: AccessControlScope.Owner, order: 1 }
];
const AccessControlsPublic = [{ value: AccessControlScope.Company, order: 1 }];

export const SampleAccessControl: AccessControlSystem = {
  COMPANY: {
    readCompanySection: {
      sectionName: '',
      sectionAllowedValues: AccessControlsPublic,
      sectionGroup: {
        readDetails: <AccessControlGroup>{
          groupName: 'Read Details',
          groupUnits: ['GET_COMPANY'],
          description: 'View details of the company, limited to your own company',
          value: AccessControlScope.None,
          orderNumber: 1
        }
      }
    },
    companySection: {
      sectionName: 'Company',
      sectionAllowedValues: AccessControlsLimited,
      sectionGroup: {
        updateDetails: <AccessControlGroup>{
          groupName: 'Update Details',
          groupUnits: ['UPDATE_COMPANY'],
          description: 'Modify company data like address, logo',
          value: AccessControlScope.None,
          orderNumber: 1
        },
        updateSalesPractices: <AccessControlGroup>{
          groupName: 'Update Sales Practices',
          groupUnits: ['UPDATE_COMPANY_SALES_PRACTICES'],
          description: "Modify the company's sales policies that will effect all sales users",
          value: AccessControlScope.None,
          orderNumber: 2
        },
        updatePrivacySettings: <AccessControlGroup>{
          groupName: 'Update Privacy Settings',
          groupUnits: ['UPDATE_COMPANY_PRIVACY_SETTINGS'],
          description: "Modify the company's privacy settings.",
          value: AccessControlScope.None,
          orderNumber: 3
        },
        updateAccountingPractices: <AccessControlGroup>{
          groupName: 'Update Accounting Practices',
          groupUnits: ['UPDATE_COMPANY_ACCOUNTING_PRACTICES', 'UPDATE_COMPANY_ACCOUNTING_PRACTICES_DEFAULT_ACCOUNTS'],
          description:
            "Modify the company's accounting policies, effects all reporting, revenue and profit calculations",
          value: AccessControlScope.None,
          orderNumber: 4
        },
        updatePendingUsers: <AccessControlGroup>{
          groupName: 'Update Pending Users',
          groupUnits: ['LIST_COMPANY_PENDING_MEMBERS', 'ADD_COMPANY_PENDING_MEMBER_ACTIVATION'],
          description: 'Allows approval of new company members/users',
          value: AccessControlScope.None,
          orderNumber: 5
        }
      }
    },
    readUsersSection: {
      sectionName: '',
      sectionAllowedValues: AccessControlsPublic,
      sectionGroup: {
        readDetails: <AccessControlGroup>{
          groupName: 'Read Company Users',
          groupUnits: ['LIST_COMPANY_MEMBERS'],
          description: 'Get a listing of all member of your company.',
          value: AccessControlScope.None,
          orderNumber: 1
        }
      }
    },
    userSection: {
      sectionName: 'User',
      sectionAllowedValues: AccessControlsLimited,
      sectionGroup: {
        readUserDetails: <AccessControlGroup>{
          groupName: 'Read User Details',
          groupUnits: ['GET_COMPANY_MEMBER'],
          description: 'View company member profile details.',
          value: AccessControlScope.None,
          orderNumber: 1
        },
        updateUser: <AccessControlGroup>{
          groupName: 'Update User',
          groupUnits: ['UPDATE_COMPANY_MEMBER'],
          description: 'Edit a company members user details, like title, phone number and profile photo.',
          value: AccessControlScope.None,
          orderNumber: 2
        },
        updateState: <AccessControlGroup>{
          groupName: 'Update State',
          groupUnits: ['UPDATE_COMPANY_MEMBER_ACCOUNT_STATE'],
          description: 'Allows setting user accounts to suspend or hold states. Should only be given to admins.',
          value: AccessControlScope.None,
          orderNumber: 3
        },
        updateGroup: <AccessControlGroup>{
          groupName: 'Update Group',
          groupUnits: ['UPDATE_COMPANY_MEMBER_GROUP'],
          description: 'Allows setting the user group.',
          value: AccessControlScope.None,
          orderNumber: 4
        },
        updateRole: <AccessControlGroup>{
          groupName: 'Update Roles',
          groupUnits: ['UPDATE_COMPANY_MEMBER_ACCESS_CONTROL_ROLES'],
          description: 'Allows setting and modification of individual roles. Should only be given to admins',
          value: AccessControlScope.None,
          orderNumber: 7
        },
        updatePrivacySettings: <AccessControlGroup>{
          groupName: 'Update Privacy Settings',
          groupUnits: ['UPDATE_COMPANY_MEMBER_PRIVACY_SETTINGS'],
          description: 'Allows setting and modification of the User privacy setting',
          value: AccessControlScope.None,
          orderNumber: 8
        }
      }
    }
  },
  FACILITY: {
    facilitySection: {
      sectionName: 'Facility',
      sectionAllowedValues: AccessControlsLimited,
      sectionGroup: {
        read: <AccessControlGroup>{
          groupName: 'Read',
          groupUnits: ['LIST_FACILITIES', 'GET_FACILITY'],
          description: 'Get public information about a facility, such as address, pickup/ delivery info etc.',
          value: AccessControlScope.None,
          orderNumber: 1
        },
        create: <AccessControlGroup>{
          groupName: 'Create',
          groupUnits: ['ADD_FACILITY'],
          description: 'Allows this user to create new facilities on behalf of their company.',
          value: AccessControlScope.None,
          orderNumber: 2
        },
        update: <AccessControlGroup>{
          groupName: 'Update',
          groupUnits: ['UPDATE_FACILITY', 'ADD_FACILITY_PERSONNEL', 'ADD_FACILITY_TRANSPORT_METHOD'],
          description: 'Allows this user to modify existing facilities on behalf of their company',
          value: AccessControlScope.None,
          orderNumber: 3
        },
        delete: <AccessControlGroup>{
          groupName: 'Delete',
          groupUnits: ['DELETE_FACILITY_PERSONNEL', 'DELETE_FACILITY_TRANSPORT_METHOD'],
          description: "Allows this user to remove company facilities' personnel and transport methods.",
          value: AccessControlScope.None,
          orderNumber: 4
        }
      }
    }
  },
  RATE_TABLE: {
    readRateTableSection: {
      sectionName: '',
      sectionAllowedValues: AccessControlsPublic,
      sectionGroup: {
        read: <AccessControlGroup>{
          groupName: 'Read',
          groupUnits: [],
          description: 'View rate tables of the company',
          value: AccessControlScope.Company,
          orderNumber: 1
        }
      }
    },
    rateTableSection: {
      sectionName: 'Rate Table',
      sectionAllowedValues: AccessControlsLimited,
      sectionGroup: {
        update: <AccessControlGroup>{
          groupName: 'Modify',
          groupUnits: [
            'ADD_RATE_TABLE',
            'UPDATE_RATE_TABLE',
            'ADD_RATE_TABLE_CLONE',
            'ADD_RATE_TABLE_ENTRY',
            'UPDATE_RATE_TABLE_ENTRY',
            'ADD_RATE_TABLE_ENTRIES'
          ],
          description: 'Allows this user to create or modify rate tables on behalf of their company.',
          value: AccessControlScope.None,
          orderNumber: 1
        },
        delete: <AccessControlGroup>{
          groupName: 'Delete',
          groupUnits: ['DELETE_RATE_TABLE', 'DELETE_RATE_TABLE_ENTRY'],
          description: 'Allows a user to delete a rate table on behalf of the company.',
          value: AccessControlScope.None,
          orderNumber: 2
        }
      }
    }
  },
  LABEL: {
    labelSection: {
      sectionName: 'Label',
      sectionAllowedValues: AccessControlsLimited,
      sectionGroup: {
        read: <AccessControlGroup>{
          groupName: 'Read Labels',
          groupUnits: ['LIST_LABELS'],
          description: '(All Members) Allow user to read labels.',
          value: AccessControlScope.None,
          orderNumber: 1
        },
        create: <AccessControlGroup>{
          groupName: 'Create Labels',
          groupUnits: ['ADD_LABEL'],
          description: 'Allow user to create new labels for use in places like the CRM.',
          value: AccessControlScope.None,
          orderNumber: 2
        },
        update: <AccessControlGroup>{
          groupName: 'Update Labels',
          groupUnits: ['UPDATE_LABEL'],
          description: 'Allow user to update the color and text of labels.',
          value: AccessControlScope.None,
          orderNumber: 3
        },
        delete: <AccessControlGroup>{
          groupName: 'Delete Labels',
          groupUnits: ['DELETE_LABEL'],
          description: 'Allow user to remove a label. Removing a label removes it from all objects.',
          value: AccessControlScope.None,
          orderNumber: 4
        }
      }
    }
  },
  GROUP: {
    groupSection: {
      sectionName: 'Group',
      sectionAllowedValues: AccessControlsLimited,
      sectionGroup: {
        read: <AccessControlGroup>{
          groupName: 'Read Groups',
          groupUnits: ['LIST_GROUPS', 'GET_GROUP'],
          description: '(All Members) Allow user to read groups.',
          value: AccessControlScope.None,
          orderNumber: 1
        },
        create: <AccessControlGroup>{
          groupName: 'Create Groups',
          groupUnits: ['ADD_GROUP'],
          description: 'Allow user to create new groups.',
          value: AccessControlScope.None,
          orderNumber: 2
        },
        update: <AccessControlGroup>{
          groupName: 'Update Groups',
          groupUnits: ['UPDATE_GROUP'],
          description: 'Allow user to update the groups.',
          value: AccessControlScope.None,
          orderNumber: 3
        },
        updateAccountingInfo: <AccessControlGroup>{
          groupName: "Update Group's accounting info",
          groupUnits: ['UPDATE_GROUP_ACCOUNTING_INFO'],
          description: "Allow user to update the group's accounting info.",
          value: AccessControlScope.None,
          orderNumber: 4
        },
        delete: <AccessControlGroup>{
          groupName: 'Delete Groups',
          groupUnits: ['DELETE_GROUP'],
          description: 'Allow user to remove a group.',
          value: AccessControlScope.None,
          orderNumber: 5
        }
      }
    }
  },
  PRODUCT: {
    createSection: {
      sectionName: 'Product Lot',
      sectionAllowedValues: AccessControlsLimited,
      sectionGroup: {
        create: <AccessControlGroup>{
          groupName: 'Create',
          groupUnits: ['ADD_PRODUCTS'],
          description: 'Allow user to create new product lots, including splitting existing product lots.',
          value: AccessControlScope.None,
          orderNumber: 1
        }
      }
    },
    searchSection: {
      sectionName: ' ',
      sectionAllowedValues: AccessControlsLimitedOwner,
      sectionGroup: {
        read: <AccessControlGroup>{
          groupName: 'Read',
          groupUnits: ['SEARCH_PRODUCTS'],
          description: 'Allow search and read of inventory.',
          value: AccessControlScope.None,
          orderNumber: 1
        }
      }
    },
    updateSection: {
      sectionName: ' ',
      sectionAllowedValues: AccessControlsComplete,
      sectionGroup: {
        updateOwner: <AccessControlGroup>{
          groupName: 'Update Owner',
          groupUnits: ['UPDATE_PRODUCTS_OWNER'],
          description: 'Allow modifications of the product owner.',
          value: AccessControlScope.None,
          orderNumber: 2
        },
        updatePermission: <AccessControlGroup>{
          groupName: 'Update Permission',
          groupUnits: ['UPDATE_PRODUCTS_PERMISSION'],
          description: 'Allow modifications of the product permission.',
          value: AccessControlScope.None,
          orderNumber: 3
        },
        updateSalesNotes: <AccessControlGroup>{
          groupName: 'Update Sales Notes',
          groupUnits: ['UPDATE_PRODUCTS_SALES_NOTES'],
          description: 'Allow modifications of the product Sales Notes.',
          value: AccessControlScope.None,
          orderNumber: 4
        },
        updatePriceOfMerit: <AccessControlGroup>{
          groupName: 'Update Price of Merit',
          groupUnits: ['UPDATE_PRODUCTS_SALES_DATA_PRICE_OF_MERIT'],
          description: 'Allow modifications of the product Price of Merit.',
          value: AccessControlScope.None,
          orderNumber: 5
        },
        updateShipWeekEstimate: <AccessControlGroup>{
          groupName: 'Update Ship Week Estimate',
          groupUnits: ['UPDATE_PRODUCTS_SALES_DATA_SHIP_WEEK_ESTIMATE'],
          description: 'Allow modifications of the product ship week estimate',
          value: AccessControlScope.None,
          orderNumber: 6
        },
        updateLot: <AccessControlGroup>{
          groupName: 'Update Lot',
          groupUnits: ['UPDATE_PRODUCT_LOT'],
          description: 'Allow modifications of the product lot',
          value: AccessControlScope.None,
          orderNumber: 7
        },
        updateContract: <AccessControlGroup>{
          groupName: 'Update Contract',
          groupUnits: ['UPDATE_PRODUCT_CONTRACT'],
          description: 'Allow modifications of the product contract',
          value: AccessControlScope.None,
          orderNumber: 8
        },
        updateSpecLengthUnit: <AccessControlGroup>{
          groupName: 'Update Spec',
          groupUnits: ['UPDATE_PRODUCT_SPEC_LENGTH_UNITS'],
          description: 'Allow modifications of random length product spec',
          value: AccessControlScope.None,
          orderNumber: 9
        }
      }
    }
  },
  TRANSACTION: {
    transactionSection: {
      sectionName: 'Transactions',
      sectionAllowedValues: AccessControlsComplete,
      sectionGroup: {
        readList: <AccessControlGroup>{
          groupName: 'Read List',
          groupUnits: [
            'SEARCH_TRANSACTIONS',
            'GET_TRANSACTION_COST_DATA',
            'GET_TRANSACTION_TALLY',
            'GET_TRANSACTION_TRANSACTIONAL_JOURNAL',
            'GET_TRANSACTION_TRACKING_DATA',
            'LIST_TRANSACTION_MILESTONES',
            'GET_TRANSACTION_TRACKING_DATA_PRIVATE_DATA'
          ],
          description: 'Allows query of the companies transactions both buy and sell.',
          value: AccessControlScope.None,
          orderNumber: 1
        },
        create: <AccessControlGroup>{
          groupName: 'Create',
          groupUnits: ['ADD_TRANSACTION'],
          description: 'Create a new transaction and associate it with an order',
          value: AccessControlScope.None,
          orderNumber: 2
        },
        delete: <AccessControlGroup>{
          groupName: 'Delete',
          groupUnits: ['DELETE_TRANSACTION'],
          description:
            'Delete the transaction. this removes the transaction entirely from existence. Only allowed in the draft and initial states.',
          value: AccessControlScope.None,
          orderNumber: 3
        },
        updateCostData: <AccessControlGroup>{
          groupName: 'Update Cost Data',
          groupUnits: [
            'UPDATE_TRANSACTION_COST_DATA',
            'UPDATE_TRANSACTION_COST_DATA_COGS',
            'ADD_TRANSACTION_COST_DATA_COGS',
            'ADD_TRANSACTION_COST_DATA_COGP',
            'UPDATE_TRANSACTION_COST_DATA_COGP'
          ],
          description: 'Edit transaction pricing data',
          value: AccessControlScope.None,
          orderNumber: 4
        },
        updateState: <AccessControlGroup>{
          groupName: 'Update State',
          groupUnits: ['UPDATE_TRANSACTION_STATE'],
          description: 'Change state of a transaction.',
          value: AccessControlScope.None,
          orderNumber: 5
        },
        updateStateReview: <AccessControlGroup>{
          groupName: 'Update State Review',
          groupUnits: ['UPDATE_TRANSACTION_STATE_REVIEW'],
          description: 'Allow to initiate state transition out of the REVIEW state',
          value: AccessControlScope.None,
          orderNumber: 6
        },
        updateTally: <AccessControlGroup>{
          groupName: 'Update Tally',
          groupUnits: ['UPDATE_TRANSACTION_TALLY', 'ADD_TRANSACTION_TALLY_UNIT', 'UPDATE_TRANSACTION_TALLY_UNIT'],
          description: 'Edit the contents of the tally',
          value: AccessControlScope.None,
          orderNumber: 7
        },
        deleteTally: <AccessControlGroup>{
          groupName: 'Delete Tally',
          groupUnits: ['DELETE_TRANSACTION_TALLY_UNIT'],
          description: 'Remove items from the tally',
          value: AccessControlScope.None,
          orderNumber: 8
        },
        updateTrackingData: <AccessControlGroup>{
          groupName: 'Update Tracking Data',
          groupUnits: [
            'UPDATE_TRANSACTION_TRACKING_DATA',
            'UPDATE_TRANSACTION_TRACKING_DATA_BUYER_DATA_ONLINE_DATA',
            'UPDATE_TRANSACTION_TRACKING_DATA_BUYER_DATA_CRM_DATA',
            'UPDATE_TRANSACTION_TRACKING_DATA_TRANSPORT_METHOD',
            'UPDATE_TRANSACTION_TRACKING_DATA_SELLER_DATA_ONLINE_DATA',
            'UPDATE_TRANSACTION_TRACKING_DATA_SELLER_DATA_CRM_DATA'
          ],
          description: 'Allow the user to modify the ship from and ship to information as well as information about',
          value: AccessControlScope.None,
          orderNumber: 9
        },
        updateMilestones: <AccessControlGroup>{
          groupName: 'Update Milestones',
          groupUnits: ['ADD_TRANSACTION_MILESTONE'],
          description: 'Allows the user to create milestones for the transaction',
          value: AccessControlScope.None,
          orderNumber: 10
        },
        updatePrivateData: <AccessControlGroup>{
          groupName: 'Update Private Data',
          groupUnits: ['UPDATE_TRANSACTION_TRACKING_DATA_PRIVATE_DATA'],
          description: 'Allows the user to update the notes section',
          value: AccessControlScope.None,
          orderNumber: 11
        },
        updateJournal: <AccessControlGroup>{
          groupName: 'Update Journal',
          groupUnits: ['ADD_TRANSACTION_TRANSACTIONAL_JOURNAL'],
          description: 'Allows user to post ot the journal of the transaction',
          value: AccessControlScope.None,
          orderNumber: 12
        }
      }
    }
  },
  CRM_ACCOUNT: {
    createCRMSection: {
      sectionName: 'CRM',
      sectionAllowedValues: AccessControlsLimited,
      sectionGroup: {
        createEntry: <AccessControlGroup>{
          groupName: 'Create Entry',
          groupUnits: ['ADD_CRM_ACCOUNT', 'ADD_CRM_ACCOUNT_CONTACT', 'ADD_CRM_ACCOUNT_LOCATION'],
          description: 'Allow user to create new CRM entities including CRM Account, CRM Contact and CRM Location',
          value: AccessControlScope.None,
          orderNumber: 1
        }
      }
    },
    CRMSection: {
      sectionName: ' ',
      sectionAllowedValues: AccessControlsComplete,
      sectionGroup: {
        readEntry: <AccessControlGroup>{
          groupName: 'Read Entry',
          groupUnits: ['LIST_CRM_ACCOUNTS', 'LIST_CRM_CONTACTS', 'LIST_CRM_LOCATIONS'],
          description: 'Allow user to read basic data from CRM entries excluding sub-documents',
          value: AccessControlScope.None,
          orderNumber: 1
        },
        readSalesInfo: <AccessControlGroup>{
          groupName: 'Read Sales Info',
          groupUnits: [
            'GET_CRM_ACCOUNT_SALES_INFO',
            'GET_CRM_ACCOUNT_CONTACT_SALES_INFO',
            'GET_CRM_ACCOUNT_LOCATION_SALES_INFO'
          ],
          description: 'Allow user to read the Sales Info sections of the CRM.',
          value: AccessControlScope.None,
          orderNumber: 2
        },
        readCreditInfo: <AccessControlGroup>{
          groupName: 'Read Credit Info',
          groupUnits: ['GET_CRM_ACCOUNT_CREDIT_INFO'],
          description: 'Allow user to read the Credit Info sections of the CRM.',
          value: AccessControlScope.None,
          orderNumber: 3
        },
        readPaymentInfo: <AccessControlGroup>{
          groupName: 'Read Payment Info',
          groupUnits: ['GET_CRM_ACCOUNT_PAYMENT_INFO'],
          description: 'Allow user to read the Payment Info sections of the CRM.',
          value: AccessControlScope.None,
          orderNumber: 4
        },
        updateEntry: <AccessControlGroup>{
          groupName: 'Update Entry',
          groupUnits: [
            'UPDATE_CRM_ACCOUNT',
            'UPDATE_CRM_ACCOUNT_CONTACT',
            'UPDATE_CRM_ACCOUNT_LOCATION',
            'UPDATE_CRM_ACCOUNT_LABELS',
            'UPDATE_CRM_ACCOUNT_CONTACT_LABELS',
            'UPDATE_CRM_ACCOUNT_LOCATION_LABELS'
          ],
          description: 'Allow user to update basic data from CRM entries excluding sub-documents',
          value: AccessControlScope.None,
          orderNumber: 5
        },
        updateSalesInfo: <AccessControlGroup>{
          groupName: 'Update Sales Info',
          groupUnits: [
            'UPDATE_CRM_ACCOUNT_SALES_INFO',
            'UPDATE_CRM_ACCOUNT_CONTACT_SALES_INFO',
            'UPDATE_CRM_ACCOUNT_LOCATION_SALES_INFO'
          ],
          description: 'Allow user to update the Sales Info sections of the CRM. (Account, Contact or Location)',
          value: AccessControlScope.None,
          orderNumber: 6
        },
        updateCreditInfo: <AccessControlGroup>{
          groupName: 'Update Credit Info',
          groupUnits: ['UPDATE_CRM_ACCOUNT_CREDIT_INFO'],
          description: 'Allow user to update the Credit Info sections of the CRM. (Account)',
          value: AccessControlScope.None,
          orderNumber: 7
        },
        updatePaymentInfo: <AccessControlGroup>{
          groupName: 'Update Payment Info',
          groupUnits: ['UPDATE_CRM_ACCOUNT_PAYMENT_INFO'],
          description: 'Allow user to update the Payment Info sections of the CRM. (Account)',
          value: AccessControlScope.None,
          orderNumber: 8
        }
      }
    }
  },
  ACCOUNT: {
    accountSection: {
      sectionName: 'Account',
      sectionAllowedValues: AccessControlsLimited,
      sectionGroup: {
        read: <AccessControlGroup>{
          groupName: 'Read',
          groupUnits: ['LIST_ACCOUNTS', 'GET_ACCOUNT'],
          description: 'Get information about Accounts.',
          value: AccessControlScope.None,
          orderNumber: 1
        },
        create: <AccessControlGroup>{
          groupName: 'Create',
          groupUnits: ['ADD_ACCOUNT'],
          description: 'Allows this user to create new account on behalf of their company.',
          value: AccessControlScope.None,
          orderNumber: 2
        },
        update: <AccessControlGroup>{
          groupName: 'Update',
          groupUnits: ['UPDATE_ACCOUNT'],
          description: 'Allows this user to modify existing accounts on behalf of their company',
          value: AccessControlScope.None,
          orderNumber: 3
        },
        delete: <AccessControlGroup>{
          groupName: 'Delete',
          groupUnits: ['DELETE_ACCOUNT'],
          description: 'Allows this user to remove company accounts.',
          value: AccessControlScope.None,
          orderNumber: 4
        }
      }
    }
  },
  DIMENSION: {
    dimensionSection: {
      sectionName: 'Dimension',
      sectionAllowedValues: AccessControlsLimited,
      sectionGroup: {
        read: <AccessControlGroup>{
          groupName: 'Read',
          groupUnits: ['LIST_DIMENSIONS'],
          description: 'Get information about Dimensions.',
          value: AccessControlScope.None,
          orderNumber: 1
        },
        create: <AccessControlGroup>{
          groupName: 'Create',
          groupUnits: ['ADD_DIMENSION'],
          description: 'Allows this user to create new dimensions on behalf of their company.',
          value: AccessControlScope.None,
          orderNumber: 2
        },
        update: <AccessControlGroup>{
          groupName: 'Update',
          groupUnits: ['UPDATE_DIMENSION'],
          description: 'Allows this user to modify existing dimensions on behalf of their company',
          value: AccessControlScope.None,
          orderNumber: 3
        },
        delete: <AccessControlGroup>{
          groupName: 'Delete',
          groupUnits: ['DELETE_DIMENSION'],
          description: 'Allows this user to remove company dimensions.',
          value: AccessControlScope.None,
          orderNumber: 4
        }
      }
    }
  },
  JOURNAL_ENTRY: {
    journalEntrySection: {
      sectionName: 'Journal Entry',
      sectionAllowedValues: AccessControlsLimited,
      sectionGroup: {
        read: <AccessControlGroup>{
          groupName: 'Read',
          groupUnits: ['GET_JOURNAL_ENTRY', 'SEARCH_JOURNAL_ENTRIES'],
          description: 'Get information about Journal Entries.',
          value: AccessControlScope.None,
          orderNumber: 1
        },
        create: <AccessControlGroup>{
          groupName: 'Create',
          groupUnits: ['ADD_JOURNAL_ENTRY'],
          description: 'Allows this user to create new journal entry on behalf of their company.',
          value: AccessControlScope.None,
          orderNumber: 2
        },
        update: <AccessControlGroup>{
          groupName: 'Update',
          groupUnits: ['UPDATE_JOURNAL_ENTRY', 'UPDATE_JOURNAL_ENTRY_STATE'],
          description: 'Allows this user to modify existing journal entry on behalf of their company',
          value: AccessControlScope.None,
          orderNumber: 3
        },
        delete: <AccessControlGroup>{
          groupName: 'Delete',
          groupUnits: ['DELETE_JOURNAL_ENTRY'],
          description: 'Allows this user to remove company journal entries.',
          value: AccessControlScope.None,
          orderNumber: 4
        }
      }
    }
  },
  INVOICE: {
    readInvoiceSection: {
      sectionName: 'Invoice',
      sectionAllowedValues: AccessControlsLimited,
      sectionGroup: {
        read: <AccessControlGroup>{
          groupName: 'Read',
          groupUnits: ['LIST_INVOICES', 'GET_INVOICE', 'GET_INVOICE_LINE_ITEM', 'GET_INVOICE_PAYMENT'],
          description: 'Get information about Sales Orders Invoices',
          value: AccessControlScope.None,
          orderNumber: 1
        }
      }
    },
    invoiceSection: {
      sectionName: '',
      sectionAllowedValues: AccessControlsLimited,
      sectionGroup: {
        create: <AccessControlGroup>{
          groupName: 'Create Invoice',
          groupUnits: ['ADD_INVOICE'],
          description: 'Allows this user to create new sales order invoices on behalf of their company',
          value: AccessControlScope.None,
          orderNumber: 1
        },
        update: <AccessControlGroup>{
          groupName: 'Update Invoice',
          groupUnits: ['UPDATE_INVOICE'],
          description: 'Allows this user to modify existing sales order invoices on behalf of their company',
          value: AccessControlScope.None,
          orderNumber: 2
        },
        review: <AccessControlGroup>{
          groupName: 'Review Invoice',
          groupUnits: ['UPDATE_INVOICE_STATE_REVIEW'],
          description:
            'Allows this user to modify existing sales order invoices review state on behalf of their company',
          value: AccessControlScope.None,
          orderNumber: 3
        },
        delete: <AccessControlGroup>{
          groupName: 'Delete Invoice',
          groupUnits: ['DELETE_INVOICE'],
          description: 'Allows this user to remove company sales orders invoices',
          value: AccessControlScope.None,
          orderNumber: 4
        }
      }
    },
    invoiceLineItemSection: {
      sectionName: '',
      sectionAllowedValues: AccessControlsLimited,
      sectionGroup: {
        create: <AccessControlGroup>{
          groupName: 'Create Invoice Line Item',
          groupUnits: ['ADD_INVOICE_LINE_ITEM'],
          description: 'Allows this user to create new sales order invoice line items on behalf of their company',
          value: AccessControlScope.None,
          orderNumber: 1
        },
        update: <AccessControlGroup>{
          groupName: 'Update Invoice Line Item',
          groupUnits: ['UPDATE_INVOICE_LINE_ITEM'],
          description: 'Allows this user to modify existing sales order invoice line items on behalf of their company',
          value: AccessControlScope.None,
          orderNumber: 2
        },
        delete: <AccessControlGroup>{
          groupName: 'Delete Invoice Line Item',
          groupUnits: ['DELETE_INVOICE_LINE_ITEM'],
          description: 'Allows this user to remove company sales orders invoice line items',
          value: AccessControlScope.None,
          orderNumber: 3
        }
      }
    },
    invoicePaymentSection: {
      sectionName: '',
      sectionAllowedValues: AccessControlsLimited,
      sectionGroup: {
        create: <AccessControlGroup>{
          groupName: 'Create Invoice Payment',
          groupUnits: ['ADD_INVOICE_PAYMENT'],
          description: 'Allows this user to create new sales order invoice payments on behalf of their company',
          value: AccessControlScope.None,
          orderNumber: 1
        },
        update: <AccessControlGroup>{
          groupName: 'Update Invoice Payment',
          groupUnits: ['UPDATE_INVOICE_PAYMENT'],
          description: 'Allows this user to modify existing sales order invoice payments on behalf of their company',
          value: AccessControlScope.None,
          orderNumber: 2
        },
        delete: <AccessControlGroup>{
          groupName: 'Delete Invoice Payment',
          groupUnits: ['DELETE_INVOICE_PAYMENT'],
          description: 'Allows this user to remove company sales orders invoice payments',
          value: AccessControlScope.None,
          orderNumber: 3
        }
      }
    }
  },
  SALES_ORDER: {
    readSalesOrderSection: {
      sectionName: 'Sales Order',
      sectionAllowedValues: AccessControlsLimited,
      sectionGroup: {
        read: <AccessControlGroup>{
          groupName: 'Read',
          groupUnits: ['LIST_SALES_ORDERS', 'GET_SALES_ORDER', 'GET_SALES_ORDER_OPEN_LINE_ITEM'],
          description: 'Get information about Sales Orders',
          value: AccessControlScope.None,
          orderNumber: 1
        }
      }
    },
    salesOrderSection: {
      sectionName: '',
      sectionAllowedValues: AccessControlsLimited,
      sectionGroup: {
        create: <AccessControlGroup>{
          groupName: 'Create Sales Order',
          groupUnits: ['ADD_SALES_ORDER'],
          description: 'Allows this user to create new sales orders on behalf of their company',
          value: AccessControlScope.None,
          orderNumber: 1
        },
        update: <AccessControlGroup>{
          groupName: 'Update Sales Order',
          groupUnits: ['UPDATE_SALES_ORDER'],
          description: 'Allows this user to modify existing sales orders on behalf of their company',
          value: AccessControlScope.None,
          orderNumber: 2
        },
        close: <AccessControlGroup>{
          groupName: 'Close Sales Order',
          groupUnits: ['CLOSE_SALES_ORDER'],
          description: 'Allows this user to close existing sales orders on behalf of their company',
          value: AccessControlScope.None,
          orderNumber: 3
        },
        delete: <AccessControlGroup>{
          groupName: 'Delete Sales Order',
          groupUnits: ['DELETE_SALES_ORDER'],
          description: 'Allows this user to remove company sales orders',
          value: AccessControlScope.None,
          orderNumber: 4
        }
      }
    },
    salesOrderLineItemSection: {
      sectionName: '',
      sectionAllowedValues: AccessControlsLimited,
      sectionGroup: {
        create: <AccessControlGroup>{
          groupName: 'Create Sales Order Open Line Item',
          groupUnits: ['ADD_SALES_ORDER_OPEN_LINE_ITEM'],
          description: 'Allows this user to create new sales order open line items on behalf of their company',
          value: AccessControlScope.None,
          orderNumber: 1
        },
        update: <AccessControlGroup>{
          groupName: 'Update Sales Order Open Line Item',
          groupUnits: ['UPDATE_SALES_ORDER_OPEN_LINE_ITEM'],
          description: 'Allows this user to modify existing sales order open line items on behalf of their company',
          value: AccessControlScope.None,
          orderNumber: 2
        },
        delete: <AccessControlGroup>{
          groupName: 'Delete Sales Order Open Line Item',
          groupUnits: ['DELETE_SALES_ORDER_OPEN_LINE_ITEM'],
          description: 'Allows this user to remove company sales orders open line items',
          value: AccessControlScope.None,
          orderNumber: 3
        }
      }
    }
  },
  BILL: {
    readBillSection: {
      sectionName: 'Vendor Invoice',
      sectionAllowedValues: AccessControlsLimited,
      sectionGroup: {
        read: <AccessControlGroup>{
          groupName: 'Read',
          groupUnits: ['LIST_BILLS', 'GET_BILL', 'GET_BILL_LINE_ITEM', 'GET_BILL_PAYMENT'],
          description: 'Get information about Purchase Orders Vendor Invoices',
          value: AccessControlScope.None,
          orderNumber: 1
        }
      }
    },
    billSection: {
      sectionName: '',
      sectionAllowedValues: AccessControlsLimited,
      sectionGroup: {
        create: <AccessControlGroup>{
          groupName: 'Create Vendor Invoice',
          groupUnits: ['ADD_BILL'],
          description: 'Allows this user to create new purchase order vendor invoices on behalf of their company',
          value: AccessControlScope.None,
          orderNumber: 1
        },
        update: <AccessControlGroup>{
          groupName: 'Update Vendor Invoice',
          groupUnits: ['UPDATE_BILL', 'UPDATE_BILL_STATE_REVIEW'],
          description: 'Allows this user to modify existing purchase order vendor invoices on behalf of their company',
          value: AccessControlScope.None,
          orderNumber: 2
        },
        delete: <AccessControlGroup>{
          groupName: 'Delete Vendor Invoice',
          groupUnits: ['DELETE_BILL'],
          description: 'Allows this user to remove company purchase orders vendor invoices',
          value: AccessControlScope.None,
          orderNumber: 4
        }
      }
    },
    billLineItemSection: {
      sectionName: '',
      sectionAllowedValues: AccessControlsLimited,
      sectionGroup: {
        create: <AccessControlGroup>{
          groupName: 'Create Vendor Invoice Line Item',
          groupUnits: ['ADD_BILL_LINE_ITEM'],
          description:
            'Allows this user to create new purchase order vendor invoice line items on behalf of their company',
          value: AccessControlScope.None,
          orderNumber: 1
        },
        update: <AccessControlGroup>{
          groupName: 'Update Vendor Invoice Line Item',
          groupUnits: ['UPDATE_BILL_LINE_ITEM'],
          description:
            'Allows this user to modify existing purchase order vendor invoice line items on behalf of their company',
          value: AccessControlScope.None,
          orderNumber: 2
        },
        delete: <AccessControlGroup>{
          groupName: 'Delete Vendor Invoice Line Item',
          groupUnits: ['DELETE_BILL_LINE_ITEM'],
          description: 'Allows this user to remove company purchase orders vendor invoice line items',
          value: AccessControlScope.None,
          orderNumber: 3
        }
      }
    },
    billPaymentSection: {
      sectionName: '',
      sectionAllowedValues: AccessControlsLimited,
      sectionGroup: {
        create: <AccessControlGroup>{
          groupName: 'Create Vendor Invoice Payment',
          groupUnits: ['ADD_BILL_PAYMENT'],
          description:
            'Allows this user to create new purchase order vendor invoice payments on behalf of their company',
          value: AccessControlScope.None,
          orderNumber: 1
        },
        update: <AccessControlGroup>{
          groupName: 'Update Vendor Invoice Payment',
          groupUnits: ['UPDATE_BILL_PAYMENT'],
          description:
            'Allows this user to modify existing purchase order vendor invoice payments on behalf of their company',
          value: AccessControlScope.None,
          orderNumber: 2
        },
        delete: <AccessControlGroup>{
          groupName: 'Delete Vendor Invoice Payment',
          groupUnits: ['DELETE_BILL_PAYMENT'],
          description: 'Allows this user to remove company purchase orders vendor invoice payments',
          value: AccessControlScope.None,
          orderNumber: 3
        }
      }
    }
  },
  PURCHASE_ORDER: {
    readPurchaseOrderSection: {
      sectionName: 'Purchase Order',
      sectionAllowedValues: AccessControlsLimited,
      sectionGroup: {
        read: <AccessControlGroup>{
          groupName: 'Read',
          groupUnits: ['LIST_PURCHASE_ORDERS', 'GET_PURCHASE_ORDER', 'GET_PURCHASE_ORDER_OPEN_LINE_ITEM'],
          description: 'Get information about Purchase Orders',
          value: AccessControlScope.None,
          orderNumber: 1
        }
      }
    },
    purchaseOrderSection: {
      sectionName: '',
      sectionAllowedValues: AccessControlsLimited,
      sectionGroup: {
        create: <AccessControlGroup>{
          groupName: 'Create Purchase Order',
          groupUnits: ['ADD_PURCHASE_ORDER'],
          description: 'Allows this user to create new purchase orders on behalf of their company',
          value: AccessControlScope.None,
          orderNumber: 1
        },
        update: <AccessControlGroup>{
          groupName: 'Update Purchase Order',
          groupUnits: ['UPDATE_PURCHASE_ORDER'],
          description: 'Allows this user to modify existing purchase orders on behalf of their company',
          value: AccessControlScope.None,
          orderNumber: 2
        },
        close: <AccessControlGroup>{
          groupName: 'Close Purchase Order',
          groupUnits: ['CLOSE_PURCHASE_ORDER'],
          description: 'Allows this user to close existing purchase orders on behalf of their company',
          value: AccessControlScope.None,
          orderNumber: 3
        },
        delete: <AccessControlGroup>{
          groupName: 'Delete Purchase Order',
          groupUnits: ['DELETE_PURCHASE_ORDER'],
          description: 'Allows this user to remove company purchase orders',
          value: AccessControlScope.None,
          orderNumber: 4
        }
      }
    },
    purchaseOrderLineItemSection: {
      sectionName: '',
      sectionAllowedValues: AccessControlsLimited,
      sectionGroup: {
        create: <AccessControlGroup>{
          groupName: 'Create Purchase Order Open Line Item',
          groupUnits: ['ADD_PURCHASE_ORDER_OPEN_LINE_ITEM'],
          description: 'Allows this user to create new purchase order open line items on behalf of their company',
          value: AccessControlScope.None,
          orderNumber: 1
        },
        update: <AccessControlGroup>{
          groupName: 'Update Purchase Order Open Line Item',
          groupUnits: ['UPDATE_PURCHASE_ORDER_OPEN_LINE_ITEM'],
          description: 'Allows this user to modify existing purchase order open line items on behalf of their company',
          value: AccessControlScope.None,
          orderNumber: 2
        },
        delete: <AccessControlGroup>{
          groupName: 'Delete Purchase Order Open Line Item',
          groupUnits: ['DELETE_PURCHASE_ORDER_OPEN_LINE_ITEM'],
          description: 'Allows this user to remove company purchase orders open line items',
          value: AccessControlScope.None,
          orderNumber: 3
        }
      }
    }
  }
};
