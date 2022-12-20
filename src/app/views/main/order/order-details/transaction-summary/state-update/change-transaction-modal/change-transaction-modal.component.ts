import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TransactionEntity } from '@services/app-layer/entities/transaction';
import { NotificationHelperService } from '@services/helpers/notification-helper/notification-helper.service';
import { ChangeTransactionTypesEnum } from '@services/app-layer/app-layer.enums';
import { Environment } from '@services/app-layer/app-layer.environment';
import { AccessControlScope } from '@services/app-layer/permission/permission.interface';
import { StateUpdateHelper } from '@views/main/order/order-details/transaction-summary/state-update/state-update-helper';

@Component({
  selector: 'app-change-transaction-modal',
  templateUrl: './change-transaction-modal.component.html'
})
export class ChangeTransactionModalComponent implements OnInit {
  public ChangeTransactionTypesEnum = ChangeTransactionTypesEnum;
  public selectedType: ChangeTransactionTypesEnum;

  public userPermissions = {
    canModifyTransport: false,
    canModifyTally: false
  };

  constructor(
    private stateUpdateHelper: StateUpdateHelper,
    private notificationHelperService: NotificationHelperService,
    private dialogRef: MatDialogRef<ChangeTransactionModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: TransactionEntity
  ) {}

  ngOnInit(): void {
    this.setUserPermissions();
  }

  public close(): void {
    this.dialogRef.close();
  }

  public changeTransaction(): void {
    if (!this.selectedType) return this.notificationHelperService.showValidation('Please Select a Change Type');
    this.dialogRef.close(this.selectedType);
  }

  private setUserPermissions(): void {
    const user = Environment.getCurrentUser();
    const txPermissions = user.normalizedAccessControlRoles.TRANSACTION.transactionSection.sectionGroup;
    this.userPermissions = {
      canModifyTransport:
        txPermissions.updateTrackingData.value === AccessControlScope.Company ||
        (txPermissions.updateTrackingData.value === AccessControlScope.Owner && this.data.isResourceOwner),
      canModifyTally:
        txPermissions.updateTally.value === AccessControlScope.Company ||
        (txPermissions.updateTally.value === AccessControlScope.Owner && this.data.isResourceOwner) ||
        txPermissions.deleteTally.value === AccessControlScope.Company ||
        (txPermissions.deleteTally.value === AccessControlScope.Owner && this.data.isResourceOwner)
    };
  }
}
