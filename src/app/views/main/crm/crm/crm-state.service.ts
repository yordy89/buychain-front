import { Injectable } from '@angular/core';
import { CrmTypeEnum } from '@services/app-layer/app-layer.enums';
import { CrmService } from '@services/app-layer/crm/crm.service';
import { CrmAccountEntity, CrmContactEntity, CrmLocationEntity } from '@services/app-layer/entities/crm';
import { BehaviorSubject, combineLatest, forkJoin, Subject, Observable } from 'rxjs';
import { first, map, share, tap } from 'rxjs/operators';

type CombinedCrmEntityType = CrmAccountEntity | CrmLocationEntity | CrmContactEntity;

@Injectable({
  providedIn: 'root'
})
export class CrmStateService {
  entities$: Observable<CombinedCrmEntityType[]>;
  crmAccounts$: Observable<CrmAccountEntity[]>;
  crmLocations$: Observable<CrmLocationEntity[]>;
  crmContacts$: Observable<CrmContactEntity[]>;
  activeEntity$: Observable<CombinedCrmEntityType>;
  addNewItemType$: Observable<CrmTypeEnum>;

  showArchived$ = new BehaviorSubject(false);
  reloadAccountTablesActions$ = new Subject<void>();

  isLeftPartVisible$: BehaviorSubject<boolean> = new BehaviorSubject(true);

  entities: CombinedCrmEntityType[] = [];
  crmAccounts: CrmAccountEntity[] = [];
  crmLocations: CrmLocationEntity[] = [];
  crmContacts: CrmContactEntity[] = [];
  activeEntity: CombinedCrmEntityType;

  private crmAccountsSubj = new BehaviorSubject([]);
  private crmLocationsSubj = new BehaviorSubject([]);
  private crmContactsSubj = new BehaviorSubject([]);
  private activeEntitySubj = new BehaviorSubject(null);
  private addNewItemTypeSubj = new BehaviorSubject(null);

  constructor(private crmService: CrmService) {
    this.crmAccounts$ = this.crmAccountsSubj.asObservable();
    this.crmLocations$ = this.crmLocationsSubj.asObservable();
    this.crmContacts$ = this.crmContactsSubj.asObservable();
    this.activeEntity$ = this.activeEntitySubj.asObservable();
    this.addNewItemType$ = this.addNewItemTypeSubj.asObservable();
    this.handleEntities();
  }

  loadAll() {
    return forkJoin([
      this.crmService.getAccounts(true),
      this.crmService.getLocations(true),
      this.crmService.getContacts(true)
    ]).pipe(
      first(),
      tap(([accounts, locations, contacts]) => {
        // when access roles to read is Owner, the back is not properly filtering the contacts and locations out
        const filteredLocations = locations.filter(l => accounts.some(a => a.id === l.crmAccountId));
        const filteredContacts = contacts.filter(c => accounts.some(a => a.id === c.crmAccountId));
        this.setAccounts(accounts);
        this.setLocations(filteredLocations);
        this.setContacts(filteredContacts);
      })
    );
  }

  setActiveEntity(entity) {
    this.activeEntity = entity;
    this.activeEntitySubj.next(entity);
  }

  addNewType(type: CrmTypeEnum) {
    this.addNewItemTypeSubj.next(type);
  }

  setAccounts(accounts: CrmAccountEntity[]) {
    this.crmAccountsSubj.next(accounts);
  }

  addAccount(account: CrmAccountEntity) {
    this.setAccounts(this.crmAccounts.concat(account));
  }

  setArchiveStatusAccount(account: CrmAccountEntity, archived: boolean) {
    // TODO remove data mutations
    account = new CrmAccountEntity().init({ ...account, archived } as any);
    this.updateActiveAccount(account);

    if (archived) {
      this.crmLocations.forEach(l => {
        if (l.crmAccountId === account.id) {
          l.archived = true;
          l.archivedString = 'Yes';
        }
      });
      this.setLocations(this.crmLocations);

      this.crmContacts.forEach(c => {
        if (c.crmAccountId === account.id) {
          c.archived = true;
          c.archivedString = 'Yes';
        }
      });
      this.setContacts(this.crmContacts);
    }
  }

