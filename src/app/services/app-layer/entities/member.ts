import { PermissionHelper } from '@services/app-layer/permission/permission-helper';
import { AccessControlSystem } from '@services/app-layer/permission/permission.interface';
import { AccountState } from '../app-layer.enums';

export class MemberEntity {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  accessControlRoles: AccessControlSystem;
  accountState: AccountState;
  accessControlProfile?: string;
  name?: string;
  normalizedAccessControlRoles?: AccessControlSystem;
  title: string;
  callingCode: string;
  workPhone: string;
  profilePictureUrl: string;

  constructor(data) {
    Object.assign(this, data);
    this.name = data.firstName ? `${data.firstName} ${data.lastName}` : data.username;
    this.accessControlProfile = PermissionHelper.getUserAccessControlProfile(data.accessControlRoles);
    this.normalizedAccessControlRoles = PermissionHelper.normalizeAccessControlsFromApi(data.accessControlRoles);
  }
}
export class MemberSummaryEntity {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  profilePictureUrl: string;
  title: string;
  callingCode: string;
  workPhone: string;
  name?: string;

  constructor(data) {
    Object.assign(this, data);
    this.name = data.firstName ? `${data.firstName} ${data.lastName}` : data.username;
  }
}
