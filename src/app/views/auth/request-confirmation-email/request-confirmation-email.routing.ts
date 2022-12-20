import { Routes } from '@angular/router';
import { RequestConfirmationEmailComponent } from '@views/auth/request-confirmation-email/request-confirmation-email.component';

export const requestConfirmationEmailRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        component: RequestConfirmationEmailComponent,
        data: { title: 'requestConfirmationEmail', breadcrumb: 'Request Confirmation Email' }
      }
    ]
  }
];
