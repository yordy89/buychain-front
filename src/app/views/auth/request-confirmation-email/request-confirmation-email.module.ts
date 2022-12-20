import { NgModule } from '@angular/core';
import { PipesModule } from '@pipes/pipes.module';
import { QuicklinkModule } from 'ngx-quicklink';
import { RequestConfirmationEmailComponent } from './request-confirmation-email.component';
import { ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { requestConfirmationEmailRoutes } from '@views/auth/request-confirmation-email/request-confirmation-email.routing';

@NgModule({
  imports: [
    ReactiveFormsModule,
    MatIconModule,
    CommonModule,
    RouterModule.forChild(requestConfirmationEmailRoutes),
    PipesModule,
    QuicklinkModule
  ],
  exports: [RequestConfirmationEmailComponent],
  declarations: [RequestConfirmationEmailComponent],
  providers: []
})
export class RequestConfirmationEmailModule {}