  updateActiveAccount(account: CrmAccountEntity) {
    const items = this.crmAccounts.map(item => (item.id === account.id ? account : item));
    this.setAccounts(items);

    if (this.activeEntity?.id === account.id) {
      this.setActiveEntity(account);
    } else if (this.activeEntity?.['crmAccount']?.id === account.id) {
      const activeEntity = this.entities.find(item => item.id === this.activeEntity.id);
      this.setActiveEntity(activeEntity);
    }
  }

  unlinkEntitiesFromAccount(account: CrmAccountEntity) {
    if (account.link) {
      return;
    }

    const locations = this.crmLocations.map(entity => {
      if (entity.crmAccount && entity.crmAccount.id === account.id) {
        return new CrmLocationEntity().init({ ...entity, link: null });
      }
      return entity;
    });

    const contacts = this.crmContacts.map(entity => {
      if (entity.crmAccount && entity.crmAccount.id === account.id) {
        return new CrmContactEntity().init({ ...entity, link: null });
      }
      return entity;
    });

    this.setLocations(locations);
    this.setContacts(contacts);
  }

  setLocations(locations: CrmLocationEntity[]) {
    this.crmLocationsSubj.next(locations);
    this.reloadAccountTablesActions$.next();
  }

  addLocation(location: CrmLocationEntity) {
    this.setLocations(this.crmLocations.concat(location));
  }

  setArchivedStatusLocation(location: CrmLocationEntity, archived) {
    const crmLocations = this.crmLocations.map(loc => {
      if (loc.id === location.id) {
        return new CrmLocationEntity().init({ ...location, archived });
      }
      return loc;
    });
    this.setLocations(crmLocations);
  }

  updateActiveLocation(location: CrmLocationEntity) {
    const items = this.crmLocations.map(item => (item.id === location.id ? location : item));
    this.setLocations(items);

    if (this.activeEntity?.id === location.id) {
      this.setActiveEntity(location);
    }
  }

  setContacts(contacts: CrmContactEntity[]) {
    this.crmContactsSubj.next(contacts);
    this.reloadAccountTablesActions$.next();
  }

  addContact(contact: CrmContactEntity) {
    this.setContacts(this.crmContacts.concat(contact));
  }

  setArchivedStatusContact(contact: CrmContactEntity, archived) {
    const crmContacts = this.crmContacts.map(item => {
      if (item.id === contact.id) {
        return new CrmContactEntity().init({ ...contact, archived });
      }
      return item;
    });
    this.setContacts(crmContacts);
  }

  updateActiveContact(contact: CrmContactEntity) {
    const items = this.crmContacts.map(item => (item.id === contact.id ? contact : item));
    this.setContacts(items);

    if (this.activeEntity?.id === contact.id) {
      this.setActiveEntity(contact);
    }
  }

  reset() {
    this.setAccounts([]);
    this.setLocations([]);
    this.setContacts([]);
    this.setActiveEntity(null);
  }

  // todo get rid of mutation
  private setLocationAccount(accounts: CrmAccountEntity[], locations: CrmLocationEntity[]) {
    if (!locations.length || !accounts.length) {
      return;
    }
    locations.forEach(location => {
      const target = accounts.find(x => x.id === location.crmAccountId);
      location.crmAccount = target;
      location.accountName = target.name;
      if (!target?.link && location.link) {
        location.link = null;
      }
    });
  }

  // todo get rid of mutation
  private setContactAccount(accounts: CrmAccountEntity[], contacts: CrmContactEntity[]) {
    if (!contacts.length || !accounts.length) {
      return;
    }
    contacts.forEach(contact => {
      const target = accounts.find(x => x.id === contact.crmAccountId);
      contact.crmAccount = target;
      contact.accountName = target.name;
      if (!target?.link && contact.link) {
        contact.link = null;
      }
    });
  }

  private handleEntities() {
    this.entities$ = combineLatest([
      this.crmAccounts$.pipe(tap(accounts => (this.crmAccounts = accounts))),
      this.crmLocations$.pipe(tap(locations => (this.crmLocations = locations))),
      this.crmContacts$.pipe(tap(contacts => (this.crmContacts = contacts)))
    ]).pipe(
      map(([accounts, locations, contacts]) => {
        this.setLocationAccount(accounts, locations);
        this.setContactAccount(accounts, contacts);

        this.entities = [].concat(accounts).concat(locations).concat(contacts);
        return this.entities;
      }),
      share()
    );
  }
}
