import { Routes } from '@angular/router';
import { OrdersOverviewComponent } from '@views/main/order/orders-overview/orders-overview.component';
import { OrderDetailsComponent } from '@views/main/order/order-details/order-details.component';
import { NewOrderComponent } from '@views/main/order/order-details/new-order/new-order.component';

export const orderRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        redirectTo: 'overview',
        pathMatch: 'full'
      },
      {
        path: 'overview',
        component: OrdersOverviewComponent,
        data: { title: '...', breadcrumb: '' }
      },
      {
        path: 'new',
        component: NewOrderComponent
      },
      {
        path: ':orderId',
        component: OrderDetailsComponent
      },
      {
        path: 'transaction/:transactionId',
        component: OrderDetailsComponent
      }
    ]
  }
];
