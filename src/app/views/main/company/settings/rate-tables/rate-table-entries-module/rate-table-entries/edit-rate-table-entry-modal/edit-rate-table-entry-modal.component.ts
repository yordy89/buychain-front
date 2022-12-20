import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { RateTableService } from '@services/app-layer/rate-table/rate-table.service';
import { FormGroupHelper } from '@services/helpers/utils/form-group-helper';
import { first } from 'rxjs/operators';
import { RateTableItem } from '@services/app-layer/entities/rate-table';
import { Environment } from '@services/app-layer/app-layer.environment';

@Component({
  selector: 'app-edit-rate-table-entry-modal',
  templateUrl: './edit-rate-table-entry-modal.component.html',
  styleUrls: ['./edit-rate-table-entry-modal.component.scss']
})
export class EditRateTableEntryModalComponent implements OnInit {
  public form: FormGroup;
  public cost: FormControl;
  public destinationDescription: FormControl;

  public entry: RateTableItem;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { rateTableId: string; entry: RateTableItem },
    private rateTableService: RateTableService,
    private dialogRef: MatDialogRef<EditRateTableEntryModalComponent>
  ) {}

  ngOnInit(): void {
    this.entry = this.data.entry;
    this.createFormControls();
    this.createForm();
    this.setInitialData();
  }

  close(): void {
    this.dialogRef.close();
  }

  editRateTableEntry(): void {
    if (this.form.invalid) return FormGroupHelper.markTouchedAndDirty(this.form);
    this.rateTableService
      .updateRateTableEntry(this.data.rateTableId, this.data.entry.id, this.form.value)
      .pipe(first())
      .subscribe(data => this.dialogRef.close(data));
  }

  /*
   * Private helpers
   * */

  private createFormControls(): void {
    this.cost = new FormControl('', [
      Validators.required,
      Validators.min(0),
      Validators.max(Environment.maxSafeNumber)
    ]);
    this.destinationDescription = new FormControl('', [Validators.maxLength(100)]);
  }
  private createForm(): void {
    this.form = new FormGroup({
      cost: this.cost,
      destinationDescription: this.destinationDescription
    });
  }
  private setInitialData(): void {
    this.cost.setValue(this.data.entry.cost);
    this.destinationDescription.setValue(this.data.entry.destinationDescription);
  }
}
