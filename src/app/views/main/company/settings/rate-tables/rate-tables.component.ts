import { Component, OnDestroy, OnInit } from '@angular/core';
import { TableAction } from '@app/models';
import { Subject } from 'rxjs';
import { first, takeUntil } from 'rxjs/operators';
import { RateTableService } from '@app/services/app-layer/rate-table/rate-table.service';
import { AddRateTableModalComponent } from '@views/main/company/settings/rate-tables/add-rate-table-modal/add-rate-table-modal.component';
import { MatDialog } from '@angular/material/dialog';
import { NotificationHelperService } from '@services/helpers/notification-helper/notification-helper.service';
import { NavigationHelperService } from '@services/helpers/navigation-helper/navigation-helper.service';
import { TypeCheck } from '@services/helpers/utils/type-check';
import { AccessControlScope } from '@app/services/app-layer/permission/permission.interface';
import { RateTable } from '@app/services/app-layer/entities/rate-table';
import { Environment } from '@services/app-layer/app-layer.environment';

enum Actions {
  VIEW,
  CLONE
}

@Component({
  selector: 'app-rate-tables',
  templateUrl: './rate-tables.component.html',
  styleUrls: ['./rate-tables.component.scss']
})
export class RateTablesComponent implements OnInit, OnDestroy {
  public rateTables: RateTable[];

  public AccessControlScope = AccessControlScope;
  public currentUser = {
    canAdd: false,
    canClone: false
  };

  public sorted: {
    by: string;
    isAscending: boolean;
  };

  actions: TableAction[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    private dialog: MatDialog,
    private rateTableService: RateTableService,
    private notificationHelperService: NotificationHelperService,
    private navigationHelperService: NavigationHelperService
  ) {}

  ngOnInit() {
    this.initPermissions();
    this.initTableActions();
    this.loadCompanyRateTables();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  initPermissions() {
    const user = Environment.getCurrentUser();
    this.currentUser.canAdd =
      user.normalizedAccessControlRoles.RATE_TABLE.rateTableSection.sectionGroup.update.value ===
      AccessControlScope.Company;
    this.currentUser.canClone =
      user.normalizedAccessControlRoles.RATE_TABLE.rateTableSection.sectionGroup.update.value ===
      AccessControlScope.Company;
  }

  public sort(key: string): void {
    if (this.sorted && this.sorted.by === key) {
      this.sorted.isAscending = !this.sorted.isAscending;
      this.rateTables.reverse();
    } else {
      this.sorted = {
        by: key,
        isAscending: true
      };
      this.rateTables.sort((a, b) => {
        const value1 = TypeCheck.isString(a[key]) ? a[key].toLowerCase() : a[key];
        const value2 = TypeCheck.isString(b[key]) ? b[key].toLowerCase() : b[key];
        return value1 > value2 ? 1 : -1;
      });
    }
  }

  public addNewRateTable(): void {
    this.dialog
      .open(AddRateTableModalComponent, {
        width: '820px',
        disableClose: true,
        data: this.rateTables
      })
      .afterClosed()
      .pipe(first())
      .subscribe(rateTableData => {
        if (!rateTableData) return;
        this.navigationHelperService.navigateCompanyRateTableDetails(rateTableData.id);
      });
  }

  public copyRateTable(item: RateTable): void {
    this.rateTableService
      .cloneRateTable(item.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        this.notificationHelperService.showSuccess('Rate Table Successfully cloned');
        this.navigationHelperService.navigateCompanyRateTableDetails(data.id);
      });
  }

  public openRateTableDetails(item: RateTable): void {
    this.navigationHelperService.navigateCompanyRateTableDetails(item.id);
  }

  onTableAction(value: Actions, item: RateTable) {
    switch (value) {
      case Actions.VIEW:
        this.openRateTableDetails(item);
        break;

      case Actions.CLONE:
        this.copyRateTable(item);
        break;
    }
  }

  /*
   * Private Helpers
   */
  private loadCompanyRateTables(): void {
    this.rateTableService
      .getCompanyRateTables()
      .pipe(takeUntil(this.destroy$))
      .subscribe(rateTableList => (this.rateTables = rateTableList));
  }

  private initTableActions() {
    this.actions = [
      {
        label: 'View',
        icon: 'visibility',
        value: Actions.VIEW
      },
      {
        label: 'Clone',
        icon: 'add_to_photos',
        value: Actions.CLONE,
        isHidden: !this.currentUser.canClone
      }
    ];
  }
}
