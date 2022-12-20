import { NgModule } from '@angular/core';
import { PipesModule } from '@pipes/pipes.module';
import { QuicklinkModule } from 'ngx-quicklink';
import { SigninComponent } from './signin.component';
import { ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { signinRoutes } from '@views/auth/signin/singin.routing';

@NgModule({
  imports: [
    ReactiveFormsModule,
    MatIconModule,
    CommonModule,
    RouterModule.forChild(signinRoutes),
    PipesModule,
    QuicklinkModule
  ],
  exports: [SigninComponent],
  declarations: [SigninComponent],
  providers: []
})
export class SigninModule {}
