import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { FormGroupHelper } from '@services/helpers/utils/form-group-helper';
import { RateTable } from '@services/app-layer/entities/rate-table';
import { first } from 'rxjs/operators';
import { RateTableService } from '@services/app-layer/rate-table/rate-table.service';
import { NotificationHelperService } from '@services/helpers/notification-helper/notification-helper.service';

@Component({
  selector: 'app-add-rate-table-modal',
  templateUrl: './add-rate-table-modal.component.html',
  styleUrls: ['./add-rate-table-modal.component.scss']
})
export class AddRateTableModalComponent implements OnInit {
  public form: FormGroup;
  public name: FormControl;
  public description: FormControl;

  constructor(
    private rateTableService: RateTableService,
    private dialogRef: MatDialogRef<AddRateTableModalComponent>,
    private notificationHelperService: NotificationHelperService,
    @Inject(MAT_DIALOG_DATA) public rateTables: RateTable[]
  ) {}

  ngOnInit() {
    this.createFormControls();
    this.createForm();
  }

  public close(): void {
    this.dialogRef.close();
  }

  public addNewRateTable(): void {
    this.name.setValue(this.name.value.trim());
    if (this.form.invalid) return FormGroupHelper.markTouchedAndDirty(this.form);
    if (this.rateTables.some(t => t.name === this.name.value)) {
      return this.notificationHelperService.showValidation(
        'A table with specified name already exists. please type a new name.'
      );
    }
    this.rateTableService
      .addRateTable(this.form.value)
      .pipe(first())
      .subscribe(rateTableData => {
        this.notificationHelperService.showSuccess('Rate Table Successfully Added');
        this.dialogRef.close(rateTableData);
      });
  }

  /*
   * Private Methods
   * */
  private createFormControls(): void {
    this.name = new FormControl('', [Validators.required, Validators.maxLength(30)]);
    this.description = new FormControl('', [Validators.required, Validators.maxLength(100)]);
  }
  private createForm(): void {
    this.form = new FormGroup({
      name: this.name,
      description: this.description
    });
  }
}
