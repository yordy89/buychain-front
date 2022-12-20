import { NgModule } from '@angular/core';
import { routes } from '@views/auth/auth.routing';
import { RouterModule } from '@angular/router';

@NgModule({
  imports: [RouterModule.forChild(routes)],
  declarations: [],
  exports: []
})
export class AuthModule {}
