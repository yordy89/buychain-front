import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { first, takeUntil } from 'rxjs/operators';
import { UserService } from '@app/services/app-layer/user/user.service';
import { NavigationHelperService } from '@services/helpers/navigation-helper/navigation-helper.service';
import { AccessControlScope } from '@services/app-layer/permission/permission.interface';
import { Environment } from '@services/app-layer/app-layer.environment';
import { CompaniesService } from '@services/app-layer/companies/companies.service';
import {
  CompanyPendingMembers,
  CompanyPendingMembersInner
} from '@app/services/data-layer/http-api/base-api/swagger-gen';
import { MemberEntity } from '@services/app-layer/entities/member';
import { User } from '@app/services/app-layer/entities/user';
import { AccountState } from '@app/services/app-layer/app-layer.enums';

enum Actions {
  VIEW
}
@Component({
  selector: 'app-manage-users',
  templateUrl: './manage-users.component.html',
  styleUrls: ['./manage-users.component.scss']
})
export class ManageUsersComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  public pendingMembersList: CompanyPendingMembers;
  public membersList: MemberEntity[];
  public currentUser: User;
  public memberManagementPermissions = {
    canUpdatePendingMembers: false,
    canReadMemberDetails: false
  };
  public actions: { onSave: () => void };
  public sorted: {
    by: string;
    isAscending: boolean;
  };
  public accountStatesList: {
    name: AccountState;
    isSelected: boolean;
  }[];
  public filteredMemberList: MemberEntity[];

  readonly tableActions = [
    {
      label: 'View',
      icon: 'visibility',
      value: Actions.VIEW
    }
  ];

  constructor(
    private navigationHelperService: NavigationHelperService,
    private companiesService: CompaniesService,
    private userService: UserService
  ) {}

  ngOnInit() {
    this.currentUser = Environment.getCurrentUser();
    this.setUserPermissions();
    this.actions = { onSave: () => this.setCompanyMembers() };

    this.setCompanyMembers();
    if (this.memberManagementPermissions.canUpdatePendingMembers) this.setCompanyPendingMembers();

    this.accountStatesList = this.userService.getUserAccountStatesList().map(item => ({
      name: item,
      isSelected: true
    }));
  }

  public ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.unsubscribe();
  }

  public sort(key: string): void {
    if (this.sorted && this.sorted.by === key) {
      this.sorted.isAscending = !this.sorted.isAscending;
      this.filteredMemberList.reverse();
    } else {
      this.sorted = {
        by: key,
        isAscending: true
      };
      this.filteredMemberList.sort((a, b) => {
        const value1 = a[key].toLowerCase();
        const value2 = b[key].toLowerCase();
        return value1 > value2 ? 1 : -1;
      });
    }
  }

  public openMemberDetails(memberId: string): void {
    this.navigationHelperService.navigateCompanyMemberDetails(memberId);
  }

  public approvePendingMember(pendingMember: CompanyPendingMembersInner, status: boolean): void {
    const load = status
      ? this.companiesService.approveCompanyPendingMember(this.currentUser.companyId, pendingMember.id)
      : this.companiesService.disapproveCompanyPendingMember(this.currentUser.companyId, pendingMember.id);
    load.pipe(first(), takeUntil(this.destroy$)).subscribe(() => {
      this.setCompanyMembers();
      this.setCompanyPendingMembers();
    });
  }

  onTableAction(value: Actions, item: MemberEntity) {
    if (value === Actions.VIEW) {
      this.openMemberDetails(item.id);
    }
  }

  /*
   * private helpers
   * */

  private setUserPermissions(): void {
    const userSectionRoles = this.currentUser.normalizedAccessControlRoles.COMPANY.userSection.sectionGroup;
    const companySectionRoles = this.currentUser.normalizedAccessControlRoles.COMPANY.companySection.sectionGroup;
    this.memberManagementPermissions.canReadMemberDetails =
      userSectionRoles.readUserDetails.value === AccessControlScope.Company;
    this.memberManagementPermissions.canUpdatePendingMembers =
      companySectionRoles.updatePendingUsers.value === AccessControlScope.Company;
  }

  private setCompanyMembers(): void {
    this.companiesService
      .getCompanyMembers()
      .pipe(takeUntil(this.destroy$))
      .subscribe(members => {
        this.membersList = this.addDefaults(members);
        this.filteredMemberList = this.membersList;
      });
  }

  private setCompanyPendingMembers(): void {
    this.companiesService
      .getCompanyPendingMembers()
      .pipe(takeUntil(this.destroy$))
      .subscribe(pendingMembers => {
        this.pendingMembersList = pendingMembers;
      });
  }

  private addDefaults(members: MemberEntity[]): MemberEntity[] {
    return members.map(member => {
      member.firstName = member.firstName || 'Unknown';
      member.lastName = member.lastName || 'Unknown';
      return member;
    });
  }
}
