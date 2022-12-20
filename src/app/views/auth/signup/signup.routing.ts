import { Routes } from '@angular/router';
import { SignupComponent } from '@views/auth/signup/signup.component';

export const signupRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        component: SignupComponent,
        data: { title: 'signup', breadcrumb: 'Sign Up' }
      }
    ]
  }
];
