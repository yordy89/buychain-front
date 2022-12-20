import { Component, Inject, OnInit } from '@angular/core';
import { TooltipTextEnum } from '@services/app-layer/app-layer.enums';
import { NotificationHelperService } from '@services/helpers/notification-helper/notification-helper.service';
import { CompaniesService } from '@services/app-layer/companies/companies.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CompanyDetails } from '@app/services/data-layer/http-api/base-api/swagger-gen';

@Component({
  selector: 'app-edit-privacy-settings-modal',
  templateUrl: './edit-privacy-settings-modal.component.html'
})
export class EditPrivacySettingsModalComponent implements OnInit {
  public allowListing: boolean;
  readonly tooltipTextEnum = TooltipTextEnum;

  constructor(
    private notificationHelperService: NotificationHelperService,
    private companiesService: CompaniesService,
    private dialogRef: MatDialogRef<EditPrivacySettingsModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CompanyDetails
  ) {}

  ngOnInit() {
    this.allowListing = this.data.privacySettings.allowListing;
  }

  public close(company?: CompanyDetails): void {
    this.dialogRef.close(company);
  }

  public updatePrivacySettings(): void {
    if (this.allowListing === this.data.privacySettings.allowListing) return this.close();
    this.companiesService
      .updateCompanyPrivacySettings(this.data.id, { allowListing: this.allowListing })
      .pipe()
      .subscribe(response => {
        this.notificationHelperService.showSuccess('Privacy settings were successfully updated');
        this.data.privacySettings = response;
        this.close(this.data);
      });
  }
}
