import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { NotificationHelperService } from '@services/helpers/notification-helper/notification-helper.service';
import { NavigationHelperService } from '@services/helpers/navigation-helper/navigation-helper.service';
import { Subject } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { TransactionsService } from '@app/services/app-layer/transactions/transactions.service';
import { TransactionStateEnum } from '@app/services/app-layer/app-layer.enums';
import { Environment } from '@services/app-layer/app-layer.environment';
import { AccessControlScope } from '@services/app-layer/permission/permission.interface';
import { OrderEntity } from '@app/services/app-layer/entities/order';
import { TransactionEntity } from '@services/app-layer/entities/transaction';
import { MatDialog } from '@angular/material/dialog';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-order-details',
  templateUrl: './order-details.component.html',
  styleUrls: ['./order-details.component.scss']
})
export class OrderDetailsComponent implements OnInit, OnDestroy {
  public transactionId: string;
  public isLoaded: boolean;

  public orderData: OrderEntity;
  public transactionsIds: string[];

  private destroy$ = new Subject<void>();

  public userPermissions = {
    canRead: false,
    canDelete: false,
    canCreate: false
  };

  public orderActions: { setOrderTransactions: (txs) => void };
  public orderTxs: TransactionEntity[] = [];
  isOrderTxsPassedQuote: boolean;

  constructor(
    private route: ActivatedRoute,
    private notificationHelperService: NotificationHelperService,
    private transactionsService: TransactionsService,
    private navigationHelperService: NavigationHelperService,
    private dialog: MatDialog,
    private changeDetector: ChangeDetectorRef
  ) {
    this.setUserPermissions();

    this.orderActions = {
      setOrderTransactions: txs => {
        this.orderTxs = txs;
        this.isOrderTxsPassedQuote = this.orderTxs.some(t => t.passedTheState(TransactionStateEnum.Quote));
      }
    };
  }

  ngOnInit() {
    const routeParamsChange$ = this.route.params.pipe(takeUntil(this.destroy$));
    routeParamsChange$.subscribe(params => {
      this.isLoaded = false;
      this.changeDetector.detectChanges();
      this.transactionId = params.transactionId;
      this.transactionsIds = [this.transactionId];
      this.isLoaded = true;
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.unsubscribe();
  }

  /*
   * Private Helpers
   * */
  private setUserPermissions(): void {
    const currentUser = Environment.getCurrentUser();

    const txPermissions = currentUser.normalizedAccessControlRoles.TRANSACTION.transactionSection.sectionGroup;
    this.userPermissions.canCreate = txPermissions.create.value === AccessControlScope.Company;

    this.userPermissions.canRead = true;

    // the case of owner permission is not considered here.
    this.userPermissions.canDelete =
      txPermissions.delete.value === AccessControlScope.Company ||
      txPermissions.delete.value === AccessControlScope.Owner;
  }
}
