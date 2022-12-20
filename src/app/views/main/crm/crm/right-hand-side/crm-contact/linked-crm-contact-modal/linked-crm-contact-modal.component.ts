import { Component, Inject, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NotificationHelperService } from '@services/helpers/notification-helper/notification-helper.service';
import { first } from 'rxjs/operators';
import { CrmContactEntity } from '@services/app-layer/entities/crm';
import { CrmComponentService } from '@views/main/crm/crm/crm.component.service';
import { ObjectUtil } from '@services/helpers/utils/object-util';

@Component({
  selector: 'app-linked-crm-contact-modal',
  templateUrl: './linked-crm-contact-modal.component.html',
  styleUrls: ['../../common/linked-crm-modal.common.scss']
})
export class LinkedCrmContactModalComponent implements OnDestroy {
  private destroy$ = new Subject<void>();

  constructor(
    private crmComponentService: CrmComponentService,
    @Inject(MAT_DIALOG_DATA) public contact: CrmContactEntity,
    private notificationHelperService: NotificationHelperService,
    private dialogRef: MatDialogRef<LinkedCrmContactModalComponent>
  ) {}

  ngOnDestroy(): void {
    this.destroy$.unsubscribe();
  }
  close(entity?: CrmContactEntity): void {
    this.dialogRef.close(entity);
  }

  public unlinkCrmContact(): void {
    this.crmComponentService
      .toggleContactLink(this.contact, null)
      .pipe(first())
      .subscribe(resp => this.close(resp));
  }
  public syncCrmContact(): void {
    this.crmComponentService
      .updateContact(this.contact, this.getNormalizedPayload())
      .pipe(first())
      .subscribe(resp => {
        this.notificationHelperService.showSuccess(`The CRM contact was successfully synchronized
        with ${this.contact.link.firstName} ${this.contact.link.lastName} BuyChain contact`);
        this.close(resp);
      });
  }

  private getNormalizedPayload(): any {
    const payload = ObjectUtil.deleteEmptyProperties(this.contact.link);
    delete payload.id;
    return payload;
  }
}
