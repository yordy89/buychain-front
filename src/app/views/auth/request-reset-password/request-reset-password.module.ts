import { NgModule } from '@angular/core';
import { PipesModule } from '@pipes/pipes.module';
import { QuicklinkModule } from 'ngx-quicklink';
import { RequestResetPasswordComponent } from './request-reset-password.component';
import { ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { requestResetPasswordRoutes } from '@views/auth/request-reset-password/request-reset-password.routing';

@NgModule({
  imports: [
    ReactiveFormsModule,
    MatIconModule,
    CommonModule,
    RouterModule.forChild(requestResetPasswordRoutes),
    PipesModule,
    QuicklinkModule
  ],
  exports: [RequestResetPasswordComponent],
  declarations: [RequestResetPasswordComponent],
  providers: []
})
export class RequestResetPasswordModule {}
