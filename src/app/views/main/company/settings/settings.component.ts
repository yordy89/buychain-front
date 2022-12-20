import { AfterViewInit, Component, OnInit } from '@angular/core';
import { first } from 'rxjs/operators';
import { ActivatedRoute } from '@angular/router';
import {
  CompanySettingsExpandableSection,
  NavigationHelperService
} from '@services/helpers/navigation-helper/navigation-helper.service';
import { Environment } from '@app/services/app-layer/app-layer.environment';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit, AfterViewInit {
  public CompanySettingsExpandableSection = CompanySettingsExpandableSection;
  public expanded: CompanySettingsExpandableSection = CompanySettingsExpandableSection.Company;
  public features = Environment.getCompanyFeatures();

  constructor(private route: ActivatedRoute, public navigationHelperService: NavigationHelperService) {}

  ngOnInit() {
    this.route.queryParams.subscribe(param => {
      if (param?.expanded) this.expanded = param.expanded;
    });
  }

  // Case For opening user management ?popup when User Admin navigates from an email.
  public ngAfterViewInit(): void {
    this.route.queryParams.pipe(first()).subscribe((queryParams: any) => {
      const { type } = queryParams;
      if (type === 'member_verification')
        this.navigationHelperService.navigateCompanySettings(CompanySettingsExpandableSection.UserManagement);
    });
  }
}
