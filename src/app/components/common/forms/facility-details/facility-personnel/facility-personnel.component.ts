import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { TableAction } from '@app/models';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import {
  FacilityEntity,
  FacilityPersonnelType,
  FacilityPersonnelEntity
} from '@app/services/app-layer/entities/facility';
import { FacilitiesService } from '@app/services/app-layer/facilities/facilities.service';
import { NotificationHelperService } from '@services/helpers/notification-helper/notification-helper.service';
import { AddPersonnelModalComponent } from '@components/common/forms/facility-details/add-personnel-modal/add-personnel-modal.component';
import { CompaniesService } from '@services/app-layer/companies/companies.service';
import { MemberEntity } from '@services/app-layer/entities/member';
import { Environment } from '@services/app-layer/app-layer.environment';
import { AccessControlScope } from '@services/app-layer/permission/permission.interface';

enum Actions {
  DELETE
}

@Component({
  selector: 'app-facility-personnel',
  templateUrl: './facility-personnel.component.html'
})
export class FacilityPersonnelComponent implements OnInit, OnDestroy {
  @Input() facility: FacilityEntity;
  @Input() type: FacilityPersonnelType;
  @Input() disabled: boolean;
  public members: MemberEntity[];
  public facilityPersonnel: { name: string; description: string }[];
  public userPermission = { canDeletePersonnel: false };
  readonly actions: TableAction[] = [
    {
      label: 'Delete',
      icon: 'delete',
      color: 'warn',
      value: Actions.DELETE,
      prompt: {
        title: 'Confirm please!',
        text: 'Are you sure you want to delete Personnel?'
      }
    }
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private dialog: MatDialog,
    private facilitiesService: FacilitiesService,
    private companiesService: CompaniesService,
    private notificationHelperService: NotificationHelperService
  ) {}

  ngOnInit() {
    this.setAccessRoles();
    this.loadCompanyMembers();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  addPersonnel(): void {
    this.dialog
      .open(AddPersonnelModalComponent, {
        width: '40%',
        disableClose: true,
        data: { members: this.members, facility: this.facility, department: this.type }
      })
      .afterClosed()
      .subscribe(data => {
        if (!data) return;
        this.facility.personnel.push(data);
        this.setPersonnel(this.facility.personnel);
        this.notificationHelperService.showSuccess('Facility Personnel successfully added');
      });
  }

  removePersonnel(personnel): void {
    this.facilitiesService
      .deleteFacilityPersonnel(this.facility.id, personnel.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.facility.personnel = this.facility.personnel.filter(item => item.id !== personnel.id);
        this.setPersonnel(this.facility.personnel);
        this.notificationHelperService.showSuccess('Personnel successfully deleted');
      });
  }

  onTableAction(value: Actions, item) {
    if (value === Actions.DELETE) {
      this.removePersonnel(item);
    }
  }

  /*
   * Private Helpers
   * */
  private setPersonnel(data: FacilityPersonnelEntity[]): void {
    this.facilityPersonnel = data.reduce((acc, personnel: FacilityPersonnelEntity) => {
      if (personnel.department === this.type) {
        const user = this.members.find((member: MemberEntity) => member.id === personnel.userId);
        if (user) acc.push({ name: user.name, description: personnel.description, id: personnel.id });
      }
      return acc;
    }, []);
  }

  private loadCompanyMembers(): void {
    this.companiesService
      .getCompanyCompleteMembers()
      .pipe(takeUntil(this.destroy$))
      .subscribe((members: MemberEntity[]) => {
        this.members = members;
        this.setPersonnel(this.facility.personnel);
      });
  }

  private setAccessRoles(): void {
    const permissions = Environment.getCurrentUser().normalizedAccessControlRoles.FACILITY.facilitySection.sectionGroup;
    this.userPermission.canDeletePersonnel = permissions.delete.value === AccessControlScope.Company;
  }
}
