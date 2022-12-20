import { UserPermissions } from '@services/data-layer/http-api/base-api/swagger-gen';
import {
  SystemRoles,
  AccountState,
  ProfileCompletionState,
  ProductsOfInterest,
  PrivacySettings
} from '../app-layer.enums';
import { AccessControlSystem, AccessControlProfile } from '@app/services/app-layer/permission/permission.interface';

export class User {
  id: string;
  username: string;
  systemRoles: SystemRoles[];
  accountState: AccountState;
  profileCompletionState: ProfileCompletionState;
  companyId: string;
  temporaryCompanyId: string;
  firstName: string;
  lastName: string;
  group: string;
  preferences: {
    ui: any;
  };
  normalizedPreferences: any;
  profilePictureUrl: string;
  productsOfInterest: ProductsOfInterest[];
  productsOfInterestIds: string[];
  title: string;
  callingCode: string;
  workPhone: string;
  createdAt: string;
  updatedAt: string;
  accessControlRoles: any;
  normalizedAccessControlRoles?: AccessControlSystem;
  accessControlProfile?: AccessControlProfile;
  privacySettings: PrivacySettings;
  permissions: UserPermissions;
}
