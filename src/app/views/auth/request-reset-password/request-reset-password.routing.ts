import { Routes } from '@angular/router';
import { RequestResetPasswordComponent } from '@views/auth/request-reset-password/request-reset-password.component';

export const requestResetPasswordRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        component: RequestResetPasswordComponent,
        data: { title: 'requestResetPassword', breadcrumb: 'Request Reset Password' }
      }
    ]
  }
];
