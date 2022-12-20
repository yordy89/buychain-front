import { Injectable } from '@angular/core';
import { AccountsService } from '@services/app-layer/accounts/accounts.service';
import { AccountingJournalReviewStatusEnum } from '@services/app-layer/app-layer.enums';
import { Environment } from '@services/app-layer/app-layer.environment';
import { CompaniesService } from '@services/app-layer/companies/companies.service';
import { CrmService } from '@services/app-layer/crm/crm.service';
import { DimensionsService } from '@services/app-layer/dimensions/dimensions.service';
import { JournalEntryEntity } from '@services/app-layer/entities/journal-entries';
import { GroupsService } from '@services/app-layer/groups/groups.service';
import { JournalEntriesApiService } from '@services/app-layer/journal-entries/journal-entries-api.service';
import { AccessControlScope } from '@services/app-layer/permission/permission.interface';
import { forkJoin, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class JournalEntriesService {
  constructor(
    private groupsService: GroupsService,
    private journalEntriesApiService: JournalEntriesApiService,
    private accountsService: AccountsService,
    private dimensionsService: DimensionsService,
    private crmService: CrmService,
    private companiesService: CompaniesService
  ) {}

  getCompanyGroups() {
    return this.groupsService.getCompanyGroups().pipe(
      map(groups => {
        groups = groups.sort((a, b) => {
          const aName = (a?.name || '').trim();
          const bName = (b?.name || '').trim();
          return aName.localeCompare(bName);
        });
        return [].concat({ id: '', name: 'Global', parentTree: [] }).concat(groups);
      })
    );
  }

  getData() {
    const limit = 1000;
    const offset = 0;
    return forkJoin([
      this.accountsService.getAccounts(limit, offset),
      this.dimensionsService.getDimensions(limit, offset),
      this.getCompanyGroups(),
      this.crmService.getAccounts(),
      this.companiesService.getCompanyCompleteMembers().pipe(map(items => items.filter(m => m.firstName)))
    ]);
  }

  getPermissions() {
    const normalizedRoles = Environment.getCurrentUser().normalizedAccessControlRoles;
    const accountPermissions = normalizedRoles?.ACCOUNT?.accountSection?.sectionGroup;
    const dimensionPermissions = normalizedRoles?.DIMENSION?.dimensionSection?.sectionGroup;
    const groupPermissions = normalizedRoles?.GROUP?.groupSection?.sectionGroup;
    const crmAccountsPermissions = normalizedRoles?.CRM_ACCOUNT?.CRMSection?.sectionGroup;
    const journalEntryPermissions = normalizedRoles?.JOURNAL_ENTRY?.journalEntrySection?.sectionGroup;

    const canReadJournalEntries = journalEntryPermissions?.read.value === AccessControlScope.Company;
    const canReadAccounts = accountPermissions?.read.value === AccessControlScope.Company;
    const canReadDimensions = dimensionPermissions?.read.value === AccessControlScope.Company;
    const canReadGroups = groupPermissions?.read.value === AccessControlScope.Company;
    const canReadCrmAccounts =
      crmAccountsPermissions.readEntry.value === AccessControlScope.Company ||
      crmAccountsPermissions.readEntry.value === AccessControlScope.Owner;

    return {
      canRead: canReadJournalEntries && canReadAccounts && canReadDimensions && canReadGroups && canReadCrmAccounts,
      canCreate: journalEntryPermissions?.create.value === AccessControlScope.Company,
      canUpdate: journalEntryPermissions?.update.value === AccessControlScope.Company,
      canDelete: journalEntryPermissions?.delete.value === AccessControlScope.Company
    };
  }

  changeReviewStatusForSelectedItems(
    selectedRows: string[],
    journalsList: JournalEntryEntity[],
    newStatus: AccountingJournalReviewStatusEnum.REJECT | AccountingJournalReviewStatusEnum.REQUEST
  ) {
    const payload = { reviewStatus: newStatus };
    const requests = selectedRows.map(id =>
      this.journalEntriesApiService.editJournalEntry(id, payload).pipe(catchError(() => of(null)))
    );

    return forkJoin(requests).pipe(
      map((items: JournalEntryEntity[]) => items.filter(item => !!item)),
      map(processedItems => {
        const processedMap = new Map<string, JournalEntryEntity>();
        processedItems.forEach(item => processedMap.set(item.id, item));
        return {
          journalsList: journalsList.map(item => (processedMap.has(item.id) ? processedMap.get(item.id) : item)),
          selectedRows: selectedRows.filter(id => !processedMap.has(id))
        };
      })
    );
  }

  approveSelectedItems(selectedRows: string[], journalsList: JournalEntryEntity[]) {
    const requests = selectedRows.map(id =>
      this.journalEntriesApiService.approveJournalEntry(id).pipe(catchError(() => of(null)))
    );

    return forkJoin(requests).pipe(
      map((items: JournalEntryEntity[]) => items.filter(item => !!item)),
      map(approvedItems => {
        const approvedMap = new Map<string, JournalEntryEntity>();
        approvedItems.forEach(item => approvedMap.set(item.id, item));
        return {
          journalsList: journalsList.map(item => (approvedMap.has(item.id) ? approvedMap.get(item.id) : item)),
          selectedRows: selectedRows.filter(id => !approvedMap.has(id))
        };
      })
    );
  }

  deleteSelectedItems(selectedRows: string[], journalsList: JournalEntryEntity[]) {
    const deletedIds = [];
    const requests = selectedRows.map(id =>
      this.journalEntriesApiService.deleteJournalEntry(id).pipe(
        tap(() => deletedIds.push(id)),
        catchError(() => of(null))
      )
    );

    return forkJoin(requests).pipe(
      map(() => ({
        journalsList: journalsList.filter(item => !deletedIds.includes(item.id)),
        selectedRows: selectedRows.filter(id => !deletedIds.includes(id))
      }))
    );
  }
}
