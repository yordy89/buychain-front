import { Routes } from '@angular/router';
import { MarketOverviewComponent } from '@views/main/market/market-overview/market-overview.component';

export const marketRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        redirectTo: 'marketSearch',
        pathMatch: 'full'
      },
      {
        path: 'marketSearch',
        component: MarketOverviewComponent,
        data: { title: '...', breadcrumb: '' }
      }
    ]
  }
];
