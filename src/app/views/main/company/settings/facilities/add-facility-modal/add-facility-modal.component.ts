import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { FormGroupHelper } from '@services/helpers/utils/form-group-helper';
import { ObjectUtil } from '@services/helpers/utils/object-util';
import { NotificationHelperService } from '@services/helpers/notification-helper/notification-helper.service';
import { Subject } from 'rxjs';
import { TypeCheck } from '@services/helpers/utils/type-check';
import { FacilitiesService } from '@app/services/app-layer/facilities/facilities.service';
import { FacilityEntity } from '@app/services/app-layer/entities/facility';

@Component({
  selector: 'app-add-facility-modal',
  templateUrl: './add-facility-modal.component.html'
})
export class AddFacilityModalComponent implements OnInit, OnDestroy {
  public form: FormGroup;
  public name: FormControl;
  public address: FormControl;
  public description: FormControl;
  public country: FormControl;
  public state: FormControl;
  public city: FormControl;
  public zipCode: FormControl;

  private destroy$ = new Subject<void>();

  constructor(
    private dialogRef: MatDialogRef<AddFacilityModalComponent>,
    private facilitiesService: FacilitiesService,
    private notificationHelperService: NotificationHelperService,
    @Inject(MAT_DIALOG_DATA) public facilitiesSummary: FacilityEntity[]
  ) {}

  ngOnInit() {
    this.createFormControls();
    this.createForm();
  }

  public ngOnDestroy(): void {
    this.destroy$.unsubscribe();
  }

  public close(): void {
    this.dialogRef.close();
  }

  public addFacility(): void {
    if (this.form.invalid) return FormGroupHelper.markTouchedAndDirty(this.form);
    if (this.isFacilityNameExist(this.name.value)) return;

    this.facilitiesService
      .addFacility(this.facilityCreationDataToApiFormat(this.form.value))
      .pipe()
      .subscribe(facility => {
        this.notificationHelperService.showSuccess('Facility Successfully Added');
        this.dialogRef.close(facility);
      });
  }

  /*
   * Private Methods
   * */
  private createFormControls(): void {
    this.name = new FormControl('', [Validators.required, Validators.maxLength(35)]);
    this.address = new FormControl('', [Validators.required, Validators.maxLength(50)]);
    this.description = new FormControl('', [Validators.required, Validators.maxLength(100)]);
    this.country = new FormControl('', [Validators.required]);
    this.state = new FormControl('', [Validators.required]);
    this.city = new FormControl('', [Validators.required]);
    this.zipCode = new FormControl('', [Validators.required]);
  }
  private createForm(): void {
    this.form = new FormGroup({
      name: this.name,
      address: this.address,
      description: this.description,
      country: this.country,
      state: this.state,
      city: this.city,
      zipCode: this.zipCode
    });
  }
  private facilityCreationDataToApiFormat(obj: any): any {
    return ObjectUtil.deleteEmptyProperties({
      shortName: obj.name,
      streetAddress: obj.address,
      description: obj.description,
      city: TypeCheck.isObject(obj.city) ? obj.city.name : obj.city,
      state: TypeCheck.isObject(obj.state) ? obj.state.name : obj.state,
      country: TypeCheck.isObject(obj.country) ? obj.country.name : obj.country,
      zipCode: obj.zipCode
    });
  }

  private isFacilityNameExist(facilityName: string): boolean {
    // TODO restore if exists and archived;
    if (this.facilitiesSummary.find(f => f.shortName === facilityName)) {
      this.notificationHelperService.showValidation(`Facility with name ${facilityName} already exists`);
      return true;
    }
  }
}
