import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { InvoicesComponent } from '@views/main/accounting/accounts-receivable/invoices/invoices.component';
import { InvoiceComponent } from '@views/main/accounting/accounts-receivable/invoices/invoice/invoice.component';
import { InvoiceLineComponent } from '@views/main/accounting/accounts-receivable/invoices/invoice-line/invoice-line.component';
import { InvoicePaymentComponent } from '@views/main/accounting/accounts-receivable/invoices/invoice-payment/invoice-payment.component';

const routes: Routes = [
  { path: '', component: InvoicesComponent },
  {
    path: ':id',
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
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class InvoicesRoutingModule {}

export const routedComponents = [InvoicesComponent];
