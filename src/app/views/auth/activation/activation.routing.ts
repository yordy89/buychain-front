import { Routes } from '@angular/router';
import { ActivationComponent } from '@views/auth/activation/activation.component';

export const activationRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        component: ActivationComponent,
        data: { title: 'activation', breadcrumb: 'Activation' }
      }
    ]
  }
];
