import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { SalesOrderLineComponent } from '@views/main/accounting/accounts-receivable/sales-orders/sales-order-line/sales-order-line.component';
import { SalesOrderComponent } from '@views/main/accounting/accounts-receivable/sales-orders/sales-order/sales-order.component';
import { SalesOrdersComponent } from '@views/main/accounting/accounts-receivable/sales-orders/sales-orders.component';
import { InvoiceComponent } from '@views/main/accounting/accounts-receivable/invoices/invoice/invoice.component';
import { InvoiceLineComponent } from '@views/main/accounting/accounts-receivable/invoices/invoice-line/invoice-line.component';
import { InvoicePaymentComponent } from '@views/main/accounting/accounts-receivable/invoices/invoice-payment/invoice-payment.component';

const routes: Routes = [
  { path: '', component: SalesOrdersComponent },
  { path: 'add', component: SalesOrderComponent },
  {
    path: ':id',
    children: [
      {
        path: '',
        component: SalesOrderComponent
      },
      {
        path: 'line',
        children: [
          {
            path: 'add',
            component: SalesOrderLineComponent
          },
          {
            path: ':lineId',
            component: SalesOrderLineComponent
          }
        ]
      },
      {
        path: 'invoice',
        children: [
          {
            path: 'add',
            component: InvoiceComponent
          },
          {
            path: ':invoiceId',
            children: [
              {
                path: '',
                component: InvoiceComponent
              },
              {
                path: 'line',
                children: [
                  {
                    path: 'add',
                    component: InvoiceLineComponent
                  },
                  {
                    path: ':lineId',
                    component: InvoiceLineComponent
                  }
                ]
              },
              {
                path: 'payment',
                children: [
                  {
                    path: 'add',
                    component: InvoicePaymentComponent
                  },
                  {
                    path: ':paymentId',
                    component: InvoicePaymentComponent
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
export class SalesOrdersRoutingModule {}

export const routedComponents = [SalesOrdersComponent, SalesOrderComponent, SalesOrderLineComponent];
