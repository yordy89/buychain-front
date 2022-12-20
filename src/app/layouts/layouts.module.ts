import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { MarketingContentComponent } from '@app/layouts/components/marketing-content/marketing-content.component';
import { CompanyLogoSectionModule } from '@views/auth/components/company-logo-section/company-logo-section.module';

import { PerfectScrollbarModule } from 'ngx-perfect-scrollbar';
import { QuicklinkModule } from 'ngx-quicklink';

import { AuthLayoutComponent } from './auth-layout/auth-layout.component';
import { HomeLayoutComponent } from './home-layout/home-layout.component';
import { MainLayoutComponent } from './main-layout/main-layout.component';
import { IconButtonModule } from '@components/common/buttons/icon-button/icon-button.module';

@NgModule({
  declarations: [MainLayoutComponent, HomeLayoutComponent, AuthLayoutComponent, MarketingContentComponent],
  imports: [
    CommonModule,
    RouterModule,
    PerfectScrollbarModule,
    MatSidenavModule,
    MatTooltipModule,
    MatListModule,
    MatIconModule,
    IconButtonModule,
    MatTabsModule,
    CompanyLogoSectionModule,
    MatProgressSpinnerModule,
    QuicklinkModule
  ]
})
export class LayoutsModule {}
