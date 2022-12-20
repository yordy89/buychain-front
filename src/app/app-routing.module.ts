import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthGuard } from '@app/guards/auth.guard';
import { HomeResolverService } from '@app/resolvers/home-resolver.service';
import { MainResolverService } from '@app/resolvers/main-resolver.service';
import { mainRoutes } from '@views/main/main.routing';
import { QuicklinkStrategy } from 'ngx-quicklink';

import { AuthLayoutComponent } from './layouts/auth-layout/auth-layout.component';
import { HomeLayoutComponent } from './layouts/home-layout/home-layout.component';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';

const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [AuthGuard],
    resolve: { data: MainResolverService },
    children: mainRoutes
  },
  {
    path: 'home',
    component: HomeLayoutComponent,
    canActivate: [AuthGuard],
    resolve: { data: HomeResolverService },
    loadChildren: () => import('./views/home/home.module').then(m => m.HomeModule)
  },
  {
    path: 'auth',
    component: AuthLayoutComponent,
    loadChildren: () => import('./views/auth/auth.module').then(m => m.AuthModule)
  },
  // fallback compatibility with an old path
  {
    path: 'sessions',
    redirectTo: 'auth'
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      useHash: false,
      preloadingStrategy: QuicklinkStrategy,
      relativeLinkResolution: 'legacy'
    })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
