import { Component, OnDestroy, OnInit } from '@angular/core';
import { DialogModalComponent, DialogType } from '@components/common/modals/dialog-modal/dialog-modal.component';
import { catchError, takeUntil } from 'rxjs/operators';
import { FormGroupHelper } from '@services/helpers/utils/form-group-helper';
import {
  CompanySettingsExpandableSection,
  NavigationHelperService
} from '@services/helpers/navigation-helper/navigation-helper.service';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, EMPTY, Subject } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { FacilityEntity } from '@services/app-layer/entities/facility';
import { FacilitiesService } from '@services/app-layer/facilities/facilities.service';
import { NotificationHelperService } from '@services/helpers/notification-helper/notification-helper.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { AccessControlScope } from '@services/app-layer/permission/permission.interface';
import { ObjectUtil } from '@services/helpers/utils/object-util';
import { Environment } from '@services/app-layer/app-layer.environment';

@Component({
  selector: 'app-facility-details',
  templateUrl: './facility-details.component.html',
  styleUrls: ['./facility-details.component.scss']
})
export class FacilityDetailsComponent implements OnInit, OnDestroy {
  public facilityId: string;
  public facility: FacilityEntity;
  public form: FormGroup;
  public description: FormControl;

  public facilityPermissions = { canRead: false, canUpdate: false, canDelete: false };

  private destroy$ = new Subject<void>();
  public readonlyMode$: BehaviorSubject<boolean> = new BehaviorSubject(true);

  constructor(
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private facilitiesService: FacilitiesService,
    private notificationHelperService: NotificationHelperService,
    private navigationHelperService: NavigationHelperService
  ) {}

  ngOnInit() {
    this.facilityId = this.route.snapshot.params.facilityId;
    this.setFacilityPermissions();
    if (!this.facilityPermissions.canRead) return this.backToCompanySettings();
    this.createFormControls();
    this.createFormGroup();
    this.loadFacilityData();
    this.readonlyMode$.pipe(takeUntil(this.destroy$)).subscribe(value => {
      value ? this.description.disable({ emitEvent: false }) : this.description.enable({ emitEvent: false });
    });
  }
  public ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.unsubscribe();
  }

  public archiveFacility(): void {
    this.dialog
      .open(DialogModalComponent, {
        width: '450px',
        disableClose: true,
        data: {
          type: DialogType.Confirm,
          content: 'Are you sure you want to archive the facility?'
        }
      })
      .afterClosed()
      .subscribe((isConfirmed: boolean) => {
        if (isConfirmed) {
          this.facilitiesService
            .toggleFacilityArchive(this.facilityId, true)
            .pipe(takeUntil(this.destroy$))
            .subscribe(data => {
              this.facility = data;
              this.notificationHelperService.showSuccess('Facility successfully archived');
            });
        }
      });
  }

  public unarchiveFacility(): void {
    this.facilitiesService
      .toggleFacilityArchive(this.facilityId, false)
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        this.facility = data;
        this.notificationHelperService.showSuccess('Facility successfully unarchived');
      });
  }

  public cancel(): void {
    this.setReadOnlyStatus(true);
    this.setInitialData(this.facility);
  }

  public editFacility(): void {
    this.setReadOnlyStatus(false);
  }

  public updateFacility(): void {
    if (this.form.invalid) {
      this.notificationHelperService.showValidation('Make sure to fill all required fields');
      return FormGroupHelper.markTouchedAndDirty(this.form);
    }
    const payload = this.getFacilityUpdatePayload();
    if (ObjectUtil.isEmptyObject(payload)) return this.readonlyMode$.next(true);
    this.facilitiesService
      .updateFacility(this.facilityId, payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: FacilityEntity) => {
        this.facility = data;
        this.notificationHelperService.showSuccess('Facility successfully updated');
        this.readonlyMode$.next(true);
        FormGroupHelper.markUntouchedAndPristine(this.form);
      });
  }

  public backToCompanySettings(): void {
    this.navigationHelperService.navigateCompanySettings(CompanySettingsExpandableSection.Facilities);
  }

  public setReadOnlyStatus(value: boolean): void {
    this.readonlyMode$.next(value);
  }
  private createFormGroup(): void {
    this.form = new FormGroup({
      description: this.description
    });
  }
  private createFormControls(): void {
    this.description = new FormControl('', [Validators.required, Validators.maxLength(100)]);
  }
  private setInitialData(facilityData: FacilityEntity): void {
    this.description.setValue(facilityData.description);
  }

  private getFacilityUpdatePayload(): any {
    const payload = FormGroupHelper.getChangedValues(this.form.controls.facility.value, this.facility);
    if (this.form.controls.description.value !== this.facility.description)
      payload.description = this.form.value.description;
    return payload;
  }

  private setFacilityPermissions(): void {
    const permissions = Environment.getCurrentUser().normalizedAccessControlRoles.FACILITY.facilitySection.sectionGroup;
    this.facilityPermissions = {
      canRead: permissions.read.value === AccessControlScope.Company,
      canDelete: permissions.delete.value === AccessControlScope.Company,
      canUpdate: permissions.update.value === AccessControlScope.Company
    };
  }
  private loadFacilityData(): void {
    this.facilitiesService
      .getUserFacilityById(this.facilityId)
      .pipe(
        catchError(() => {
          this.backToCompanySettings();
          this.notificationHelperService.showValidation(
            'Something unexpected happened. Probably You have tried to access a non existing facility'
          );
          throw EMPTY;
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(data => {
        this.facility = data;
        this.setInitialData(this.facility);
      });
  }
}
