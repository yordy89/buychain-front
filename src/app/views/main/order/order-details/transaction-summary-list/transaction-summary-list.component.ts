import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { TransactionSummaryService } from '@views/main/order/order-details/transaction-summary/transaction-summary.service';
import { first, takeUntil } from 'rxjs/operators';
import { NavigationHelperService } from '@services/helpers/navigation-helper/navigation-helper.service';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, Subject } from 'rxjs';
import { Layout } from '@services/helpers/layout-helper/layout-helper.service';
import { TransactionsService } from '@app/services/app-layer/transactions/transactions.service';
import { TransactionEntity } from '@app/services/app-layer/entities/transaction';
import { Environment } from '@services/app-layer/app-layer.environment';
import { AccessControlScope } from '@services/app-layer/permission/permission.interface';
import { User } from '@app/services/app-layer/entities/user';
import { OrderEntity } from '@app/services/app-layer/entities/order';
import { RoleInTransaction, TransactionStateEnum } from '@services/app-layer/app-layer.enums';
import { SearchService } from '@services/app-layer/search/search.service';
import { NotificationHelperService } from '@services/helpers/notification-helper/notification-helper.service';

@Component({
  selector: 'app-transaction-summary-list',
  templateUrl: './transaction-summary-list.component.html',
  styleUrls: ['./transaction-summary-list.component.scss']
})
export class TransactionSummaryListComponent implements OnInit, OnDestroy {
  @Input() order: OrderEntity;
  @Input() transactionsIds: string[];
  @Input() orderActions: { setOrderTransactions: (transactions) => void };

  public TransactionStateEnum = TransactionStateEnum;

  public currentOrderTransactions$: BehaviorSubject<TransactionEntity[]> = new BehaviorSubject<TransactionEntity[]>([]);

  private destroy$ = new Subject<void>();
  public orderTransactions: TransactionEntity[] = [];
  public orderNormalizedTransactions: TransactionEntity[];
  public expandedTransactionId = '';
  public currentUser: User;
  public userPermissions = {
    canCreateTransaction: false,
    canDeleteOrder: false,
    canReadTransactions: false,
    canReadOnlyOwnTx: false
  };
  otherPartyRole: RoleInTransaction;
  isSales: boolean;

  readonly transactionUrl = location.href;
  readonly otherPartyStatus = 'Offline';

  constructor(
    private dialog: MatDialog,
    private navigationHelperService: NavigationHelperService,
    private notificationHelperService: NotificationHelperService,
    private route: ActivatedRoute,
    private transactionsService: TransactionsService,
    private transactionSummaryService: TransactionSummaryService,
    private searchService: SearchService
  ) {}

  ngOnInit() {
    this.currentUser = Environment.getCurrentUser();
    this.setUserPermissions();

    if (this.userPermissions.canReadTransactions) {
      const payload = {
        filters: {
          children: {
            logicalOperator: 'or',
            items: this.transactionsIds.map(id => ({
              value: { comparisonOperator: 'eq', field: 'id', fieldValue: id }
            }))
          }
        }
      };
      this.searchService
        .fetchTransactionData(payload)
        .pipe(takeUntil(this.destroy$))
        .subscribe(transactions => {
          if (!transactions.length) return this.navigationHelperService.navigateToOrdersOverview();
          transactions = transactions.map(t => new TransactionEntity().init(t));
          this.setExpandedTransactionId(transactions);
          this.currentOrderTransactions$.next(transactions);
          this.orderActions.setOrderTransactions(transactions);
        });
    }

    this.currentOrderTransactions$.pipe(takeUntil(this.destroy$)).subscribe((transactions: TransactionEntity[]) => {
      this.orderTransactions = transactions;
      this.otherPartyRole = this.checkOtherPartyRole();
      this.isSales = this.checkIfSales();
      this.orderActions.setOrderTransactions(transactions);
      transactions.forEach((transaction, index) => {
        transactions[index].isExpanded = this.expandedTransactionId === transaction.id;
      });
      this.orderNormalizedTransactions = transactions;
    });
  }
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.unsubscribe();
  }
  public trackByFn(index, transaction) {
    return transaction.id;
  }

  public checkOtherPartyRole(): RoleInTransaction {
    if (!this.orderTransactions?.length) {
      return;
    }
    const tx = this.orderTransactions[0];
    if (tx.role === RoleInTransaction.Seller) return RoleInTransaction.Buyer;
    if (tx.role === RoleInTransaction.Buyer) return RoleInTransaction.Seller;
  }

  private checkIfSales(): boolean {
    if (!this.orderTransactions?.length) {
      return false;
    }
    const tx = this.orderTransactions[0];
    return tx.role === RoleInTransaction.Seller;
  }

  public onTransactionDelete(transactionId): void {
    this.orderTransactions = this.orderTransactions.filter(item => item.id !== transactionId);
    this.currentOrderTransactions$.next(this.orderTransactions);

    this.navigationHelperService.goToMainLayout(Layout.Order);
  }

  private setExpandedTransactionId(transactions): void {
    this.route.queryParams.pipe(first()).subscribe(param => {
      if (param.transactionId) this.expandedTransactionId = param.transactionId;
      else this.expandedTransactionId = transactions[0].id;
    });
  }

  private setUserPermissions(): void {
    const transactionPermissions =
      this.currentUser.normalizedAccessControlRoles.TRANSACTION.transactionSection.sectionGroup;

    this.userPermissions.canCreateTransaction =
      transactionPermissions.create.value === AccessControlScope.Company ||
      transactionPermissions.create.value === AccessControlScope.Owner;
    this.userPermissions.canReadTransactions =
      transactionPermissions.readList.value === AccessControlScope.Company ||
      transactionPermissions.readList.value === AccessControlScope.Owner;
    this.userPermissions.canReadOnlyOwnTx = transactionPermissions.readList.value === AccessControlScope.Owner;
  }
}
