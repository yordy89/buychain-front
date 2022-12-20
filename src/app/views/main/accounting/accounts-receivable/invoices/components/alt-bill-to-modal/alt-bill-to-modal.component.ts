import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { CrmLocationEntity } from '@services/app-layer/entities/crm';
import { BehaviorSubject, Subject } from 'rxjs';
import { FormGroup } from '@angular/forms';
import { FormGroupHelper } from '@services/helpers/utils/form-group-helper';
import { NotificationHelperService } from '@services/helpers/notification-helper/notification-helper.service';

@Component({
  selector: 'app-alt-bill-to-modal',
  templateUrl: './alt-bill-to-modal.component.html'
})
export class AltBillToModalComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  public form: FormGroup;
  public readonlyMode$: BehaviorSubject<boolean> = new BehaviorSubject(false);

  constructor(
    private notificationHelperService: NotificationHelperService,
    private dialog: MatDialog,
    private dialogRef: MatDialogRef<AltBillToModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CrmLocationEntity
  ) {}

  ngOnInit() {
    this.createForm();
  }

  public ngOnDestroy(): void {
    this.destroy$.unsubscribe();
  }
  public close(data?: CrmLocationEntity): void {
    this.dialogRef.close(data);
  }

  public saveAltBillTo(): void {
    if (this.form.invalid) return FormGroupHelper.markTouchedAndDirty(this.form);
    this.close(this.form.value.facility);
  }

  private createForm(): void {
    this.form = new FormGroup({});
  }
}
