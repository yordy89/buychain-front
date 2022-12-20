import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { accountingRoutes } from '@views/main/accounting/accounting.routing';

@NgModule({
  imports: [RouterModule.forChild(accountingRoutes)],
  declarations: []
})
export class AccountingModule {}
