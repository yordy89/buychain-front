import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AddGroupModalComponent } from '@views/main/company/settings/groups/add-group-modal/add-group-modal.component';
import { GroupsService } from '@services/app-layer/groups/groups.service';
import { GroupEntity } from '@services/app-layer/entities/group';
import { NavigationHelperService } from '@services/helpers/navigation-helper/navigation-helper.service';
import { Environment } from '@services/app-layer/app-layer.environment';
import { AccessControlScope } from '@services/app-layer/permission/permission.interface';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

enum Actions {
  VIEW
}

@Component({
  selector: 'app-groups',
  templateUrl: './groups.component.html',
  styleUrls: ['./groups.component.scss']
})
export class GroupsComponent implements OnInit, OnDestroy {
  public groupsList: GroupEntity[];
  public groupsCompleteList: GroupEntity[];
  public groupsActiveList: GroupEntity[];
  public userPermissions = { canRead: false, canCreate: false };
  readonly actions = [
    {
      label: 'View',
      icon: 'visibility',
      value: Actions.VIEW
    }
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private dialog: MatDialog,
    private navigationHelperService: NavigationHelperService,
    private groupsService: GroupsService
  ) {}

  ngOnInit(): void {
    this.setUserPermissions();
    if (this.userPermissions.canRead) this.loadGroups();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  public createGroup(): void {
    this.dialog
      .open(AddGroupModalComponent, {
        width: '648px',
        disableClose: true,
        data: this.groupsActiveList
      })
      .afterClosed()
      .subscribe(data => {
        if (!data || !data.id) return;
        this.navigationHelperService.navigateCompanyGroupDetails(data.id);
      });
  }

  showInactiveSwitch(e): void {
    this.groupsList = e.checked ? this.groupsCompleteList : this.groupsActiveList;
  }

  openGroupDetails(groupId): void {
    this.navigationHelperService.navigateCompanyGroupDetails(groupId);
  }

  onTableAction(value: Actions, item: GroupEntity) {
    if (value === Actions.VIEW) {
      this.openGroupDetails(item.id);
    }
  }

  private loadGroups(): void {
    this.groupsService
      .getCompanyGroups()
      .pipe(takeUntil(this.destroy$))
      .subscribe(groupsList => {
        this.groupsCompleteList = groupsList;
        this.groupsActiveList = groupsList.filter(item => !item.archived);
        this.groupsList = this.groupsActiveList;
      });
  }

  private setUserPermissions(): void {
    const currentUser = Environment.getCurrentUser();
    const groupPermissions = currentUser.normalizedAccessControlRoles.GROUP.groupSection.sectionGroup;
    this.userPermissions.canRead = groupPermissions.read.value === AccessControlScope.Company;
    this.userPermissions.canCreate =
      this.userPermissions.canRead && groupPermissions.create.value === AccessControlScope.Company;
  }
}
