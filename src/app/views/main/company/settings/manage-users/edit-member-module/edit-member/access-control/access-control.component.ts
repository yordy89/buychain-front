import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { PermissionHelper } from '@services/app-layer/permission/permission-helper';
import {
  AccessControlProfile,
  AccessControlScope,
  AccessControlSystem,
  AccessControlData
} from '@services/app-layer/permission/permission.interface';
import { PermissionService } from '@services/app-layer/permission/permission.service';
import { takeUntil } from 'rxjs/operators';
import { UserService } from '@services/app-layer/user/user.service';
import { NotificationHelperService } from '@services/helpers/notification-helper/notification-helper.service';
import { ObjectUtil } from '@services/helpers/utils/object-util';
import { User } from '@services/app-layer/entities/user';
import { Subject } from 'rxjs';
import { Environment } from '@services/app-layer/app-layer.environment';

@Component({
  selector: 'app-access-control',
  templateUrl: './access-control.component.html',
  styleUrls: ['./access-control.component.scss']
})
export class AccessControlComponent implements OnInit, OnDestroy {
  @Input() userData: User;

  form: FormGroup;
  accessProfile: FormControl;
  currentUser: User;
  disabledMode = true;

  accessControlSystem: AccessControlSystem;
  accessControlProfiles: AccessControlData[];
  AccessControlProfile = AccessControlProfile;

  accountingEnabled: boolean;

  actions: { onUpdate: () => void };
  private destroy$ = new Subject<void>();

  constructor(
    public permissionService: PermissionService,
    public userService: UserService,
    public notificationHelperService: NotificationHelperService
  ) {
    this.accountingEnabled = Environment.isAccountingSupported();
    this.createForm();
  }

  ngOnInit() {
    this.loadAccessProfiles();

    this.currentUser = Environment.getCurrentUser();
    this.accessProfile.setValue(this.userData.accessControlProfile);
    this.accessControlSystem = ObjectUtil.getDeepCopy(this.userData.normalizedAccessControlRoles);

    if (this.userData.id === this.currentUser.id) {
      return;
    }

    const userSection = this.currentUser.normalizedAccessControlRoles.COMPANY.userSection.sectionGroup;
    if (userSection.updateRole.value === AccessControlScope.Company) {
      this.accessProfile.enable({ emitEvent: false });
      this.disabledMode = false;
    }

    this.handleAccessProfileValueChange();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.unsubscribe();
  }

  onUpdateSetAccessProfile(): void {
    this.accessProfile.setValue(this.userData.accessControlProfile, { emitEvent: false });
  }

  /*
   * private helpers
   * */

  private createForm(): void {
    this.accessProfile = new FormControl({ value: '', disabled: true });
    this.form = new FormGroup({
      accessProfile: this.accessProfile
    });
  }

  private loadAccessProfiles(): void {
    this.permissionService
      .getAccessControlProfiles()
      .pipe(takeUntil(this.destroy$))
      .subscribe(profiles => {
        this.accessControlProfiles = profiles;
      });
  }

  private handleAccessProfileValueChange(): void {
    this.accessProfile.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(value => {
      if (!value || value === AccessControlProfile.Custom) return;

      const body = this.accessControlProfiles.find(profile => profile.label === value).profile;
      this.updateAccessProfile(body);
    });
  }

  private updateAccessProfile(payload): void {
    this.permissionService
      .updateCompanyMemberAccessControlRoles(this.userData.companyId, this.userData.id, payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe(accessControlRoles => {
        this.userData.accessControlRoles = accessControlRoles;
        this.userData.normalizedAccessControlRoles =
          PermissionHelper.normalizeAccessControlsFromApi(accessControlRoles);
        this.accessControlSystem = ObjectUtil.getDeepCopy(this.userData.normalizedAccessControlRoles);
        this.notificationHelperService.showSuccess('The member access profile was successfully updated');
      });
  }
}
