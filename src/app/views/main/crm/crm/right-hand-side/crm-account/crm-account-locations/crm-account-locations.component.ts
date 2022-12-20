import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { TableAction } from '@app/models';
import { CrmTypeEnum } from '@services/app-layer/app-layer.enums';
import { Environment } from '@services/app-layer/app-layer.environment';
import { CrmAccountEntity, CrmContactEntity, CrmLocationEntity } from '@services/app-layer/entities/crm';
import { AccessControlScope } from '@services/app-layer/permission/permission.interface';
import { CrmStateService } from '@views/main/crm/crm/crm-state.service';
import { CrmComponentService } from '@views/main/crm/crm/crm.component.service';
import { LinkedCrmLocationModalComponent } from '@views/main/crm/crm/right-hand-side/crm-location/linked-crm-location-modal/linked-crm-location-modal.component';
import { UnlinkedCrmLocationModalComponent } from '@views/main/crm/crm/right-hand-side/crm-location/unlinked-crm-location-modal/unlinked-crm-location-modal.component';
import { combineLatest, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

enum Actions {
  VIEW,
  ARCHIVE,
  UNARCHIVE,
  LINKED,
  UNLINKED
}

@Component({
  selector: 'app-crm-account-locations',
  templateUrl: './crm-account-locations.component.html',
  styleUrls: ['../common/crm-account-contacts-locations.common.scss']
})
export class CrmAccountLocationsComponent implements OnInit, OnDestroy {
  private _crmAccountData: CrmAccountEntity;
  @Input() get crmAccountData(): CrmAccountEntity {
    return this._crmAccountData;
  }
  set crmAccountData(value: CrmAccountEntity) {
    this._crmAccountData = value;
    if (value) {
      this.setUserPermissions();
      this.initTableActions();
      this.setAccountLocations();
    }
  }

  public accountLocations: CrmLocationEntity[];

  private destroy$ = new Subject<void>();
  public crmPermissions: any;
  public AccessControlScope = AccessControlScope;
  actions: TableAction[] = [];

  constructor(
    private dialog: MatDialog,
    private crmComponentService: CrmComponentService,
    private crmStateService: CrmStateService
  ) {}

  ngOnInit() {
    combineLatest([this.crmStateService.crmLocations$, this.crmStateService.showArchived$])
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.setAccountLocations());
    this.handleTableActionsReload();
  }
  public ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.unsubscribe();
  }

  public openLinkedCrmLocationModal(location: CrmLocationEntity): void {
    this.dialog
      .open(LinkedCrmLocationModalComponent, {
        width: '648px',
        disableClose: true,
        data: location
      })
      .afterClosed()
      .subscribe(data => {
        if (data) {
          this.crmStateService.updateActiveLocation(data);
        }
      });
  }

  public openUnlinkedCrmLocationModal(location: CrmLocationEntity): void {
    this.dialog
      .open(UnlinkedCrmLocationModalComponent, {
        width: '648px',
        disableClose: true,
        data: location
      })
      .afterClosed()
      .subscribe(data => {
        if (data) {
          this.crmStateService.updateActiveLocation(data);
          this.openLinkedCrmLocationModal(data);
        }
      });
  }

  public goToCrmLocationDetails(location: CrmLocationEntity): void {
    this.crmStateService.setActiveEntity(location);
  }

  public addCrmAccountLocation(): void {
    this.crmStateService.addNewType(CrmTypeEnum.LOCATION);
  }

  onTableAction(value: Actions, item: CrmLocationEntity) {
    switch (value) {
      case Actions.VIEW:
        this.goToCrmLocationDetails(item);
        break;

      case Actions.ARCHIVE:
        this.archiveLocation(item);
        break;
      case Actions.UNARCHIVE:
        this.unArchiveLocation(item);
        break;

      case Actions.LINKED:
        this.openLinkedCrmLocationModal(item);
        break;

      case Actions.UNLINKED:
        this.openUnlinkedCrmLocationModal(item);
        break;
    }
  }

  private archiveLocation(item) {
    this.crmComponentService
      .archiveLocation(item)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.crmStateService.setArchivedStatusLocation(item, true);
      });
  }
  private unArchiveLocation(item) {
    this.crmComponentService
      .archiveLocation(item)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.crmStateService.setArchivedStatusLocation(item, false);
      });
  }

  private setUserPermissions(): void {
    const user = Environment.getCurrentUser();
    this.crmPermissions = {
      canUpdate:
        user.normalizedAccessControlRoles.CRM_ACCOUNT.CRMSection.sectionGroup.updateEntry.value ===
          AccessControlScope.Company ||
        (user.normalizedAccessControlRoles.CRM_ACCOUNT.CRMSection.sectionGroup.updateEntry.value ===
          AccessControlScope.Owner &&
          this.crmAccountData.salesTeam.some(seller => seller === user.id)),
      canCreate:
        user.normalizedAccessControlRoles.CRM_ACCOUNT.createCRMSection.sectionGroup.createEntry.value ===
        AccessControlScope.Company
    };
  }

  private setAccountLocations(): void {
    this.accountLocations = this.crmStateService.crmLocations.filter(
      entity =>
        entity.crmAccount &&
        entity.crmAccount.id === this.crmAccountData.id &&
        (this.crmStateService.showArchived$.getValue() || !entity.archived)
    );
  }

  private initTableActions() {
    this.actions = [
      {
        label: 'View',
        icon: 'visibility',
        value: Actions.VIEW
      },
      {
        label: 'Archive',
        icon: 'archive',
        value: Actions.ARCHIVE,
        color: 'warn',
        prompt: {
          title: 'Confirm please!',
          text: 'Are you sure you want to archive CRM Account Location?'
        },
        isHidden(action: TableAction, entity: any) {
          return !entity.canUpdate || entity.archived;
        }
      },
      {
        label: 'Unarchive',
        icon: 'unarchive',
        value: Actions.UNARCHIVE,
        color: 'primary',
        prompt: {
          title: 'Confirm please!',
          text: 'Are you sure you want to unarchive CRM Account Location?'
        },
        isHidden(action: TableAction, entity: any) {
          return !(entity.canUpdate && entity.archived && !entity.crmAccount.archived);
        }
      },
      {
        label: 'Link',
        icon: 'link',
        value: Actions.LINKED,
        isHidden: (action, item: CrmContactEntity) => {
          return !(this.crmAccountData.link && this.crmPermissions?.canUpdate && item.link);
        }
      },
      {
        label: 'Unlink',
        icon: 'link_off',
        value: Actions.UNLINKED,
        isHidden: (action, item: CrmContactEntity) => {
          return !(this.crmAccountData.link && this.crmPermissions?.canUpdate && !item.link);
        }
      }
    ];
  }

  private handleTableActionsReload(): void {
    this.crmStateService.reloadAccountTablesActions$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.initTableActions());
  }
}
