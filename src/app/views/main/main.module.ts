import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSidenavModule } from '@angular/material/sidenav';
import { RouterModule } from '@angular/router';
import { mainRoutes } from '@views/main/main.routing';

@NgModule({
  imports: [CommonModule, RouterModule.forChild(mainRoutes), MatSidenavModule]
})
export class MainModule {}
