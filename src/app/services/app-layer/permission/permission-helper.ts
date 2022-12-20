import { AccessControlProfile, AccessControlSystem } from '@services/app-layer/permission/permission.interface';
import { permissionProfilesList } from './permission.service';
import { SampleAccessControl } from '@services/app-layer/permission/sample-access-role-object';
import { ObjectUtil } from '@services/helpers/utils/object-util';

export class PermissionHelper {
  static getUserAccessControlProfile(accessSystem): AccessControlProfile {
    const userAccessProfile = permissionProfilesList.find(profileUnit =>
      ObjectUtil.isDeepEquals(accessSystem, profileUnit.profile)
    );
    if (userAccessProfile) {
      return userAccessProfile.label;
    } else {
      return AccessControlProfile.Custom;
    }
  }

  static normalizeAccessControlsFromApi(accessControlRoles: any): AccessControlSystem {
    const normalObject = JSON.parse(JSON.stringify(SampleAccessControl));
    this.normalizeSection(normalObject, accessControlRoles, 'COMPANY');
    this.normalizeSection(normalObject, accessControlRoles, 'FACILITY');
    this.normalizeSection(normalObject, accessControlRoles, 'RATE_TABLE');
    this.normalizeSection(normalObject, accessControlRoles, 'LABEL');
    this.normalizeSection(normalObject, accessControlRoles, 'GROUP');
    this.normalizeSection(normalObject, accessControlRoles, 'PRODUCT');
    this.normalizeSection(normalObject, accessControlRoles, 'TRANSACTION');
    this.normalizeSection(normalObject, accessControlRoles, 'CRM_ACCOUNT');
    this.normalizeSection(normalObject, accessControlRoles, 'ACCOUNT');
    this.normalizeSection(normalObject, accessControlRoles, 'DIMENSION');
    this.normalizeSection(normalObject, accessControlRoles, 'JOURNAL_ENTRY');
    this.normalizeSection(normalObject, accessControlRoles, 'INVOICE');
    this.normalizeSection(normalObject, accessControlRoles, 'SALES_ORDER');
    this.normalizeSection(normalObject, accessControlRoles, 'PURCHASE_ORDER');
    this.normalizeSection(normalObject, accessControlRoles, 'BILL');
    return normalObject;
  }

  static normalizeSection(y: AccessControlSystem, accessControlRoles: any, section: string): void {
    if (!accessControlRoles[section]) return;
    Object.keys(y[section]).forEach(key => {
      Object.keys(y[section][key].sectionGroup).forEach(role => {
        y[section][key].sectionAllowedValues.sort((a, b) => {
          // Sort access control scope values in a specific way
          const value1 = a.order;
          const value2 = b.order;
          return value1 - value2;
        });
        y[section][key].sectionGroup[role] = {
          ...y[section][key].sectionGroup[role],
          value:
            accessControlRoles[section][
              Object.keys(accessControlRoles[section]).find(unit =>
                y[section][key].sectionGroup[role].groupUnits.some(item => item === unit)
              )
            ] || y[section][key].sectionGroup[role].value
        };
      });
    });
  }
}
