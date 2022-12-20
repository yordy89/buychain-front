import { Routes } from '@angular/router';
import { HomeComponent } from '@views/home/home/home.component';

export const homeRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        component: HomeComponent,
        data: { title: '...', breadcrumb: 'HOME' }
      }
    ]
  }
];
