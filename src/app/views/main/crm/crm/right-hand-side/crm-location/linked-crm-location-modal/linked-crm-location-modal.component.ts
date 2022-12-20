import { Component, Inject, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NotificationHelperService } from '@services/helpers/notification-helper/notification-helper.service';
import { first } from 'rxjs/operators';
import { CrmComponentService } from '@views/main/crm/crm/crm.component.service';
import { CrmLocationEntity } from '@services/app-layer/entities/crm';
import { ObjectUtil } from '@services/helpers/utils/object-util';

@Component({
  selector: 'app-linked-crm-location-modal',
  templateUrl: './linked-crm-location-modal.component.html',
  styleUrls: ['../../common/linked-crm-modal.common.scss']
})
export class LinkedCrmLocationModalComponent implements OnDestroy {
  private destroy$ = new Subject<void>();

  constructor(
    private crmComponentService: CrmComponentService,
    @Inject(MAT_DIALOG_DATA) public crmLocation: CrmLocationEntity,
    private notificationHelperService: NotificationHelperService,
    private dialogRef: MatDialogRef<LinkedCrmLocationModalComponent>
  ) {}

  public ngOnDestroy(): void {
    this.destroy$.unsubscribe();
  }
  public close(entity?: CrmLocationEntity): void {
    this.dialogRef.close(entity);
  }

  public unlinkCrmLocation(): void {
    this.crmComponentService
      .toggleLocationLink(this.crmLocation, null)
      .pipe(first())
      .subscribe(data => this.close(data));
  }
  public syncCrmLocation(): void {
    this.crmComponentService
      .updateLocation(this.crmLocation, this.getNormalizedPayload())
      .pipe(first())
      .subscribe(data => {
        this.notificationHelperService.showSuccess(`The CRM location was successfully synchronized
        with ${this.crmLocation.link.shortName} BuyChain location`);
        this.close(data);
      });
  }

  private getNormalizedPayload(): any {
    return ObjectUtil.deleteEmptyProperties({
      shortName: this.crmLocation.link.shortName,
      streetAddress: this.crmLocation.link.streetAddress,
      city: this.crmLocation.link.city,
      state: this.crmLocation.link.state,
      country: this.crmLocation.link.country,
      zipCode: this.crmLocation.link.zipCode,
      careOf: this.crmLocation.link.careOf,
      logoUrl: this.crmLocation.link.logoUrl,
      geolocation: this.crmLocation.link.geolocation
    });
  }
}
