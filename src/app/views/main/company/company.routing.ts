import { Routes } from '@angular/router';
import { SettingsComponent } from '@views/main/company/settings/settings.component';

export const companyRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        redirectTo: 'settings',
        pathMatch: 'full'
      },
      {
        path: 'settings',
        component: SettingsComponent,
        data: { title: 'Company Settings', breadcrumb: 'SETTINGS' }
      },
      {
        path: 'settings/rate-tables/:rateTableId',
        data: { title: 'Company Rate Table Entries', breadcrumb: 'RATE_TABLE' },
        loadChildren: () =>
          import('./settings/rate-tables/rate-table-entries-module/rate-table-entries.module').then(
            l => l.RateTableEntriesModule
          )
      },
      {
        path: 'settings/rate-tables',
        redirectTo: 'settings'
      },
      {
        path: 'settings/facilities/:facilityId',
        data: { title: 'Company Facility Details', breadcrumb: 'FACILITY' },
        loadChildren: () =>
          import('./settings/facilities/facility-details-module/facility-details.module').then(
            l => l.FacilityDetailsModule
          )
      },
      {
        path: 'settings/facilities',
        redirectTo: 'settings'
      },
      {
        path: 'settings/members/:memberId',
        data: { title: 'Company Member Details', breadcrumb: 'Member' },
        loadChildren: () =>
          import('./settings/manage-users/edit-member-module/edit-member.module').then(l => l.EditMemberModule)
      },
      {
        path: 'settings/members',
        redirectTo: 'settings'
      },
      {
        path: 'settings/groups/:groupId',
        data: { title: 'Company Group Details', breadcrumb: 'Group' },
        loadChildren: () =>
          import('./settings/groups/group-details-module/group-details.module').then(l => l.GroupDetailsModule)
      },
      {
        path: 'settings/groups',
        redirectTo: 'settings'
      }
    ]
  }
];
