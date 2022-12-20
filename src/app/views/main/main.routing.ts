import { Routes } from '@angular/router';

export const mainRoutes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    data: { title: 'Dashboard', breadcrumb: 'dashboard' },
    loadChildren: () => import('./dashboard/dashboard.module').then(l => l.DashboardModule)
  },
  {
    path: 'order',
    data: { title: 'Order', breadcrumb: 'order' },
    loadChildren: () => import('./order/order.module').then(l => l.OrderModule)
  },
  {
    path: 'market',
    data: { title: '...', breadcrumb: '' },
    loadChildren: () => import('./market/market.module').then(l => l.MarketModule)
  },
  {
    path: 'company',
    data: { title: '...', breadcrumb: '' },
    loadChildren: () => import('./company/company.module').then(l => l.CompanyModule)
  },
  {
    path: 'inventory',
    data: { title: '...', breadcrumb: '' },
    loadChildren: () => import('./inventory/inventory.module').then(l => l.InventoryModule)
  },
  {
    path: 'crm',
    data: { title: '...', breadcrumb: '' },
    loadChildren: () => import('./crm/crm.module').then(l => l.CrmModule)
  },
  {
    path: 'reporting',
    data: { title: '...', breadcrumb: '' },
    loadChildren: () => import('./reporting/reporting.module').then(l => l.ReportingModule)
  },
  {
    path: 'accounting',
    data: { title: '...', breadcrumb: '' },
    loadChildren: () => import('./accounting/accounting.module').then(l => l.AccountingModule)
  },
  {
    path: 'profile/:userId',
    data: { title: 'profile', breadcrumb: 'Profile' },
    loadChildren: () => import('./profile/profile.module').then(l => l.ProfileModule)
  }
];
