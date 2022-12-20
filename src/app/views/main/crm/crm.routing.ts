import { Routes } from '@angular/router';
import { CrmComponent } from '@views/main/crm/crm/crm.component';

export const crmRoutes: Routes = [
  { path: '', component: CrmComponent },
  { path: ':id', component: CrmComponent }
];
