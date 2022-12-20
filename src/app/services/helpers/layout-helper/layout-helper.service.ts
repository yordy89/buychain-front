import { Injectable } from '@angular/core';
import { Environment } from '@app/services/app-layer/app-layer.environment';
import { AccessControlProfile } from '@services/app-layer/permission/permission.interface';

export enum SideBarNavigationViewMode {
  Hidden = 'hidden',
  Icon = 'icon',
  Full = 'full'
}

export class MenuTabItem {
  label: string;
  route: string;
}

export class MenuChildItem {
  name: string;
  mainRoute?: string;
  tabs?: MenuTabItem[];
  defaultRoute: string;
  disabled: boolean;

  constructor(item = {}) {
    Object.assign(this, item);

    this.defaultRoute = this.getDefaultRoute();
  }

  private getDefaultRoute() {
    if (this.mainRoute) {
      return this.mainRoute;
    }
    return this.tabs?.length ? this.tabs[0].route : '';
  }
}

export class MenuItem {
  active?: boolean; // If false then item is not clickable
  name?: string; // Used as display text for item and title for separator type
  state?: Layout; // Router state
  icon?: string; // Item icon name
  tooltip?: string; // Tooltip text
  disabled?: boolean; // If true, item will not be appeared in sidenav.
  children?: MenuChildItem[]; // Dropdown items or child routes
  useState?: boolean;
  defaultRoute: string;

  constructor(obj = {}) {
    Object.assign(this, obj);

    this.children = (this.children || []).filter(item => !item.disabled).map(item => new MenuChildItem(item));
    this.defaultRoute = this.getDefaultRoute();
  }

  private getDefaultRoute() {
    if (this.useState || !this.children?.length) {
      return this.state;
    }
    return this.children[0].defaultRoute;
  }
}

export enum Layout {
  Auth = 'auth',
  Profile = 'profile',
  Dashboard = 'dashboard',
  Market = 'market',
  Inventory = 'inventory',
  Order = 'order',
  Company = 'company',
  Settings = 'settings',
  CRM = 'crm',
  Reporting = 'reporting',
  Accounting = 'accounting',
  Main = 'main',
  Home = 'home'
}

@Injectable({ providedIn: 'root' })
export class LayoutHelperService {
  getMenuItem(): MenuItem[] {
    const companyFeatures = Environment.getCompanyFeatures();
    const isMarketDisabled = Environment.isOnlyOffline();
    const currentUser = Environment.getCurrentUser();
    const showPriceData = currentUser.permissions.priceData;
    const isTrader = Environment.getCurrentUser().accessControlProfile === AccessControlProfile.Trader;
    const isAdvancedReportingDisabled = !companyFeatures.advancedReporting || !showPriceData;
    const isAccountingDisabled = !companyFeatures.accounting;

    return [
      {
        name: 'Dashboard',
        tooltip: 'Dashboard',
        icon: 'home',
        state: Layout.Dashboard,
        useState: true,
        children: [
          {
            name: 'Managers',
            mainRoute: 'dashboard/managers',
            disabled: !showPriceData || isTrader
          },
          {
            name: 'Traders',
            mainRoute: 'dashboard/traders',
            disabled: !showPriceData
          }
        ]
      },
      {
        name: 'CRM',
        tooltip: 'CRM',
        icon: 'supervisor_account',
        state: Layout.CRM
      },
      {
        name: 'Inventory',
        tooltip: 'Inventory',
        icon: 'apps',
        state: Layout.Inventory
      },
      {
        name: 'Orders',
        tooltip: 'Order',
        icon: 'shopping_cart',
        state: Layout.Order
      },
      {
        name: 'Market',
        tooltip: 'Market',
        icon: 'blur_on',
        state: Layout.Market,
        disabled: isMarketDisabled
      },
      {
        name: 'Company',
        tooltip: 'Company',
        icon: 'domain',
        state: Layout.Company
      },
      {
        name: 'Reporting',
        tooltip: 'Reporting',
        icon: 'trending_up',
        state: Layout.Reporting,
        disabled: isAdvancedReportingDisabled,
        useState: true,
        children: [
          {
            name: 'Sales Performance',
            mainRoute: 'reporting/sales-performance'
          },
          {
            name: 'Inventory Performance',
            mainRoute: 'reporting/inventory-performance'
          },
          {
            name: 'Inventory Audit',
            mainRoute: 'reporting/inventory-audit'
          }
        ]
      },
      {
        name: 'Accounting',
        tooltip: 'Accounting',
        icon: 'monetization_on',
        state: Layout.Accounting,
        disabled: isAccountingDisabled,
        children: [
          {
            name: 'Financial',
            tabs: [
              {
                label: 'Accounts',
                route: 'accounting/accounts'
              },
              {
                label: 'Dimensions',
                route: 'accounting/dimensions'
              },
              {
                label: 'Journal Entries',
                route: 'accounting/journal-entries'
              }
            ]
          },
          {
            name: 'AR',
            // when enabling AR section consider also visibility for INVOICE and SALES ORDER sections -> [access-control.component.html]
            disabled: !(Environment.isDevelopment || Environment.isDemo),
            tabs: [
              {
                label: 'Sales Orders',
                route: 'accounting/sales-orders'
              },
              {
                label: 'Invoices',
                route: 'accounting/invoices'
              },
              {
                label: 'Credit Memos',
                route: 'accounting/credit-memos'
              }
            ]
          },
          {
            name: 'AP',
            disabled: !(Environment.isDevelopment || Environment.isDemo),
            tabs: [
              {
                label: 'Purchase Orders',
                route: 'accounting/purchase-orders'
              },
              {
                label: 'Vendor Invoices',
                route: 'accounting/bills'
              }
            ]
          }
        ]
      }
    ]
      .filter(item => !item.disabled)
      .map(item => new MenuItem(item));
  }
}
