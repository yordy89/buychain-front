import { Routes } from '@angular/router';
import { DetailsComponent } from '@views/main/profile/details/details.component';

export const buyerRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'details',
        component: DetailsComponent,
        data: { title: 'Details', breadcrumb: 'DETAILS' }
      }
    ]
  }
];
