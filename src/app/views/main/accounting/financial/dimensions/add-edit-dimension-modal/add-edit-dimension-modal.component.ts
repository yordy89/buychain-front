import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { DimensionsService } from '@services/app-layer/dimensions/dimensions.service';
import { DimensionEntity } from '@services/app-layer/entities/dimension';
import { FormGroupHelper } from '@services/helpers/utils/form-group-helper';

@Component({
  selector: 'app-add-edit-dimension-modal',
  templateUrl: './add-edit-dimension-modal.component.html'
})
export class AddEditDimensionModalComponent implements OnInit {
  public formGroup: FormGroup;
  public name: FormControl;
  public description: FormControl;
  public archived: FormControl;

  constructor(
    @Inject(MAT_DIALOG_DATA) public dimension: DimensionEntity,
    private dialogRef: MatDialogRef<AddEditDimensionModalComponent>,
    private dimensionsService: DimensionsService
  ) {}

  ngOnInit(): void {
    this.createFormControls();
    this.createForm();
    if (this.dimension) this.setInitialData();
  }

  close(dimension?: any): void {
    this.dialogRef.close(dimension);
  }

  submit(): void {
    if (this.dimension) {
      this.editDimension();
    } else {
      this.addDimension();
    }
  }

  addDimension(): void {
    const payload = FormGroupHelper.getDirtyValues(this.formGroup);
    payload.name = payload.name.trim();

    this.dimensionsService.addDimension(payload).subscribe(data => {
      this.close(data);
    });
  }

  editDimension(): void {
    const payload = FormGroupHelper.getDirtyValues(this.formGroup);
    if (payload.name) payload.name = payload.name.trim();

    if (this.description.dirty) payload.description = payload.description || null;
    this.dimensionsService.editDimension(this.dimension, payload).subscribe(data => {
      this.close(data);
    });
  }

  onChangeActive(checked) {
    this.archived.setValue(!checked);
    this.archived.markAsDirty();
  }

  /*
   * private helpers
   * */

  private createFormControls(): void {
    this.name = new FormControl('', [Validators.required, Validators.maxLength(150)]);
    this.description = new FormControl('', [Validators.maxLength(500)]);
    this.archived = new FormControl(false);
  }

  private createForm(): void {
    this.formGroup = new FormGroup({
      name: this.name,
      description: this.description,
      archived: this.archived
    });
  }

  private setInitialData(): void {
    this.name.setValue(this.dimension.name);
    this.description.setValue(this.dimension.description);
    this.archived.setValue(this.dimension.archived);
  }
}
