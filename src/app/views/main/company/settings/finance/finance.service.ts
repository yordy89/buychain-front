import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class FinanceService {
  get accountsKeyTypeList() {
    return [
      {
        key: 'accountsReceivable',
        type: 'AccountsReceivable',
        tooltip:
          'Accounts Receivable [Asset] - Default account used for AR module. Can be overridden on a per group basis.' +
          ' Sales Order/ Invoices issued by the system will have their receivable recognized in this account.'
      },
      {
        key: 'accountsPayable',
        type: 'AccountsPayable',
        tooltip:
          'Accounts Payable [Liability] - Default account used by the AP module. Can be overridden on a per group basis.' +
          ' Purchase Orders issued by the system will show the amount owed int his account.'
      },
      {
        key: 'inventoryOnHand',
        type: 'InventoryOnHand',
        tooltip:
          'Inventory On Hand [Asset] - Default account for tracking the value of inventory that is "on-hand".' +
          ' On-hand inventory is product that is physically located at a company owned or controlled facility.'
      },
      {
        key: 'inventoryInTransit',
        type: 'InventoryInTransit',
        tooltip:
          'Inventory In-Transit [Asset] - Default account for tracking the value of inventory that is actively being' +
          ' transported on behalf of the company. Includes only inventory that is owned by the company (i.e. shipped FOB Origin)'
      },
      {
        key: 'inventoryOnOrder',
        type: 'InventoryOnOrder',
        tooltip:
          'Inventory On Order [Asset] - Default account for tracking the value of inventory' +
          ' that is on order from a supplier and has not yet shipped.'
      },
      {
        key: 'inventoryOnConsignment',
        type: 'InventoryOnConsignment',
        tooltip:
          'Inventory On Contract [Asset] - Default account for inventory that is on-hand,' +
          ' but is on a contract basis, meaning the company needs to exercise the contract in order ot take full possession.'
      },
      {
        key: 'inventoryRawMaterials',
        type: 'InventoryRawMaterials',
        tooltip: 'Inventory Raw Materials [Asset] - Default account for tracking raw material values.'
      },
      {
        key: 'cogsFees',
        type: 'COGSFees',
        tooltip: "COGS Fees [Expense] - Default account used to track fee's expenses."
      },
      {
        key: 'cogsShipping',
        type: 'COGSShipping',
        tooltip: 'COGS Shipping [Expense] - Default Account used to track shipping expense.'
      },
      {
        key: 'cogsOther',
        type: 'COGSOther',
        tooltip: 'COGS Other [Expense] - Default account used to track other cost of goods expenses related to sale.'
      },
      {
        key: 'retainedEarnings',
        type: 'RetainedEarnings',
        tooltip:
          'Retained Earnings [Equity] - Default account used for retained earnings on the balance sheet. Can be overridden on a per group basis.'
      },
      {
        key: 'revenue',
        type: 'Revenue',
        tooltip: 'Revenue [Revenue] - Default account to use for revenue. Can be overridden on a per group basis.'
      },
      {
        key: 'expense',
        type: 'Expense',
        tooltip: 'Expense [Expense] - Default account to use for expenses. Can be overridden on a per group basis.'
      },
      {
        key: 'taxExpense',
        type: 'TaxExpense',
        tooltip:
          'Tax Expense [Expense] - Default account to use for tax related expenses. Can be overridden on a per group basis.'
      }
    ];
  }
}
