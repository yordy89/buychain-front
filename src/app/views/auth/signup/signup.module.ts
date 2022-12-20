import { NgModule } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { PipesModule } from '@pipes/pipes.module';
import { QuicklinkModule } from 'ngx-quicklink';
import { SignupComponent } from './signup.component';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { signupRoutes } from '@views/auth/signup/signup.routing';

@NgModule({
  imports: [
    ReactiveFormsModule,
    CommonModule,
    MatIconModule,
    RouterModule.forChild(signupRoutes),
    MatFormFieldModule,
    PipesModule,
    QuicklinkModule
  ],
  exports: [SignupComponent],
  declarations: [SignupComponent],
  providers: []
})
export class SignupModule {}
