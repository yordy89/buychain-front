import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { AccessControlData, AccessControlProfile } from '@services/app-layer/permission/permission.interface';
import { User } from '@app/services/app-layer/entities/user';
import { environment as config } from '@env/environment';
import { HttpClient } from '@angular/common/http';
import { first, map } from 'rxjs/operators';
import { accessRolesDefaultProfile } from '@services/app-layer/permission/access-roles-default-profile';
import { accessRolesTraderProfile } from '@services/app-layer/permission/access-roles-trader-profile';
import { accessRolesBackOfficeProfile } from '@services/app-layer/permission/access-roles-back-office-profile';
import { accessRolesFinanceProfile } from '@services/app-layer/permission/access-roles-finance-profile';
import { accessRolesManagerProfile } from '@services/app-layer/permission/access-roles-manager-profile';
import { accessRolesLogisticsProfile } from '@services/app-layer/permission/access-roles-logistics-profile';
import { accessRolesSuperProfile } from '@services/app-layer/permission/access-roles-super-prifile';

export const permissionProfilesList = [
  {
    label: AccessControlProfile.Default,
    name: 'Default - Read Only',
    description:
      'Minimum set of permissions, no visibility outside of resources they own. Mostly Read-Only. Suitable for newly created accounts only',
    profile: accessRolesDefaultProfile
  },
  {
    label: AccessControlProfile.Trader,
    name: 'Trader',
    description:
      'Read/Write/Create controls for most objects they own, such as Transactions and Orders. Limited view of objects belonging to others',
    profile: accessRolesTraderProfile
  },
  {
    label: AccessControlProfile.BackOffice,
    name: 'Back-Office',
    description: 'Visibility across the Company. Limited editability for transactions and orders',
    profile: accessRolesBackOfficeProfile
  },
  {
    label: AccessControlProfile.Finance,
    name: 'Finance',
    description:
      'Most of the roles of Back office plus ability to manipulate product and inventory cost bases and aging data.' +
      ' They are the only one with this capability without defining custom rules',
    profile: accessRolesFinanceProfile
  },
  {
    label: AccessControlProfile.Manager,
    name: 'Manager',
    description:
      'Most of the permissions of Traders and Back office. Additionally has administration capabilities ' +
      'like the ability to edit and add functions to individual users and approve new users in the system',
    profile: accessRolesManagerProfile
  },
  {
    label: AccessControlProfile.Logistics,
    name: 'Logistics',
    description:
      'Suitable for warehouse or logistics personnel. Readonly access across the company.' +
      ' Ability to add notes and milestones to transactions',
    profile: accessRolesLogisticsProfile
  },
  {
    label: AccessControlProfile.Custom,
    name: 'Custom - Advanced settings',
    description: 'The profile allows the user to create a custom set of permissions',
    profile: {}
  },
  {
    label: AccessControlProfile.All,
    name: 'All (Temporary)',
    description: 'Everything is allowed',
    profile: accessRolesSuperProfile
  }
];

@Injectable({ providedIn: 'root' })
export class PermissionService {
  private baseApiUrl = config.baseUrl();

  constructor(private http: HttpClient) {}

  public getAccessControlProfiles(): Observable<AccessControlData[]> {
    return of(permissionProfilesList);
  }

  public updateCompanyMemberAccessControlRoles(companyId: string, memberId: string, body): Observable<User> {
    return this.http
      .patch(`${this.baseApiUrl}/companies/${companyId}/members/${memberId}/access-control-roles`, body)
      .pipe(
        first(),
        map(data => data as any)
      );
  }
}
