import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BillsComponent } from '@views/main/accounting/accounts-payable/bills/bills.component';
import { BillComponent } from '@views/main/accounting/accounts-payable/bills/bill/bill.component';
import { BillLineComponent } from '@views/main/accounting/accounts-payable/bills/bill-line/bill-line.component';
import { BillPaymentComponent } from '@views/main/accounting/accounts-payable/bills/bill-payment/bill-payment.component';

const routes: Routes = [
  { path: '', component: BillsComponent },
  {
    path: ':id',
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
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BillsRoutingModule {}

export const routedComponents = [BillsComponent, BillComponent];
