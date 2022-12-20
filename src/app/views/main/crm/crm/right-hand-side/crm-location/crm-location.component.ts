import { Component, Input, OnDestroy } from '@angular/core';
import { CrmStateService } from '@views/main/crm/crm/crm-state.service';
import { BehaviorSubject, Subject } from 'rxjs';
import { FormGroup } from '@angular/forms';
import { NotificationHelperService } from '@services/helpers/notification-helper/notification-helper.service';
import { FormGroupHelper } from '@services/helpers/utils/form-group-helper';
import { takeUntil } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { UnlinkedCrmLocationModalComponent } from '@views/main/crm/crm/right-hand-side/crm-location/unlinked-crm-location-modal/unlinked-crm-location-modal.component';
import { LinkedCrmLocationModalComponent } from '@views/main/crm/crm/right-hand-side/crm-location/linked-crm-location-modal/linked-crm-location-modal.component';
import { ObjectUtil } from '@services/helpers/utils/object-util';
import { AccessControlScope } from '@services/app-layer/permission/permission.interface';
import { Environment } from '@services/app-layer/app-layer.environment';
import { CrmAccountEntity, CrmLocationEntity } from '@services/app-layer/entities/crm';
import { CrmComponentService } from '@views/main/crm/crm/crm.component.service';
import { CrmTypeEnum, LabelKey, LabelGroupName } from '@services/app-layer/app-layer.enums';

@Component({
  selector: 'app-crm-location',
  templateUrl: './crm-location.component.html',
  styleUrls: ['../common/right-hand-side.common.scss', './crm-location.component.scss']
})
export class CrmLocationComponent implements OnDestroy {
  private _crmAccountData: CrmAccountEntity;
  @Input() get crmAccountData(): CrmAccountEntity {
    return this._crmAccountData;
  }
  set crmAccountData(value: CrmAccountEntity) {
    this._crmAccountData = value;
    if (value) this.setUserPermissions();
  }
  private _crmLocationData: CrmLocationEntity;
  @Input() get crmLocationData(): CrmLocationEntity {
    return this._crmLocationData;
  }
  set crmLocationData(value: CrmLocationEntity) {
    this._crmLocationData = value;
    this.tabIndex = 0;
    this.setReadOnlyStatus(!!value);
  }

  public tabIndex = 0;
  public crmPermissions = { canReadSalesInfo: false, canUpdate: false };
  public LabelKey = LabelKey;
  public CRMType = CrmTypeEnum;
  public LabelGroupName = LabelGroupName;
  public isOnlyOffline = Environment.isOnlyOffline();

  public readonlyMode$: BehaviorSubject<boolean> = new BehaviorSubject(true);
  public form: FormGroup;

  private destroy$ = new Subject<void>();

  constructor(
    private notificationHelperService: NotificationHelperService,
    private crmComponentService: CrmComponentService,
    private dialog: MatDialog,
    public crmStateService: CrmStateService
  ) {
    this.createForm();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  public edit(): void {
    this.setReadOnlyStatus(false);
  }
  public cancel(): void {
    if (this.crmLocationData) this.setReadOnlyStatus(true);
    else this.close();
  }
  public close(): void {
    this.crmStateService.setActiveEntity(this.crmAccountData);
  }

  public async createUpdateCRMLocation() {
    if (this.form.invalid) return FormGroupHelper.markTouchedAndDirty(this.form);
    this.crmLocationData ? this.updateCRMLocation() : this.createCRMLocation();
  }

  public openLinkedCrmLocationModal(location?: CrmLocationEntity): void {
    this.dialog
      .open(LinkedCrmLocationModalComponent, {
        width: '648px',
        disableClose: true,
        data: location || this.crmLocationData
      })
      .afterClosed()
      .subscribe(data => {
        if (data) {
          this.crmStateService.updateActiveLocation(data);
        }
      });
  }

  public openUnlinkedCrmLocationModal(): void {
    this.dialog
      .open(UnlinkedCrmLocationModalComponent, {
        width: '648px',
        disableClose: true,
        data: this.crmLocationData
      })
      .afterClosed()
      .subscribe(data => {
        if (data) {
          this.crmStateService.updateActiveLocation(data);
          this.openLinkedCrmLocationModal(data);
        }
      });
  }

  /*
   * private helpers
   * */

  private updateCRMLocation(): void {
    const payload = FormGroupHelper.getChangedValues(this.form.controls.facility.value, this.crmLocationData);
    Object.keys(payload).forEach(key => (payload[key] = payload[key] || null));

    // TODO enhance after get change values refactored;
    const form = this.form.controls.facility['controls'];
    if (form.state.value !== this.crmAccountData.state) payload.state = form.state.value || null;
    if (form.city.value !== this.crmAccountData.city) payload.city = form.city.value || null;
    if (form.zipCode.value !== this.crmAccountData.zipCode) payload.zipCode = form.zipCode.value || null;

    if (ObjectUtil.isEmptyObject(payload)) return this.setReadOnlyStatus(true);
    this.crmComponentService
      .updateLocation(this.crmLocationData, payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        this.crmStateService.updateActiveLocation(data);
        this.notificationHelperService.showSuccess('CRM Location was successfully updated');
        FormGroupHelper.markUntouchedAndPristine(this.form);
        this.setReadOnlyStatus(true);
      });
  }

  private createCRMLocation(): void {
    const payload = ObjectUtil.deleteEmptyProperties(this.form.controls.facility.value);

    this.crmComponentService
      .createLocation(this.crmAccountData, payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        this.notificationHelperService.showSuccess('CRM Location was successfully created');
        this.crmStateService.addLocation(data);
        this.crmStateService.setActiveEntity(data);
        FormGroupHelper.markUntouchedAndPristine(this.form);
        this.setReadOnlyStatus(true);
      });
  }

  private createForm(): void {
    this.form = new FormGroup({});
  }

  private setReadOnlyStatus(value: boolean): void {
    this.readonlyMode$.next(value);
  }

  private setUserPermissions(): void {
    const user = Environment.getCurrentUser();
    this.crmPermissions = {
      canReadSalesInfo:
        user.normalizedAccessControlRoles.CRM_ACCOUNT.CRMSection.sectionGroup.readSalesInfo.value ===
          AccessControlScope.Company ||
        (user.normalizedAccessControlRoles.CRM_ACCOUNT.CRMSection.sectionGroup.readSalesInfo.value ===
          AccessControlScope.Owner &&
          this.crmAccountData.salesTeam.some(seller => seller === user.id)),
      canUpdate:
        user.normalizedAccessControlRoles.CRM_ACCOUNT.CRMSection.sectionGroup.updateEntry.value ===
          AccessControlScope.Company ||
        (user.normalizedAccessControlRoles.CRM_ACCOUNT.CRMSection.sectionGroup.updateEntry.value ===
          AccessControlScope.Owner &&
          this.crmAccountData.salesTeam.some(seller => seller === user.id))
    };
  }
}
