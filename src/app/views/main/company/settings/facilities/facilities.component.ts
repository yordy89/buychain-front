import { Component, OnDestroy, OnInit } from '@angular/core';
import { first } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { NavigationHelperService } from '@services/helpers/navigation-helper/navigation-helper.service';
import { AddFacilityModalComponent } from '@views/main/company/settings/facilities/add-facility-modal/add-facility-modal.component';
import { FacilityEntity } from '@services/app-layer/entities/facility';
import { Subject } from 'rxjs';
import { AccessControlScope } from '@services/app-layer/permission/permission.interface';
import { FacilitiesService } from '@app/services/app-layer/facilities/facilities.service';
import { Environment } from '@services/app-layer/app-layer.environment';

enum Actions {
  VIEW
}

@Component({
  selector: 'app-facilities',
  templateUrl: './facilities.component.html',
  styleUrls: ['./facilities.component.scss']
})
export class FacilitiesComponent implements OnInit, OnDestroy {
  public facilitiesSummary: FacilityEntity[];
  public facilitiesCompleteSummary: FacilityEntity[];
  public facilitiesActiveSummary: FacilityEntity[];
  permissions = { canRead: false, canCreate: false };
  public actions: any[];
  private destroy$ = new Subject<void>();

  public sorted: {
    by: string;
    isAscending: boolean;
  };

  constructor(
    private dialog: MatDialog,
    private facilitiesService: FacilitiesService,
    private navigationHelperService: NavigationHelperService
  ) {}

  ngOnInit() {
    this.initPermissions();
    this.initFacilityActions();
    this.loadFacilities();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.unsubscribe();
  }

  sort(key: string): void {
    if (this.sorted && this.sorted.by === key) {
      this.sorted.isAscending = !this.sorted.isAscending;
      this.facilitiesSummary.reverse();
    } else {
      this.sorted = {
        by: key,
        isAscending: true
      };
      this.facilitiesSummary.sort((a, b) => {
        const value1 = a[key].toLowerCase();
        const value2 = b[key].toLowerCase();
        return value1 > value2 ? 1 : -1;
      });
    }
  }
  showInactiveSwitch(e): void {
    this.facilitiesSummary = e.checked ? this.facilitiesCompleteSummary : this.facilitiesActiveSummary;
  }

  addNewFacility(): void {
    this.dialog
      .open(AddFacilityModalComponent, {
        width: '550px',
        disableClose: true,
        data: this.facilitiesCompleteSummary
      })
      .afterClosed()
      .pipe(first())
      .subscribe((facilityData: FacilityEntity) => {
        if (facilityData) this.openFacilityDetails(facilityData.id);
      });
  }

  openFacilityDetails(facilityId: string): void {
    this.navigationHelperService.navigateCompanyFacilityDetails(facilityId);
  }

  onTableAction(value: Actions, item: FacilityEntity) {
    if (value === Actions.VIEW) {
      this.openFacilityDetails(item.id);
    }
  }

  private initPermissions(): void {
    const user = Environment.getCurrentUser();
    const facilityPermissions = user.normalizedAccessControlRoles.FACILITY.facilitySection.sectionGroup;
    this.permissions.canRead = facilityPermissions.read.value === AccessControlScope.Company;
    this.permissions.canCreate =
      this.permissions.canRead && facilityPermissions.create.value === AccessControlScope.Company;
  }

  private initFacilityActions(): void {
    this.actions = [
      {
        label: 'View',
        icon: 'visibility',
        value: Actions.VIEW,
        isHidden: !this.permissions.canRead
      }
    ];
  }

  private loadFacilities(): void {
    this.facilitiesService.getCompanyFacilitiesAll(Environment.getCurrentUser().companyId).subscribe(facilities => {
      this.facilitiesCompleteSummary = facilities;
      this.facilitiesActiveSummary = facilities.filter(f => !f.archived);
      this.facilitiesSummary = this.facilitiesActiveSummary;
    });
  }
}
