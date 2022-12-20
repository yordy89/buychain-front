import { Component, Inject, LOCALE_ID, OnDestroy, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { NotificationHelperService } from '@services/helpers/notification-helper/notification-helper.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FormGroupHelper } from '@services/helpers/utils/form-group-helper';

@Component({
  selector: 'app-add-reject-note-modal',
  templateUrl: 'add-reject-note-modal.component.html'
})
export class AddRejectNoteModalComponent implements OnDestroy, OnInit {
  form: FormGroup;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private notificationHelperService: NotificationHelperService,
    private dialog: MatDialog,
    private dialogRef: MatDialogRef<AddRejectNoteModalComponent>,
    @Inject(LOCALE_ID) private localeId: string
  ) {}

  ngOnInit(): void {
    this.createForm();
  }

  public ngOnDestroy(): void {
    this.destroy$.unsubscribe();
  }

  public close(data?: string): void {
    this.dialogRef.close(data);
  }

  private createForm(): void {
    const config = {
      rejectNotes: [null, [Validators.required, Validators.maxLength(256)]]
    };

    this.form = this.fb.group(config);
  }

  addNote() {
    if (!this.form.valid) {
      FormGroupHelper.markTouchedAndDirty(this.form);
      return;
    }
    this.close(this.form.value.rejectNotes);
  }
}
