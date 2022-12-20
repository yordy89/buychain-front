import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormControl, FormGroup } from '@angular/forms';
import { OrderEntity } from '@services/app-layer/entities/order';
import { NotificationHelperService } from '@services/helpers/notification-helper/notification-helper.service';
import { FormGroupHelper } from '@services/helpers/utils/form-group-helper';

@Component({
  selector: 'app-order-delete-dialog-modal',
  templateUrl: './order-delete-dialog-modal.component.html'
})
export class OrderDeleteDialogModalComponent {
  public confirmDelete = new FormControl('');
  public formGroup = new FormGroup({ confirmDelete: this.confirmDelete });

  constructor(
    private notificationHelperService: NotificationHelperService,
    private dialogRef: MatDialogRef<OrderDeleteDialogModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: OrderEntity
  ) {}

  public reject(): void {
    this.dialogRef.close(false);
  }
  public confirm(): void {
    if (this.confirmDelete.value.toLowerCase() !== 'delete') {
      FormGroupHelper.markControlTouchedAndDirty(this.confirmDelete);
      return this.notificationHelperService.showValidation('Please make sure you typed "delete" correctly.');
    }
    this.dialogRef.close(true);
  }
}
