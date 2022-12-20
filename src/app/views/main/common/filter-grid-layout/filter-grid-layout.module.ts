import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { FilterGridLayoutComponent } from '@views/main/common/filter-grid-layout/filter-grid-layout.component';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatTooltipModule } from '@angular/material/tooltip';

@NgModule({
  imports: [MatIconModule, MatSidenavModule, CommonModule, MatButtonModule, MatTooltipModule],
  exports: [FilterGridLayoutComponent],
  declarations: [FilterGridLayoutComponent],
  providers: []
})
export class FilterGridLayoutModule {}
