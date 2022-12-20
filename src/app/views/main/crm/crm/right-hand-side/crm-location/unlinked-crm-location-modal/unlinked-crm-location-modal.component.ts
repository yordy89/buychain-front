import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CrmStateService } from '@views/main/crm/crm/crm-state.service';
import { Subject } from 'rxjs';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { FormGroupHelper } from '@services/helpers/utils/form-group-helper';
import { first } from 'rxjs/operators';
import { FacilitiesService } from '@app/services/app-layer/facilities/facilities.service';
import { FacilityEntity } from '@app/services/app-layer/entities/facility';
import { CrmComponentService } from '@views/main/crm/crm/crm.component.service';
import { CrmLocationEntity } from '@services/app-layer/entities/crm';

@Component({
  selector: 'app-unlinked-crm-location-modal',
  templateUrl: './unlinked-crm-location-modal.component.html',
  styleUrls: ['../../common/unlinked-crm-modal.common.scss']
})
export class UnlinkedCrmLocationModalComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  public form: FormGroup;
  public selectedLocation: FormControl;

  public locationList: FacilityEntity[];
  public filteredLocationList: FacilityEntity[];

  constructor(
    private crmComponentService: CrmComponentService,
    private facilitiesService: FacilitiesService,
    @Inject(MAT_DIALOG_DATA) public location: CrmLocationEntity,
    private dialogRef: MatDialogRef<UnlinkedCrmLocationModalComponent>,
    private crmStateService: CrmStateService
  ) {}

  ngOnInit() {
    this.createFormControls();
    this.createForm();
    this.facilitiesService
      .getCompanyFacilities(this.location.crmAccount.link.id)
      .pipe(first())
      .subscribe(facilities => {
        this.locationList = facilities;
        this.filteredLocationList = this.locationList.filter(
          facility =>
            !this.crmStateService.crmLocations.some(crmUnit => crmUnit.link && crmUnit.link.id === facility.id)
        );
      });
  }

  public ngOnDestroy(): void {
    this.destroy$.unsubscribe();
  }
  public close(entity?: CrmLocationEntity): void {
    this.dialogRef.close(entity);
  }

  public linkLocation(): void {
    if (this.form.invalid) return FormGroupHelper.markTouchedAndDirty(this.form);

    this.crmComponentService
      .toggleLocationLink(this.location, this.selectedLocation.value.id)
      .pipe(first())
      .subscribe(data => this.close(data));
  }

  /*
   * private helpers
   * */

  private createFormControls(): void {
    this.selectedLocation = new FormControl('', [Validators.required]);
  }
  private createForm(): void {
    this.form = new FormGroup({
      selectedLocation: this.selectedLocation
    });
  }
}
