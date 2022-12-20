import { ChangeDetectorRef, Component, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { TableAction } from '@app/models';
import { BookmarkService } from '@app/services/app-layer/bookmark/bookmark.service';
import { CrmAccountEntity, CrmContactEntity, CrmLocationEntity } from '@app/services/app-layer/entities/crm';
import { User } from '@app/services/app-layer/entities/user';
import { CsvHelperService } from '@app/services/helpers/csv-helper/csv-helper.service';
import { ObjectUtil } from '@app/services/helpers/utils/object-util';
import { CrmTypeEnum } from '@services/app-layer/app-layer.enums';
import { Environment } from '@services/app-layer/app-layer.environment';
import { AccessControlScope } from '@services/app-layer/permission/permission.interface';
import { GridHelperService } from '@services/helpers/grid-helper/grid-helper.service';
import { ViewportHelperService } from '@services/helpers/viewport-helper.service';
import { AddCrmAccountModalComponent } from '@views/main/crm/crm/add-crm-account-modal/add-crm-account-modal.component';
import { CrmStateService } from '@views/main/crm/crm/crm-state.service';
import { LinkedCrmAccountModalComponent } from '@views/main/crm/crm/right-hand-side/crm-account/linked-crm-account-modal/linked-crm-account-modal.component';
import { UnlinkedCrmAccountModalComponent } from '@views/main/crm/crm/right-hand-side/crm-account/unlinked-crm-account-modal/unlinked-crm-account-modal.component';
import { LinkedCrmContactModalComponent } from '@views/main/crm/crm/right-hand-side/crm-contact/linked-crm-contact-modal/linked-crm-contact-modal.component';
import { UnlinkedCrmContactModalComponent } from '@views/main/crm/crm/right-hand-side/crm-contact/unlinked-crm-contact-modal/unlinked-crm-contact-modal.component';
import { LinkedCrmLocationModalComponent } from '@views/main/crm/crm/right-hand-side/crm-location/linked-crm-location-modal/linked-crm-location-modal.component';
import { UnlinkedCrmLocationModalComponent } from '@views/main/crm/crm/right-hand-side/crm-location/unlinked-crm-location-modal/unlinked-crm-location-modal.component';
import { DxDataGridComponent } from 'devextreme-angular';
import { Subject, Observable } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CrmComponentService } from './crm.component.service';
import { ExportModalComponent } from './export-modal/export-modal.component';
import { ImportModalComponent } from './import-modal/import-modal.component';

class ViewState {
  public grid = null;
  public showArchived = false;
}

enum Actions {
  ARCHIVE_ACCOUNT,
  ARCHIVE_LOCATION,
  ARCHIVE_CONTACT,
  UNARCHIVE_ACCOUNT,
  UNARCHIVE_LOCATION,
  UNARCHIVE_CONTACT,
  LINKED,
  UNLINKED
}

const isLinked = (entity: any) => {
  const isVisible =
    entity.type === CrmTypeEnum.ACCOUNT || (entity.type !== CrmTypeEnum.ACCOUNT && entity['crmAccount']?.link);
  return isVisible && entity.canUpdate && entity.link;
};

const isUnlinked = entity => {
  const isVisible =
    entity.type === CrmTypeEnum.ACCOUNT || (entity.type !== CrmTypeEnum.ACCOUNT && entity['crmAccount']?.link);
  return isVisible && entity.canUpdate && !entity.link;
};

@Component({
  selector: 'app-crm',
  templateUrl: './crm.component.html',
  styleUrls: ['./crm.component.scss']
})
export class CrmComponent implements OnInit, OnDestroy {
  @ViewChild('crmIndexGrid') crmIndexGrid: DxDataGridComponent;
  public gridFilterValue = [['archivedString', '=', 'No'], 'and', ['archivedString', '<>', ' ']];

  public viewKey = 'crm';
  public viewState: ViewState;
  public defaultState = new ViewState();

  public entities: any[] = [];

  private destroy$ = new Subject<void>();

  public currentUser: User;

  public isRightPartData: boolean;
  public rightSideVisibleTab: 'Account' | 'Contact' | 'Location';

  public selectedCrmAccount: CrmAccountEntity = null;
  public selectedCrmContact: CrmContactEntity = null;
  public selectedCrmLocation: CrmLocationEntity = null;

  public crmPermissions = { canRead: false, canCreate: false };
  public isOnlyOffline = Environment.isOnlyOffline();

  focusedRowKey;

