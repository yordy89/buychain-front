import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { DialogModalComponent, DialogType } from '@components/common/modals/dialog-modal/dialog-modal.component';
import { AccountEntity } from '@services/app-layer/entities/account';
import { CrmAccountEntity } from '@services/app-layer/entities/crm';
import { DimensionEntity } from '@services/app-layer/entities/dimension';
import { GroupEntity } from '@services/app-layer/entities/group';
import { JournalEntryEntity } from '@services/app-layer/entities/journal-entries';
import { MemberEntity } from '@services/app-layer/entities/member';
import { JournalEntriesApiService } from '@services/app-layer/journal-entries/journal-entries-api.service';
import { SkinService } from '@services/app-layer/skin/skin.service';
import { NotificationHelperService } from '@services/helpers/notification-helper/notification-helper.service';
import { JournalEntriesService } from '@views/main/accounting/financial/journal-entries/journal-entries.service';
import { EMPTY, of, Subject } from 'rxjs';
import { catchError, finalize, mergeMap, takeUntil, tap } from 'rxjs/operators';
import { LogEntriesModalComponent } from '@views/main/common/modals/log-entries-modal/log-entries-modal.component';
import { SpinnerHelperService } from '@services/helpers/spinner-helper/spinner-helper.service';
import { AccountingPrintService } from '@services/app-layer/accounting-print/accounting-print.service';

enum EntryPageStatesEnum {
  VIEW,
  ADD,
  EDIT
}

@Component({
  selector: 'app-journal-entry',
  styleUrls: ['./journal-entry.component.scss'],
  templateUrl: 'journal-entry.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class JournalEntryComponent implements OnInit, OnDestroy {
  entry: JournalEntryEntity = null;
  crmAccountsList: CrmAccountEntity[] = [];
  groupsList: GroupEntity[] = [];
  accountsList: AccountEntity[] = [];
  dimensionsList: DimensionEntity[] = [];
  members: MemberEntity[] = [];
  state: EntryPageStatesEnum = null;
  isLoaded = false;

  permissions = { canRead: false, canCreate: false, canUpdate: false, canDelete: false };

  private destroy$ = new Subject<void>();

  constructor(
    private journalEntriesApiService: JournalEntriesApiService,
    private journalEntriesService: JournalEntriesService,
    private route: ActivatedRoute,
    private cd: ChangeDetectorRef,
    private dialog: MatDialog,
    private router: Router,
    private notificationHelperService: NotificationHelperService,
    private spinnerService: SpinnerHelperService,
    private skinService: SkinService,
    private printService: AccountingPrintService
  ) {}

  ngOnInit() {
    this.setPermissions();

    if (this.permissions.canRead) {
      this.initState();
      this.loadData();
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initState() {
    const id = this.route.snapshot.paramMap.has('id');
    const isEdit = this.route.snapshot.queryParamMap.get('edit') === 'true';

    if (!id && this.permissions.canCreate) {
      this.state = EntryPageStatesEnum.ADD;
    } else if (isEdit && this.permissions.canUpdate) {
      this.state = EntryPageStatesEnum.EDIT;
    } else {
      this.state = EntryPageStatesEnum.VIEW;
    }
  }

  get isAddState() {
    return this.state === EntryPageStatesEnum.ADD;
  }

  get isEditState() {
    return this.state === EntryPageStatesEnum.EDIT;
  }

  get isViewState() {
    return this.state === EntryPageStatesEnum.VIEW;
  }

  get title() {
    if (this.isEditState) {
      return 'Edit Journal Entry';
    }

    if (this.isViewState) {
      return 'View Journal Entry';
    }

    if (this.isAddState) {
      return 'Add Journal Entry';
    }
  }

  onClose() {
    this.router.navigate(['../'], { relativeTo: this.route });
  }

  onDelete() {
    this.dialog
      .open(DialogModalComponent, {
        width: '450px',
        disableClose: true,
        data: {
          type: DialogType.Confirm,
          content: 'Are you sure you want to delete Journal Entry?'
        }
      })
      .afterClosed()
      .pipe(
        mergeMap(confirmed => {
          if (!confirmed) {
            return EMPTY;
          }

          return this.journalEntriesApiService.deleteJournalEntry(this.entry.id);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.router.navigate(['../'], { relativeTo: this.route });
      });
  }

  onEdit() {
    this.state = EntryPageStatesEnum.EDIT;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { edit: true }
    });
  }

  generateViewJournalEntryPDF() {
    this.spinnerService.setStatus(true);

    const body = document.querySelector('body');
    body.classList.add('print');
    const elementId = 'view-journal-entry';
    const filename = `journal_entry_${this.entry.number}.pdf`;

    this.printService.generatePDF(elementId, filename).then(pdf => {
      pdf.save(filename);
      body.classList.remove('print');
      this.spinnerService.setStatus(false);
    });
  }

  onResult(entry: JournalEntryEntity) {
    const isAddState = this.isAddState;

    if (!isAddState) {
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: null
      });
    }

    this.state = EntryPageStatesEnum.VIEW;

    if (!entry) {
      return;
    }

    this.entry = entry;

    if (isAddState) {
      this.router.navigate(['../', entry.id], { relativeTo: this.route });
    }
  }

  onOpenLog() {
    this.dialog
      .open(LogEntriesModalComponent, {
        disableClose: true,
        width: '800px',
        data: {
          logs: this.entry.log,
          members: this.members,
          name: 'Journal Entry'
        }
      })
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }

  private setPermissions(): void {
    this.permissions = this.journalEntriesService.getPermissions();
  }

  private loadData() {
    this.getJournalEntry()
      .pipe(
        mergeMap(() => this.getData()),
        finalize(() => this.cd.markForCheck()),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.isLoaded = true;
      });
  }

  private getJournalEntry() {
    const entryId = this.route.snapshot.paramMap.get('id');

    if (!entryId) {
      return of(null);
    }

    return this.journalEntriesApiService.getJournalEntry(entryId).pipe(
      tap(entry => (this.entry = entry)),
      catchError(({ error }) => {
        this.notificationHelperService.showValidation(error.message);
        this.router.navigate(['../'], { relativeTo: this.route });
        return EMPTY;
      })
    );
  }

  private getData() {
    return this.journalEntriesService.getData().pipe(
      tap(
        ([accounts, dimensions, groups, crmAccounts, members]: [
          AccountEntity[],
          DimensionEntity[],
          GroupEntity[],
          CrmAccountEntity[],
          MemberEntity[]
        ]) => {
          this.accountsList = accounts;
          this.dimensionsList = dimensions;
          this.groupsList = groups;
          this.crmAccountsList = crmAccounts;
          this.members = members;
        }
      )
    );
  }
}
