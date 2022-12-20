import { Component, Input, OnDestroy } from '@angular/core';
import { AddMilestoneModalComponent } from '@views/main/order/order-details/transaction-summary/add-milestone-modal/add-milestone-modal.component';
import { first, map, takeUntil } from 'rxjs/operators';
import { MilestoneEntity, TransactionEntity } from '@services/app-layer/entities/transaction';
import { TransactionMessagingModalComponent } from '@views/main/common/modals/transaction-messaging-modal/transaction-messaging-modal.component';
import { MatDialog } from '@angular/material/dialog';
import { MilestoneService } from '@services/app-layer/milestone/milestone.service';
import { TransactionsService } from '@services/app-layer/transactions/transactions.service';
import { combineLatest, Observable, Subject } from 'rxjs';
import { AccessControlScope } from '@services/app-layer/permission/permission.interface';
import { Environment } from '@services/app-layer/app-layer.environment';
import { CompaniesService } from '@services/app-layer/companies/companies.service';
import { MemberEntity } from '@services/app-layer/entities/member';
import { LogEntriesModalComponent } from '@views/main/common/modals/log-entries-modal/log-entries-modal.component';
import { SearchService } from '@services/app-layer/search/search.service';

@Component({
  selector: 'app-milestones',
  templateUrl: './milestones.component.html',
  styleUrls: ['./milestones.component.scss']
})
export class MilestonesComponent implements OnDestroy {
  @Input() transactionData: TransactionEntity;

  public companyMembers: MemberEntity[];

  get canUpdateMilestones(): boolean {
    return this.getUserPermissions();
  }

  private destroy$ = new Subject<void>();

  constructor(
    private dialog: MatDialog,
    private milestoneService: MilestoneService,
    private transactionsService: TransactionsService,
    private searchService: SearchService,
    private companiesService: CompaniesService
  ) {}

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  public openAddMilestoneModal(): void {
    this.dialog
      .open(AddMilestoneModalComponent, {
        width: '700px',
        disableClose: false,
        data: this.transactionData
      })
      .afterClosed()
      .pipe(first())
      .subscribe(data => {
        if (data) {
          this.transactionsService.loadMilestones(this.transactionData).pipe(takeUntil(this.destroy$)).subscribe();
        }
      });
  }

  public downloadDocument(milestone: MilestoneEntity): void {
    if (milestone.attachment) {
      this.milestoneService
        .getDocumentUrl(milestone.attachment.key)
        .pipe(first())
        .subscribe(url => {
          window.open(url, '_blank');
        });
    }
  }

  public openMessagingDialog(): void {
    this.dialog
      .open(TransactionMessagingModalComponent, {
        width: '700px',
        disableClose: true,
        data: this.transactionData
      })
      .afterClosed()
      .subscribe();
  }

  private getUserPermissions(): boolean {
    const transactionPermissions =
      Environment.getCurrentUser()?.normalizedAccessControlRoles.TRANSACTION.transactionSection.sectionGroup;

    return (
      transactionPermissions.updateMilestones.value === AccessControlScope.Company ||
      (transactionPermissions.updateMilestones.value === AccessControlScope.Owner &&
        this.transactionData.isResourceOwner)
    );
  }

  public openTransactionLog(): void {
    const load = [this.loadTransactionLog()];
    if (!this.companyMembers?.length) load.push(this.loadCompanyMembers());
    combineLatest(load)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.dialog.open(LogEntriesModalComponent, {
          width: '800px',
          disableClose: true,
          data: { logs: this.transactionData.log, members: this.companyMembers, name: 'Transaction' }
        });
      });
  }

  private loadTransactionLog(): Observable<any> {
    const payload = {
      filters: { value: { comparisonOperator: 'eq', field: 'id', fieldValue: this.transactionData.id } },
      fields: ['log']
    };
    return this.searchService
      .fetchTransactionData(payload)
      .pipe(map(transactions => (this.transactionData.log = transactions[0].log)));
  }

  private loadCompanyMembers(): Observable<any> {
    return this.companiesService.getCompanyCompleteMembers().pipe(map(members => (this.companyMembers = members)));
  }
}
