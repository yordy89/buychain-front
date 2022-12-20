import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { PermissionHelper } from '@services/app-layer/permission/permission-helper';
import {
  AccessControlGroup,
  AccessControlScope,
  AccessControlSection
} from '@services/app-layer/permission/permission.interface';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PermissionService } from '@services/app-layer/permission/permission.service';
import { NotificationHelperService } from '@services/helpers/notification-helper/notification-helper.service';
import { User } from '@services/app-layer/entities/user';

interface ExtendedAccessControlGroup {
  key: string;
  object: AccessControlGroup;
}

@Component({
  selector: 'app-access-control-section',
  templateUrl: './access-control-section.component.html',
  styleUrls: ['./access-control-section.component.scss']
})
export class AccessControlSectionComponent implements OnInit, OnDestroy {
  @Input() userData: User;
  @Input() accessControlSection: AccessControlSection;
  @Input() sectionName: string;
  @Input() disabledMode: boolean;
  @Output() update = new EventEmitter();

  public accessFunctions: ExtendedAccessControlGroup[];
  public limitedScope = false;
  public limitedScopeValues = ['Denied', 'Allowed'];

  private destroy$ = new Subject<void>();

  constructor(
    private permissionService: PermissionService,
    private notificationHelperService: NotificationHelperService
  ) {}

  ngOnInit() {
    this.accessFunctions = Object.keys(this.accessControlSection.sectionGroup)
      .map(k => ({ key: k, object: this.accessControlSection.sectionGroup[k] }))
      .sort((a, b) => {
        const value1 = a.object.orderNumber;
        const value2 = b.object.orderNumber;
        return value1 - value2;
      });
    if (
      this.accessControlSection.sectionAllowedValues.length < 3 &&
      this.accessControlSection.sectionAllowedValues.some(item => item.value === AccessControlScope.None)
    )
      this.limitedScope = true;
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  public updateAccessControlRoles(access: AccessControlGroup, event): void {
    const payload = { [this.sectionName]: {} };

    const group = this.userData.normalizedAccessControlRoles[this.sectionName];

    Object.keys(group).forEach(sectionKey => {
      const section = group[sectionKey];
      Object.keys(section.sectionGroup).forEach(sectionGroupKey => {
        const sectionGroup = section.sectionGroup[sectionGroupKey];
        sectionGroup.groupUnits.forEach(unit => (payload[this.sectionName][unit] = sectionGroup.value));
      });
    });

    access.groupUnits.forEach(unit => (payload[this.sectionName][unit] = event.value));

    this.permissionService
      .updateCompanyMemberAccessControlRoles(this.userData.companyId, this.userData.id, payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe(accessControlRoles => {
        this.userData.accessControlProfile = PermissionHelper.getUserAccessControlProfile(accessControlRoles);
        this.userData.normalizedAccessControlRoles =
          PermissionHelper.normalizeAccessControlsFromApi(accessControlRoles);
        this.notificationHelperService.showSuccess('User Roles are successfully updated');
        this.update.emit();
      });
  }

  public isPublic(): boolean {
    return this.accessControlSection.sectionAllowedValues.length === 1;
  }
  public isLimitedOwner(): boolean {
    return (
      this.accessControlSection.sectionAllowedValues.length === 2 &&
      this.accessControlSection.sectionAllowedValues.some(item => item.value === AccessControlScope.Owner)
    );
  }
}
