import { NgModule } from '@angular/core';
import { ActivationComponent } from './activation.component';
import { RouterModule } from '@angular/router';
import { activationRoutes } from '@views/auth/activation/activation.routing';

@NgModule({
  imports: [RouterModule.forChild(activationRoutes)],
  exports: [ActivationComponent],
  declarations: [ActivationComponent],
  providers: []
})
export class ActivationModule {}
