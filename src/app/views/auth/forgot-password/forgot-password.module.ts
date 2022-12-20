import { NgModule } from '@angular/core';
import { PipesModule } from '@pipes/pipes.module';
import { ForgotPasswordComponent } from './forgot-password.component';
import { ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { forgotPasswordRoutes } from '@views/auth/forgot-password/forgot-password.routing';

@NgModule({
  imports: [ReactiveFormsModule, MatIconModule, CommonModule, RouterModule.forChild(forgotPasswordRoutes), PipesModule],
  exports: [ForgotPasswordComponent],
  declarations: [ForgotPasswordComponent],
  providers: []
})
export class ForgotPasswordModule {}
