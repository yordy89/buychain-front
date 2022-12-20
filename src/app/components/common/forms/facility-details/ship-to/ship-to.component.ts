import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { TableAction } from '@app/models';
import { Observable, Subject } from 'rxjs';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { NotificationHelperService } from '@services/helpers/notification-helper/notification-helper.service';
import { FormGroupHelper } from '@services/helpers/utils/form-group-helper';
import { AddTransportMethodModalComponent } from '@components/common/forms/facility-details/add-transport-method-modal/add-transport-method-modal.component';
import { AccessControlScope } from '@services/app-layer/permission/permission.interface';
import { ObjectUtil } from '@services/helpers/utils/object-util';
import { FacilitiesService } from '@app/services/app-layer/facilities/facilities.service';
import {
  FacilityEntity,
  FacilityPersonnelType,
  TransportMethodEntity,
  TransportMethodType
} from '@app/services/app-layer/entities/facility';
import { Environment } from '@services/app-layer/app-layer.environment';
import { takeUntil } from 'rxjs/operators';

enum Actions {
  DELETE
}

@Component({
  selector: 'app-ship-to',
  templateUrl: './ship-to.component.html',
  styleUrls: ['../common/ship.common.scss', './ship-to.component.scss']
})
export class ShipToComponent implements OnInit, OnDestroy {
  @Input() facility: FacilityEntity;
  @Input() isCrm = false;

  public disabledMode = true;
  public facilityPermissions = { canUpdate: false, canDelete: false };

  public form: FormGroup;
  public receivingHours: FormControl;
  public receivingNotes: FormControl;
  public FacilityPersonnelType = FacilityPersonnelType;
  public transportMethods: any[];

  public rails: TransportMethodEntity[] = [];

  public isRailRestrictionOpen = false;
  readonly tableActions: TableAction[] = [
    {
      label: 'Delete',
      icon: 'delete',
      color: 'warn',
      value: Actions.DELETE,
      prompt: {
        title: 'Confirm please!',
        text: 'Are you sure you want to delete Rail Carrier?'
      }
    }
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private dialog: MatDialog,
    private facilitiesService: FacilitiesService,
    private notificationHelperService: NotificationHelperService
  ) {}

  ngOnInit() {
    this.setUserPermissions();
    this.createFormControls();
    this.createForm();
    this.setInitialData(this.facility);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  public edit(): void {
    this.disabledMode = false;
  }
  public done(): void {
    if (this.form.invalid) return FormGroupHelper.markTouchedAndDirty(this.form);
    const payload = FormGroupHelper.getChangedValues(this.form.value, this.facility);
    if (ObjectUtil.isEmptyObject(payload)) {
      this.disabledMode = true;
      return;
    }
    this.facilitiesService
      .updateFacility(this.facility.id, payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: FacilityEntity) => {
        this.facility = data;
        this.setInitialData(this.facility);
        this.notificationHelperService.showSuccess('Facility Ship-to section successfully updated');
        this.disabledMode = true;
        FormGroupHelper.markUntouchedAndPristine(this.form);
      });
  }

  public removeRailCarrier(rail: TransportMethodEntity): void {
    this.removeTransport(rail.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.facility.transportMethods = this.facility.transportMethods.filter(item => item.id !== rail.id);
        this.setInitialData(this.facility);
        this.notificationHelperService.showSuccess('Rail Carrier successfully deleted');
      });
  }

  public addRailCarrier(): void {
    this.dialog
      .open(AddTransportMethodModalComponent, {
        width: '40%',
        disableClose: true,
        data: this.facility.transportMethods
      })
      .afterClosed()
      .subscribe(data => {
        if (!data) return;
        this.addTransport(data)
          .pipe(takeUntil(this.destroy$))
          .subscribe(transport => {
            if (!this.facility.transportMethods.some(method => method.id === transport.id))
              this.facility.transportMethods.push(transport);
            this.setInitialData(this.facility);
            this.notificationHelperService.showSuccess(`Rail Carrier successfully added`);
          });
      });
  }

  public toggleTruck(event: MatCheckboxChange, type: TransportMethodType): void {
    event.checked ? this.addTruck(type) : this.removeTruck(type);
  }

  onTableAction(value: Actions, item: TransportMethodEntity) {
    if (value === Actions.DELETE) {
      this.removeRailCarrier(item);
    }
  }

  /*
   * private helpers
   * */
  private createFormControls(): void {
    this.receivingHours = new FormControl('', [Validators.maxLength(1000)]);
    this.receivingNotes = new FormControl('', [Validators.maxLength(1000)]);
  }
  private createForm(): void {
    this.form = new FormGroup({
      receivingHours: this.receivingHours,
      receivingNotes: this.receivingNotes
    });
  }
  private setInitialData(facility: FacilityEntity): void {
    this.receivingHours.setValue(facility.receivingHours);
    this.receivingNotes.setValue(facility.receivingNotes);

    this.setTransportMethods();
    this.setRails(this.facility.transportMethods);
  }
  public setTransportMethods(): void {
    this.transportMethods = ObjectUtil.enumToArray(TransportMethodType)
      .filter(item => item !== TransportMethodType.Rail)
      .map(t => ({
        value: t,
        isSelected: this.facility.transportMethods.some(
          (transportMethod: TransportMethodEntity) => transportMethod.type === t
        )
      }));
  }

  private setUserPermissions(): void {
    const currentUser = Environment.getCurrentUser().normalizedAccessControlRoles.FACILITY.facilitySection.sectionGroup;
    this.facilityPermissions.canUpdate = currentUser.update.value === AccessControlScope.Company && !this.isCrm;
    this.facilityPermissions.canDelete = currentUser.delete.value === AccessControlScope.Company && !this.isCrm;
  }

  private removeTruck(type: TransportMethodType): void {
    const truck = this.facility.transportMethods.find((item: TransportMethodEntity) => item.type === type);
    if (truck) {
      this.removeTransport(truck.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          this.facility.transportMethods = this.facility.transportMethods.filter(item => item.id !== truck.id);
          this.setInitialData(this.facility);
          this.notificationHelperService.showSuccess(`Truck ${type} is successfully removed`);
        });
    }
  }
  private addTruck(type: TransportMethodType): void {
    this.addTransport({ type })
      .pipe(takeUntil(this.destroy$))
      .subscribe((transport: TransportMethodEntity) => {
        if (!this.facility.transportMethods.some(method => method.id === transport.id))
          this.facility.transportMethods.push(transport);
        this.setInitialData(this.facility);
        this.notificationHelperService.showSuccess(`Truck ${type} is successfully added`);
      });
  }
  private removeTransport(id: string): Observable<void> {
    return this.facilitiesService.deleteFacilityTransportMethod(this.facility.id, id).pipe();
  }
  private addTransport(data: any): Observable<TransportMethodEntity> {
    return this.facilitiesService.createFacilityTransportMethod(this.facility.id, data).pipe();
  }
  private setRails(data: TransportMethodEntity[]): void {
    this.rails = data.filter(
      (transportMethod: TransportMethodEntity) => transportMethod.type === TransportMethodType.Rail
    );
    if (this.rails.length > 1) this.isRailRestrictionOpen = true;
  }
}
