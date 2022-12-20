import { Routes } from '@angular/router';
import { InventoryOverviewComponent } from '@views/main/inventory/inventory-overview/inventory-overview.component';
import { ProductLotDetailsPageComponent } from '@views/main/inventory/inventory-overview/product-lot-details-page/product-lot-details-page.component';

export const inventoryRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        redirectTo: 'inventory-overview',
        pathMatch: 'full'
      },
      {
        path: 'inventory-overview',
        component: InventoryOverviewComponent,
        data: { title: '...', breadcrumb: '' }
      },
      {
        path: 'inventory-overview/:lotId',
        component: ProductLotDetailsPageComponent,
        data: { title: '...', breadcrumb: '' }
      }
    ]
  }
];
