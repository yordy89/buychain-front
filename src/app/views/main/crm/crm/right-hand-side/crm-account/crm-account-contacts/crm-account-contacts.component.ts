import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { TableAction } from '@app/models';
import { CrmTypeEnum } from '@services/app-layer/app-layer.enums';
import { Environment } from '@services/app-layer/app-layer.environment';
import { CrmAccountEntity, CrmContactEntity } from '@services/app-layer/entities/crm';
import { AccessControlScope } from '@services/app-layer/permission/permission.interface';
import { CrmStateService } from '@views/main/crm/crm/crm-state.service';
import { CrmComponentService } from '@views/main/crm/crm/crm.component.service';
import { LinkedCrmContactModalComponent } from '@views/main/crm/crm/right-hand-side/crm-contact/linked-crm-contact-modal/linked-crm-contact-modal.component';
import { UnlinkedCrmContactModalComponent } from '@views/main/crm/crm/right-hand-side/crm-contact/unlinked-crm-contact-modal/unlinked-crm-contact-modal.component';
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
  selector: 'app-crm-account-contacts',
  templateUrl: './crm-account-contacts.component.html',
  styleUrls: ['../common/crm-account-contacts-locations.common.scss']
})
export class CrmAccountContactsComponent implements OnInit, OnDestroy {
  private _crmAccountData: CrmAccountEntity;
  @Input() get crmAccountData(): CrmAccountEntity {
    return this._crmAccountData;
  }
  set crmAccountData(value: CrmAccountEntity) {
    this._crmAccountData = value;
    if (value) {
      this.setUserPermissions();
      this.initTableActions();
      this.setAccountContacts();
    }
  }

  public crmPermissions: any;
  public accountContacts: CrmContactEntity[];
  actions: TableAction[] = [];
  private destroy$ = new Subject<void>();

  constructor(
    private dialog: MatDialog,
    public crmComponentService: CrmComponentService,
    private crmStateService: CrmStateService
  ) {}

  ngOnInit() {
    combineLatest([this.crmStateService.crmContacts$, this.crmStateService.showArchived$])
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.setAccountContacts());
    this.handleTableActionsReload();
  }

  public ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.unsubscribe();
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

  public addCrmAccountContact(): void {
    this.crmStateService.addNewType(CrmTypeEnum.CONTACT);
  }

  onTableAction(value: Actions, item: CrmContactEntity) {
    switch (value) {
      case Actions.VIEW:
        this.crmStateService.setActiveEntity(item);
        break;

      case Actions.ARCHIVE:
        this.archiveContact(item);
        break;

      case Actions.UNARCHIVE:
        this.unArchiveContact(item);
        break;

      case Actions.LINKED:
        this.openLinkedCrmContactModal(item);
        break;

      case Actions.UNLINKED:
        this.openUnlinkedCrmContactModal(item);
        break;
    }
  }

  private archiveContact(item) {
    this.crmComponentService
      .archiveContact(item)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.crmStateService.setArchivedStatusContact(item, true);
      });
  }

  private unArchiveContact(item) {
    this.crmComponentService
      .unArchiveContact(item)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.crmStateService.setArchivedStatusContact(item, false);
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

  private setAccountContacts(): void {
    this.accountContacts = this.crmStateService.crmContacts.filter(
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
          text: 'Are you sure you want to archive CRM Account Contact?'
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
          text: 'Are you sure you want to unarchive CRM Account Contact?'
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
