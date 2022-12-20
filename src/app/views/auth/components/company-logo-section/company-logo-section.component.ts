import { Component } from '@angular/core';
import { Environment } from '@app/services/app-layer/app-layer.environment';

@Component({
  selector: 'app-company-logo-section',
  templateUrl: './company-logo-section.component.html',
  styleUrls: ['./company-logo-section.component.scss']
})
export class CompanyLogoSectionComponent {
  public isCustomDomain = Environment.isCustomDomain;
}
