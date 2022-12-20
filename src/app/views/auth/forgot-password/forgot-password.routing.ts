import { Routes } from '@angular/router';
import { ForgotPasswordComponent } from '@views/auth/forgot-password/forgot-password.component';

export const forgotPasswordRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        component: ForgotPasswordComponent,
        data: { title: 'forgotPassword', breadcrumb: 'Forgot Password' }
      }
    ]
  }
];
