import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PurchaseOrdersComponent } from '@views/main/accounting/accounts-payable/purchase-orders/purchase-orders.component';
import { PurchaseOrderComponent } from '@views/main/accounting/accounts-payable/purchase-orders/purchase-order/purchase-order.component';
import { PurchaseOrderLineComponent } from '@views/main/accounting/accounts-payable/purchase-orders/purchase-order-line/purchase-order-line.component';
import { BillComponent } from '@views/main/accounting/accounts-payable/bills/bill/bill.component';
import { BillLineComponent } from '@views/main/accounting/accounts-payable/bills/bill-line/bill-line.component';
import { BillPaymentComponent } from '@views/main/accounting/accounts-payable/bills/bill-payment/bill-payment.component';

const routes: Routes = [
  { path: '', component: PurchaseOrdersComponent },
  { path: 'add', component: PurchaseOrderComponent },
  {
    path: ':id',
    children: [
      {
        path: '',
        component: PurchaseOrderComponent
      },
      {
        path: 'line',
        children: [
          {
            path: 'add',
            component: PurchaseOrderLineComponent
          },
          {
            path: ':lineId',
            component: PurchaseOrderLineComponent
          }
        ]
      },
      {
        path: 'bill',
        children: [
          {
            path: 'add',
            component: BillComponent
          },
          {
            path: ':billId',
            children: [
              {
                path: '',
                component: BillComponent
              },
              {
                path: 'line',
                children: [
                  {
                    path: 'add',
                    component: BillLineComponent
                  },
                  {
                    path: ':lineId',
                    component: BillLineComponent
                  }
                ]
              },
              {
                path: 'payment',
                children: [
                  {
                    path: 'add',
                    component: BillPaymentComponent
                  },
                  {
                    path: ':paymentId',
                    component: BillPaymentComponent
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PurchaseOrdersRoutingModule {}

export const routedComponents = [PurchaseOrdersComponent, PurchaseOrderComponent];
