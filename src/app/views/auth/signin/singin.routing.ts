import { Routes } from '@angular/router';
import { SigninComponent } from '@views/auth/signin/signin.component';

export const signinRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        component: SigninComponent,
        data: { title: 'signin', breadcrumb: 'Sign In' }
      }
    ]
  }
];
