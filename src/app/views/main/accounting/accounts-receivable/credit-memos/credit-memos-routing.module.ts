import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CreditMemosComponent } from '@views/main/accounting/accounts-receivable/credit-memos/credit-memos.component';
import { CreditMemoComponent } from './credit-memo/credit-memo.component';

const routes: Routes = [
  { path: '', component: CreditMemosComponent },
  { path: 'add', component: CreditMemoComponent },
  { path: 'apply', component: CreditMemoComponent },
  { path: ':id', component: CreditMemoComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CreditMemosRoutingModule {}

export const routedComponents = [CreditMemosComponent];