  actions: TableAction[] = [];
  isTablet$: Observable<boolean>;

  constructor(
    private crmComponentService: CrmComponentService,
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private bookmarkService: BookmarkService,
    private csvHelper: CsvHelperService,
    private changeDetectorRef: ChangeDetectorRef,
    private gridHelperService: GridHelperService,
    private viewportHelperService: ViewportHelperService,
    public crmStateService: CrmStateService
  ) {
    this.saveGridState = this.saveGridState.bind(this);
    this.loadGridState = this.loadGridState.bind(this);

    this.initViewState();
    this.crmStateService.showArchived$
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => (this.viewState.showArchived = value));
  }

  ngOnInit() {
    this.isTablet$ = this.viewportHelperService.isTablet$;
    this.currentUser = Environment.getCurrentUser();
    this.setCrmPermissions(this.currentUser);
    this.crmStateService.entities$.pipe(takeUntil(this.destroy$)).subscribe(data => (this.entities = data));

    if (this.crmPermissions.canRead) {
      this.init();
      this.handleViewStateFilters();
    }
  }

  @HostListener('document:keyup', ['$event'])
  handleKeyboardEvent(e) {
    if (e.key === 'Enter' && this.crmStateService.activeEntity?.id !== this.focusedRowKey) {
      const focusedEntity = this.crmStateService.entities.find(item => item.id === this.focusedRowKey);
      this.selectRow(focusedEntity);
    }
  }

  private init() {
    this.initTableActions();
    this.crmStateService
      .loadAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const entityId = this.route.snapshot.params['id'];
        if (entityId) this.navigateToEntity(entityId);
      });

    this.crmStateService.activeEntity$.pipe(takeUntil(this.destroy$)).subscribe(data => {
      if (data) {
        this.showCrmDetails(data);
      } else {
        this.isRightPartData = false;
        this.selectedCrmContact = null;
        this.selectedCrmLocation = null;
        this.selectedCrmAccount = null;
      }
    });

    this.crmStateService.addNewItemType$.pipe(takeUntil(this.destroy$)).subscribe(type => {
      if (type === CrmTypeEnum.CONTACT) {
        this.rightSideVisibleTab = 'Contact';
      } else if (type === CrmTypeEnum.LOCATION) {
        this.rightSideVisibleTab = 'Location';
      }
    });
  }

  public onCellPrepared(e): void {
    if (e?.data?.archived) {
      e.cellElement.style.backgroundColor = '#e2e2e2';
      e.cellElement.style.color = '#7f7f7f';
    }
  }

  public navigateToEntity(entityId) {
    const routingEntity = this.crmStateService.entities.find(x => x.id === entityId);
    if (routingEntity) {
      this.crmStateService.setActiveEntity(routingEntity);
    } else {
      throw new Error(`CRM entity with id ${entityId} not found.`);
    }
  }

  public addCrmAccount(): void {
    this.dialog
      .open(AddCrmAccountModalComponent, {
        width: '648px',
        disableClose: false,
        data: this.crmStateService.crmAccounts
      })
      .afterClosed()
      .subscribe(accountData => {
        if (accountData) {
          this.crmStateService.addAccount(accountData);
          this.crmStateService.setActiveEntity(accountData);
        }
      });
  }

  public handleViewStateFilters(): void {
    this.showArchivedSwitch({ checked: this.viewState?.showArchived });
  }

  public showArchivedSwitch(e): void {
    const newFilter = ObjectUtil.getDeepCopy(this.gridFilterValue);
    newFilter[0] = e.checked ? ['archivedString', '<>', ''] : ['archivedString', '=', 'No'];
    this.gridFilterValue = newFilter;
    this.crmStateService.showArchived$.next(e.checked);
  }

  private archiveCrmAccount(account) {
    this.crmComponentService
      .archiveAccount(account)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.closeIfCrmIsOpened(account.id);
        this.crmStateService.setArchiveStatusAccount(account, true);
      });
  }

  private archiveCrmLocation(location) {
    this.crmComponentService
      .archiveLocation(location)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.closeIfCrmIsOpened(location.id);
        this.crmStateService.setArchivedStatusLocation(location, true);
      });
  }

  private archiveCrmContact(contact) {
    this.crmComponentService
      .archiveContact(contact)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.closeIfCrmIsOpened(contact.id);
        this.crmStateService.setArchivedStatusContact(contact, true);
      });
  }

  private unArchiveCrmAccount(account) {
    this.crmComponentService
      .unArchiveAccount(account)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.crmStateService.setArchiveStatusAccount(account, false);
      });
  }

  private unArchiveCrmLocation(location) {
    this.crmComponentService
      .unArchiveLocation(location)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.crmStateService.setArchivedStatusLocation(location, false);
      });
  }

  private unArchiveCrmContact(contact) {
    this.crmComponentService
      .unArchiveContact(contact)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.crmStateService.setArchivedStatusContact(contact, false);
      });
  }

  private closeIfCrmIsOpened(crmUnitId: string): void {
    if (this.crmStateService.showArchived$.getValue()) return;
    const account = this.selectedCrmAccount;
    const contact = this.selectedCrmContact;
    const location = this.selectedCrmLocation;

    if (account && account.id === crmUnitId) {
      this.selectedCrmAccount = null;
      this.rightSideVisibleTab = null;
    }
    if (contact && (contact.id === crmUnitId || contact.crmAccountId === crmUnitId)) {
      this.selectedCrmContact = null;
      this.rightSideVisibleTab = 'Account';
    }
    if (location && (location.id === crmUnitId || location.crmAccountId === crmUnitId)) {
      this.selectedCrmLocation = null;
      this.rightSideVisibleTab = 'Account';
    }
  }

  public ngOnDestroy(): void {
    this.crmStateService.reset();
    this.destroy$.next();
    this.destroy$.unsubscribe();
  }

  public onRowSelected(e): void {
    if (e.rowType === 'group') return;
    const selectedRow = e.data;
    this.selectRow(selectedRow);
  }

  private selectRow(selectedRow) {
    if (selectedRow?.id) {
      this.isRightPartData = false;
      this.changeDetectorRef.detectChanges();
      this.crmStateService.setActiveEntity(selectedRow);
    } else {
      this.isRightPartData = false;
    }
  }

  public showCrmDetails(crmUnit) {
    if (crmUnit.type === CrmTypeEnum.LOCATION) {
      this.selectedCrmContact = null;
      this.selectedCrmAccount = crmUnit.crmAccount;
      this.selectedCrmLocation = crmUnit;
      this.rightSideVisibleTab = 'Location';
    } else if (crmUnit.type === CrmTypeEnum.CONTACT) {
      this.selectedCrmLocation = null;
      this.selectedCrmAccount = crmUnit.crmAccount;
      this.selectedCrmContact = crmUnit;
      this.rightSideVisibleTab = 'Contact';
    } else {
      this.selectedCrmContact = null;
      this.selectedCrmLocation = null;
      this.selectedCrmAccount = crmUnit;
      this.rightSideVisibleTab = 'Account';
    }

    this.isRightPartData = true;
  }

  public openLinkedCrmEntityModal(crmUnit: any): void {
    if (crmUnit.type === CrmTypeEnum.ACCOUNT) this.openLinkedCrmAccountModal(crmUnit);
    if (crmUnit.type === CrmTypeEnum.LOCATION) this.openLinkedCrmLocationModal(crmUnit);
    if (crmUnit.type === CrmTypeEnum.CONTACT) this.openLinkedCrmContactModal(crmUnit);
  }
  public openLinkedCrmAccountModal(account: CrmAccountEntity): void {
    this.dialog
      .open(LinkedCrmAccountModalComponent, {
        width: '648px',
        disableClose: true,
        data: account
      })
      .afterClosed()
      .subscribe(data => {
        if (data) {
          this.crmStateService.updateActiveAccount(data);
          this.crmStateService.unlinkEntitiesFromAccount(data);
        }
      });
  }
  public openLinkedCrmContactModal(contact: CrmContactEntity): void {
    this.dialog
      .open(LinkedCrmContactModalComponent, {
        width: '648px',
        disableClose: true,
        data: contact
      })
      .afterClosed()
      .subscribe(data => {
        if (data) {
          this.crmStateService.updateActiveContact(data);
        }
      });
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

  public openUnlinkedCrmEntityModal(crmUnit: any): void {
    if (crmUnit.type === CrmTypeEnum.ACCOUNT) this.openUnlinkedCrmAccountModal(crmUnit);
    if (crmUnit.type === CrmTypeEnum.LOCATION) this.openUnlinkedCrmLocationModal(crmUnit);
    if (crmUnit.type === CrmTypeEnum.CONTACT) this.openUnlinkedCrmContactModal(crmUnit);
  }
  public openUnlinkedCrmAccountModal(account: CrmAccountEntity): void {
    this.dialog
      .open(UnlinkedCrmAccountModalComponent, {
        width: '648px',
        disableClose: true,
        data: account
      })
      .afterClosed()
      .subscribe(data => {
        if (data) {
          this.crmStateService.updateActiveAccount(data);
          this.openLinkedCrmAccountModal(data);
        }
      });
  }
  public openUnlinkedCrmContactModal(contact: CrmContactEntity): void {
    this.dialog
      .open(UnlinkedCrmContactModalComponent, {
        width: '648px',
        disableClose: true,
        data: contact
      })
      .afterClosed()
      .subscribe(data => {
        if (data) {
          this.crmStateService.updateActiveContact(data);
          this.openLinkedCrmContactModal(data);
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

  public onExportClick() {
    this.dialog
      .open(ExportModalComponent, { width: '648px' })
      .afterClosed()
      .subscribe(selectedType => {
        if (!selectedType) return;

        switch (selectedType) {
          case 'Accounts':
            this.exportAccounts();
            break;
          case 'Locations':
            this.exportLocations();
            break;
          case 'Contacts':
            this.exportContacts();
            break;
          default:
            break;
        }
      });
  }

  public onImportClick() {
    this.dialog
      .open(ImportModalComponent, {
        width: '648px',
        data: this.crmStateService.crmAccounts
      })
      .afterClosed()
      .subscribe(success => {
        if (success) {
          this.crmStateService.loadAll().pipe(takeUntil(this.destroy$)).subscribe();
        }
      });
  }

  public onStateChanged(viewState: ViewState) {
    this.viewState = viewState;
    this.setGridState();
  }

  public setGridState() {
    this.crmIndexGrid.instance.state(this.viewState.grid);
    if (!this.viewState.grid) this.crmIndexGrid.instance.state(null);
    this.handleViewStateFilters();
  }

  public loadGridState() {
    return this.viewState.grid;
  }

  public saveGridState(gridState) {
    const gridStoringState = ObjectUtil.getDeepCopy(gridState);
    gridStoringState.selectedRowKeys = [];
    this.viewState = { ...this.viewState, grid: gridStoringState };
  }

  public onToolbarPreparing(e) {
    this.gridHelperService.prepareToolbarCollapseExpand(e, () => this.crmIndexGrid);
    this.gridHelperService.prepareToolbarPrefixTemplate(e);
  }

  onTableAction(value: Actions, item: CrmAccountEntity | CrmLocationEntity | CrmContactEntity) {
    switch (value) {
      case Actions.ARCHIVE_ACCOUNT:
        this.archiveCrmAccount(item);
        break;

      case Actions.ARCHIVE_CONTACT:
        this.archiveCrmContact(item);
        break;

      case Actions.ARCHIVE_LOCATION:
        this.archiveCrmLocation(item);
        break;

      case Actions.UNARCHIVE_ACCOUNT:
        this.unArchiveCrmAccount(item);
        break;

      case Actions.UNARCHIVE_CONTACT:
        this.unArchiveCrmContact(item);
        break;

      case Actions.UNARCHIVE_LOCATION:
        this.unArchiveCrmLocation(item);
        break;

      case Actions.LINKED:
        this.openLinkedCrmEntityModal(item);
        break;

      case Actions.UNLINKED:
        this.openUnlinkedCrmEntityModal(item);
        break;
    }
  }

  private initTableActions() {
    this.actions = [
      {
        label: 'Unarchive',
        icon: 'unarchive',
        color: 'primary',
        value: Actions.UNARCHIVE_ACCOUNT,
        isHidden(action: TableAction, entity: any) {
          return !(entity.canUpdate && entity.archived && entity.type === CrmTypeEnum.ACCOUNT);
        }
      },
      {
        label: 'Unarchive',
        icon: 'unarchive',
        color: 'primary',
        value: Actions.UNARCHIVE_LOCATION,
        isHidden(action: TableAction, entity: any) {
          return !(
            entity.canUpdate &&
            entity.archived &&
            entity.type === CrmTypeEnum.LOCATION &&
            !entity.crmAccount.archived
          );
        }
      },
      {
        label: 'Unarchive',
        icon: 'unarchive',
        color: 'primary',
        value: Actions.UNARCHIVE_CONTACT,
        isHidden(action: TableAction, entity: any) {
          return !(
            entity.canUpdate &&
            entity.archived &&
            entity.type === CrmTypeEnum.CONTACT &&
            !entity.crmAccount.archived
          );
        }
      },
      {
        label: 'Archive',
        icon: 'archive',
        color: 'warn',
        value: Actions.ARCHIVE_ACCOUNT,
        prompt: {
          text:
            'Are you sure you want to archive CRM Account?' +
            ' This will result in archiving automatically all the CRM contacts and locations under that CRM account'
        },
        isHidden(action: TableAction, entity: any) {
          return !(entity.canUpdate && !entity.archived && entity.type === CrmTypeEnum.ACCOUNT);
        }
      },
      {
        label: 'Archive',
        icon: 'archive',
        color: 'warn',
        value: Actions.ARCHIVE_LOCATION,
        prompt: {
          text: 'Are you sure you want to archive CRM Location?'
        },
        isHidden(action: TableAction, entity: any) {
          return !(entity.canUpdate && !entity.archived && entity.type === CrmTypeEnum.LOCATION);
        }
      },
      {
        label: 'Archive',
        icon: 'archive',
        color: 'warn',
        value: Actions.ARCHIVE_CONTACT,
        prompt: {
          text: 'Are you sure you want to archive CRM Contact?'
        },
        isHidden(action: TableAction, entity: any) {
          return !(entity.canUpdate && !entity.archived && entity.type === CrmTypeEnum.CONTACT);
        }
      },
      {
        label: 'Link',
        icon: 'link',
        value: Actions.LINKED,
        isHidden(action: TableAction, entity: any) {
          return Environment.isOnlyOffline() || !isLinked(entity);
        }
      },
      {
        label: 'Unlink',
        icon: 'link_off',
        value: Actions.UNLINKED,
        isHidden(action: TableAction, entity: any) {
          return Environment.isOnlyOffline() || !isUnlinked(entity);
        }
      }
    ];
  }

  isVisibleLinkIcon(entity: any) {
    return isLinked(entity);
  }

  isVisibleUnlinkIcon(entity: any) {
    return isUnlinked(entity);
  }

  private initViewState() {
    this.viewState =
      this.bookmarkService.getLastSessionState(this.viewKey) || ObjectUtil.getDeepCopy(this.defaultState);
    this.crmStateService.showArchived$.next(this.viewState.showArchived);
  }

  private exportAccounts() {
    const dataToExport = this.crmStateService.crmAccounts.map(x => ({
      name: x.name,
      website: x.website,
      streetAddress: x.streetAddress,
      city: x.city,
      state: x.state,
      country: x.country,
      zipCode: x.zipCode
    }));
    const csv = this.csvHelper.serializeToCSV(dataToExport, true);
    this.csvHelper.saveAsFile(csv, 'CRM_Accounts');
  }

  private exportLocations() {
    const dataToExport = this.crmStateService.crmLocations.map(x => ({
      accountName: x.accountName,
      shortName: x.shortName,
      streetAddress: x.streetAddress,
      city: x.city,
      state: x.state,
      country: x.country,
      zipCode: x.zipCode,
      careOf: x.careOf,
      longitude: x.geolocation ? x.geolocation.longitude : null,
      latitude: x.geolocation ? x.geolocation.latitude : null
    }));
    const csv = this.csvHelper.serializeToCSV(dataToExport, true);
    this.csvHelper.saveAsFile(csv, 'CRM_Locations');
  }

  private exportContacts() {
    const dataToExport = this.crmStateService.crmContacts.map(x => ({
      accountName: x.accountName,
      email: x.username,
      firstName: x.firstName,
      lastName: x.lastName,
      title: x.title,
      callingCode: x.callingCode,
      workPhone: x.workPhone
    }));
    const csv = this.csvHelper.serializeToCSV(dataToExport, true);
    this.csvHelper.saveAsFile(csv, 'CRM_Contacts');
  }

  private setCrmPermissions(currentUser: User): void {
    const userCrmPermissions = {
      ...currentUser.normalizedAccessControlRoles.CRM_ACCOUNT.CRMSection.sectionGroup,
      ...currentUser.normalizedAccessControlRoles.CRM_ACCOUNT.createCRMSection.sectionGroup
    };
    this.crmPermissions.canCreate = userCrmPermissions.createEntry.value === AccessControlScope.Company;
    this.crmPermissions.canRead =
      userCrmPermissions.readEntry.value === AccessControlScope.Company ||
      userCrmPermissions.readEntry.value === AccessControlScope.Owner;
  }
}
