import { Component, Inject, OnDestroy } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { first } from 'rxjs/operators';
import { NotificationHelperService } from '@services/helpers/notification-helper/notification-helper.service';
import { DialogModalComponent, DialogType } from '@components/common/modals/dialog-modal/dialog-modal.component';
import { CrmComponentService } from '@views/main/crm/crm/crm.component.service';
import { CrmAccountEntity } from '@services/app-layer/entities/crm';
import { ObjectUtil } from '@services/helpers/utils/object-util';

@Component({
  selector: 'app-linked-crm-account-modal',
  templateUrl: './linked-crm-account-modal.component.html',
  styleUrls: ['../../common/linked-crm-modal.common.scss']
})
export class LinkedCrmAccountModalComponent implements OnDestroy {
  private destroy$ = new Subject<void>();

  constructor(
    private dialog: MatDialog,
    private crmComponentService: CrmComponentService,
    @Inject(MAT_DIALOG_DATA) public account: CrmAccountEntity,
    private notificationHelperService: NotificationHelperService,
    private dialogRef: MatDialogRef<LinkedCrmAccountModalComponent>
  ) {}

  public ngOnDestroy(): void {
    this.destroy$.unsubscribe();
  }
  public close(data?: CrmAccountEntity): void {
    this.dialogRef.close(data);
  }

  public unlinkCrmAccount(): void {
    this.dialog
      .open(DialogModalComponent, {
        width: '450px',
        disableClose: true,
        data: {
          type: DialogType.Confirm,
          content:
            'Are you sure you want to unlink the CRM account? Unlink will result in unlinking of all the contacts and locations under that account'
        }
      })
      .afterClosed()
      .subscribe((confirmed: boolean) => {
        if (confirmed) {
          this.crmComponentService
            .toggleAccountLink(this.account, null)
            .pipe(first())
            .subscribe(data => this.close(data));
        }
      });
  }
  public syncCrmAccount(): void {
    const payload = ObjectUtil.getDeepCopy(this.account.link);
    delete payload.id;
    this.crmComponentService
      .updateAccount(this.account, payload)
      .pipe(first())
      .subscribe(data => {
        this.notificationHelperService.showSuccess(
          `The CRM account was successfully synchronized with ${data.link.name} BuyChain account`
        );
        this.close(data);
      });
  }
}
