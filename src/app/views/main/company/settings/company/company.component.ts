import { Component, OnDestroy, OnInit } from '@angular/core';
import { EditCompanyDataModalComponent } from '@views/main/company/settings/company/edit-company-data-modal/edit-company-data-modal.component';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { Environment } from '@services/app-layer/app-layer.environment';
import { AccessControlScope } from '@services/app-layer/permission/permission.interface';
import { CompaniesService } from '@services/app-layer/companies/companies.service';
import {
  CompanyDetails,
  CompanyPrivacySettings,
  CompanyContract
} from '@app/services/data-layer/http-api/base-api/swagger-gen';
import { SelectionCriteriaEnum, TooltipTextEnum } from '@services/app-layer/app-layer.enums';
import { EditSalesPracticesModalComponent } from '@views/main/company/settings/company/edit-sales-practices-modal/edit-sales-practices-modal.component';
import { EditPrivacySettingsModalComponent } from '@views/main/company/settings/company/edit-privacy-settings-modal/edit-privacy-settings-modal.component';
import { User } from '@app/services/app-layer/entities/user';

@Component({
  selector: 'app-company',
  templateUrl: './company.component.html',
  styleUrls: ['./company.component.scss']
})
export class CompanyComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  public company: CompanyDetails;
  logoUrl: string;

  public currentUser: User;

  public permissions = {
    canUpdateMainData: false,
    canUpdateAccountingPractices: false,
    canUpdateSalesPractices: false,
    canUpdatePrivacySettings: false
  };

  public selectionCriteria: string;
  public privacySettings: CompanyPrivacySettings;
  public companyContract: CompanyContract;

  readonly tooltipTextEnum = TooltipTextEnum;

  constructor(private companiesService: CompaniesService, private dialog: MatDialog) {}

  ngOnInit() {
    this.currentUser = Environment.getCurrentUser();
    this.setUserPermissions();
    this.companiesService
      .getUserCompany()
      .pipe(takeUntil(this.destroy$))
      .subscribe((company: CompanyDetails) => this.setCompanyInfo(company));
  }

  public ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.unsubscribe();
  }

  public editCompanyInfo(): void {
    this.dialog
      .open(EditCompanyDataModalComponent, {
        width: '648px',
        disableClose: true,
        data: this.company
      })
      .afterClosed()
      .subscribe(company => {
        this.setCompanyInfo(company);
      });
  }

  public editSalesPractices(): void {
    this.dialog
      .open(EditSalesPracticesModalComponent, {
        width: '450px',
        disableClose: true,
        data: this.company
      })
      .afterClosed()
      .subscribe(company => {
        if (company) this.setCompanyInfo(company);
      });
  }
  public editPrivacySettings(): void {
    this.dialog
      .open(EditPrivacySettingsModalComponent, {
        width: '450px',
        disableClose: true,
        data: this.company
      })
      .afterClosed()
      .subscribe(company => {
        if (company) this.setCompanyInfo(company);
      });
  }

  /*
   * private helpers
   * */

  private setUserPermissions(): void {
    const accessControlRole = this.currentUser.normalizedAccessControlRoles.COMPANY.companySection.sectionGroup;
    this.permissions.canUpdateMainData = accessControlRole.updateDetails.value === AccessControlScope.Company;
    this.permissions.canUpdateAccountingPractices =
      accessControlRole.updateAccountingPractices.value === AccessControlScope.Company;
    this.permissions.canUpdateSalesPractices =
      accessControlRole.updateSalesPractices.value === AccessControlScope.Company;
    this.permissions.canUpdatePrivacySettings =
      accessControlRole.updatePrivacySettings.value === AccessControlScope.Company;
  }

  private setCompanyInfo(company: CompanyDetails): void {
    if (company.logoUrl) this.logoUrl = `${company.logoUrl}?${new Date().getTime()}`;
    this.company = company;

    const salesPractices = this.company.salesPractices;
    this.selectionCriteria = SelectionCriteriaEnum[salesPractices.selectionCriteria];

    this.privacySettings = this.company.privacySettings;

    this.companyContract = this.company.contract;
  }
}
