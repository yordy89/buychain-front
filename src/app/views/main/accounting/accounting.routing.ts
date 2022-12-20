import { Routes } from '@angular/router';

export const accountingRoutes: Routes = [
  {
    path: '',
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'accounts' },
      {
        path: 'accounts',
        loadChildren: () => import('./financial/accounts/accounts.module').then(l => l.AccountsModule)
      },
      {
        path: 'dimensions',
        loadChildren: () => import('./financial/dimensions/dimensions.module').then(l => l.DimensionsModule)
      },
      {
        path: 'journal-entries',
        loadChildren: () =>
          import('./financial/journal-entries/journal-entries.module').then(l => l.JournalEntriesModule)
      },
      {
        path: 'sales-orders',
        loadChildren: () =>
          import('./accounts-receivable/sales-orders/sales-orders.module').then(l => l.SalesOrdersModule)
      },
      {
        path: 'invoices',
        loadChildren: () => import('./accounts-receivable/invoices/invoices.module').then(l => l.InvoicesModule)
      },
      {
        path: 'credit-memos',
        loadChildren: () =>
          import('./accounts-receivable/credit-memos/credit-memos.module').then(l => l.CreditMemosModule)
      },
      {
        path: 'purchase-orders',
        loadChildren: () =>
          import('./accounts-payable/purchase-orders/purchase-orders.module').then(l => l.PurchaseOrdersModule)
      },
      {
        path: 'bills',
        loadChildren: () => import('./accounts-payable/bills/bills.module').then(l => l.BillsModule)
      }
    ]
  }
];
