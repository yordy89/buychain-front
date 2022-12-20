import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { FacilitiesService } from '@app/services/app-layer/facilities/facilities.service';
import { FacilityEntity, FacilityPersonnelType } from '@app/services/app-layer/entities/facility';
import { NotificationHelperService } from '@services/helpers/notification-helper/notification-helper.service';
import { FormGroupHelper } from '@services/helpers/utils/form-group-helper';
import { AccessControlScope } from '@services/app-layer/permission/permission.interface';
import { ObjectUtil } from '@services/helpers/utils/object-util';
import { RateTable } from '@app/services/app-layer/entities/rate-table';
import { RateTableService } from '@app/services/app-layer/rate-table/rate-table.service';
import { Environment } from '@services/app-layer/app-layer.environment';

@Component({
  selector: 'app-ship-from',
  templateUrl: './ship-from.component.html',
  styleUrls: ['../common/ship.common.scss', './ship-from.component.scss']
})
export class ShipFromComponent implements OnInit, OnDestroy {
  @Input() facility: FacilityEntity;
  @Input() isCrm = false;

  public disabledMode = true;
  public canUpdateShipFrom: boolean;

  public form: FormGroup;
  public loadingHours: FormControl;
  public loadingNotes: FormControl;
  public rateTableId: FormControl;
  public FacilityPersonnelType = FacilityPersonnelType;
  public rateTables: RateTable[];

  private destroy$ = new Subject<void>();

  constructor(
    private rateTableService: RateTableService,
    private facilitiesService: FacilitiesService,
    private notificationHelperService: NotificationHelperService
  ) {}

  ngOnInit() {
    this.createFormControls();
    this.createForm();
    this.setInitialData(this.facility);
    this.setUserPermissions();

    if (!this.isCrm) this.loadRateTables();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  edit(): void {
    this.disabledMode = false;
    this.form.enable({ emitEvent: false });
  }

  done(): void {
    if (this.form.invalid) return FormGroupHelper.markTouchedAndDirty(this.form);
    const payload = FormGroupHelper.getChangedValues(this.form.value, this.facility);
    if (!this.facility.rateTableId && !payload.rateTableId) delete payload.rateTableId;
    if (ObjectUtil.isEmptyObject(payload)) {
      this.disabledMode = true;
      this.form.disable({ emitEvent: false });
      return;
    }
    this.facilitiesService
      .updateFacility(this.facility.id, payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: FacilityEntity) => {
        this.facility = data;
        this.setInitialData(this.facility);
        this.notificationHelperService.showSuccess('Facility Ship-from section successfully updated');
        this.disabledMode = true;
        this.form.disable({ emitEvent: false });
        FormGroupHelper.markUntouchedAndPristine(this.form);
      });
  }

  /*
   * private helpers
   * */

  private loadRateTables(): void {
    this.rateTableService
      .getCompanyRateTables()
      .pipe(takeUntil(this.destroy$))
      .subscribe((rateTables: RateTable[]) => (this.rateTables = rateTables));
  }

  private createFormControls(): void {
    this.rateTableId = new FormControl({ value: '', disabled: true });
    this.loadingHours = new FormControl({ value: '', disabled: true }, [Validators.maxLength(1000)]);
    this.loadingNotes = new FormControl({ value: '', disabled: true }, [Validators.maxLength(1000)]);
  }
  private createForm(): void {
    this.form = new FormGroup({
      loadingHours: this.loadingHours,
      loadingNotes: this.loadingNotes,
      rateTableId: this.rateTableId
    });
  }

  private setInitialData(initialData: any): void {
    this.loadingHours.setValue(initialData.loadingHours);
    this.loadingNotes.setValue(initialData.loadingNotes);
    if (!this.isCrm && this.facility.rateTableId) {
      this.rateTableId.setValue(this.facility.rateTableId);
    }
  }

  private setUserPermissions(): void {
    const facilityAccessRoles =
      Environment.getCurrentUser().normalizedAccessControlRoles.FACILITY.facilitySection.sectionGroup;
    this.canUpdateShipFrom = facilityAccessRoles.update.value === AccessControlScope.Company;
  }
}
