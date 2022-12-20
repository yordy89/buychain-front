import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { catchError, first } from 'rxjs/operators';
import { MilestoneService, Attachment } from '@services/app-layer/milestone/milestone.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { FormGroupHelper } from '@services/helpers/utils/form-group-helper';
import { NotificationHelperService } from '@services/helpers/notification-helper/notification-helper.service';
import { ObjectUtil } from '@services/helpers/utils/object-util';
import { TransactionsService } from '@app/services/app-layer/transactions/transactions.service';
import { MilestoneIconNames } from '@app/services/app-layer/app-layer.enums';
import { TransactionEntity, MilestoneEntity } from '@app/services/app-layer/entities/transaction';
import { FileSelectComponent } from '@components/common/inputs/file-select/file-select.component';
import { EMPTY } from 'rxjs';

@Component({
  selector: 'app-add-milestone-modal',
  templateUrl: './add-milestone-modal.component.html'
})
export class AddMilestoneModalComponent implements OnInit {
  @ViewChild('fileSelector') private fileSelector: FileSelectComponent;

  public form: FormGroup;
  public attachment: FormControl;
  public icon: FormControl;
  public description: FormControl;

  public attachedFile: Attachment;

  public iconsList = Object.keys(MilestoneIconNames).map(k => MilestoneIconNames[k]);

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: TransactionEntity,
    private dialogRef: MatDialogRef<AddMilestoneModalComponent>,
    private notificationHelperService: NotificationHelperService,
    private milestoneService: MilestoneService,
    private transactionsService: TransactionsService
  ) {}

  ngOnInit() {
    this.createFormControls();
    this.createForm();
  }

  public close(data?: MilestoneEntity): void {
    this.dialogRef.close(data);
  }

  public fileChanged(file): void {
    if (file) {
      if (file.size / 1024 > 2048) {
        this.notificationHelperService.showValidation('The selected file size should not exceed 2 Mb.');
        this.resetAttachment();
        return;
      }
      const prefix = file.name.split('.')[0];
      this.milestoneService
        .uploadDocument(file, prefix)
        .pipe(
          first(),
          catchError(() => {
            this.resetAttachment();
            this.notificationHelperService.showValidation('Something unexpected happened. Please try again.');
            return EMPTY;
          })
        )
        .subscribe(data => {
          if (!data) return this.resetAttachment();
          this.attachedFile = data;
          this.attachment.setValue(data.id);
        });
    } else {
      this.resetAttachment();
    }
  }
  public resetAttachment(): void {
    this.fileSelector.selectedFile = null;
    this.attachment.reset();
    this.attachedFile = null;
  }

  public saveMilestone(): void {
    if (this.form.invalid) {
      this.notificationHelperService.showValidation('Please make sure to complete the form to add the milestone');
      return FormGroupHelper.markTouchedAndDirty(this.form);
    }
    this.transactionsService
      .addTransactionMilestone(this.data.id, ObjectUtil.deleteEmptyProperties(this.form.value))
      .pipe(first())
      .subscribe(data => {
        this.notificationHelperService.showSuccess('The milestone is successfully added');
        this.close(data);
      });
  }

  /*
   * private helpers
   * */

  private createFormControls(): void {
    this.attachment = new FormControl('');
    this.icon = new FormControl('', [Validators.required]);
    this.description = new FormControl('', [Validators.required, Validators.maxLength(1000)]);
  }
  public createForm(): void {
    this.form = new FormGroup({
      icon: this.icon,
      description: this.description,
      attachment: this.attachment
    });
  }
}
