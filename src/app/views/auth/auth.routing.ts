import { Routes } from '@angular/router';
import { NoAuthGuard } from '@app/guards/no-auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'signin',
    pathMatch: 'full'
  },
  {
    path: 'signup',
    data: { title: 'Signup' },
    loadChildren: () => import('./signup/signup.module').then(l => l.SignupModule)
  },
  {
    path: 'request-reset-password',
    data: { title: 'Forgot Password' },
    loadChildren: () =>
      import('./request-reset-password/request-reset-password.module').then(l => l.RequestResetPasswordModule)
  },
  {
    path: 'request-confirmation-email',
    data: { title: 'Request Confirmation Email' },
    loadChildren: () =>
      import('./request-confirmation-email/request-confirmation-email.module').then(
        l => l.RequestConfirmationEmailModule
      )
  },
  {
    path: 'activation',
    data: { title: 'Activation' },
    loadChildren: () => import('./activation/activation.module').then(l => l.ActivationModule)
  },
  {
    path: 'signin',
    data: { title: 'Signin' },
    canActivate: [NoAuthGuard],
    loadChildren: () => import('./signin/signin.module').then(l => l.SigninModule)
  },
  {
    path: 'forgot-password',
    data: { title: 'Forgot password' },
    loadChildren: () => import('./forgot-password/forgot-password.module').then(l => l.ForgotPasswordModule)
  }
];
