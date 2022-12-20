import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormControl, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { FormGroupHelper } from '@services/helpers/utils/form-group-helper';
import { MemberEntity } from '@services/app-layer/entities/member';
import { FacilityEntity, FacilityPersonnelType } from '@services/app-layer/entities/facility';
import { FacilitiesService } from '@services/app-layer/facilities/facilities.service';

@Component({
  selector: 'app-add-facility-modal',
  templateUrl: './add-personnel-modal.component.html'
})
export class AddPersonnelModalComponent implements OnInit {
  public form: FormGroup;
  public userId: FormControl;
  public description: FormControl;

  descriptionValidation(): ValidatorFn {
    return (control: FormControl): { [key: string]: any } => {
      const val = control.value;
      return this.data.facility.personnel.some(
        p => p.department === this.data.department && p.description === val && p.userId === this.userId.value
      )
        ? { nonUnique: 'A personnel with these details already exists.' }
        : null;
    };
  }

  constructor(
    private facilitiesService: FacilitiesService,
    private dialogRef: MatDialogRef<AddPersonnelModalComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: { members: MemberEntity[]; facility: FacilityEntity; department: FacilityPersonnelType }
  ) {}

  ngOnInit() {
    this.createFormControls();
    this.createForm();
  }

  public close(): void {
    this.dialogRef.close();
  }

  public addPersonnel(): void {
    if (this.form.invalid) return FormGroupHelper.markTouchedAndDirty(this.form);
    const data = this.form.value;
    this.facilitiesService
      .addFacilityPersonnel(this.data.facility.id, { ...data, department: this.data.department })
      .pipe()
      .subscribe(response => this.dialogRef.close(response));
  }

  /*
   * Private Methods
   * */
  private createFormControls(): void {
    this.userId = new FormControl('', [Validators.required]);
    this.description = new FormControl('', [
      Validators.required,
      Validators.maxLength(500),
      this.descriptionValidation()
    ]);
  }
  private createForm(): void {
    this.form = new FormGroup({
      userId: this.userId,
      description: this.description
    });
  }
}
