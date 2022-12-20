import { Injectable } from '@angular/core';
import { AccessControlScope } from '@services/app-layer/permission/permission.interface';
import { TransactionEntity } from '@services/app-layer/entities/transaction';
import { RoleInTransaction, TransactionStateEnum } from '@services/app-layer/app-layer.enums';
import { Environment } from '@services/app-layer/app-layer.environment';
import { TransactionsService } from '@services/app-layer/transactions/transactions.service';
import { NavigationHelperService } from '@services/helpers/navigation-helper/navigation-helper.service';
import { NotificationHelperService } from '@services/helpers/notification-helper/notification-helper.service';
import { InventorySearchHelperService } from '@views/main/common/inventory/inventory-search/inventory-search.helper.service';
import { EMPTY, of, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class TransactionSummaryService {
  constructor(
    private transactionsService: TransactionsService,
    private navigationHelperService: NavigationHelperService,
    private notificationHelperService: NotificationHelperService,
    private inventorySearchHelperService: InventorySearchHelperService
  ) {}

  loadTransactionTallyLotsForSeller(transactionData: TransactionEntity) {
    let lots = of([]);

    if (transactionData.role === RoleInTransaction.Seller) {
      const tallyUnits = transactionData.isPurchasedTally
        ? transactionData.tally.tallyLots
        : transactionData.tallyUnitsByLot;

      const lotsIds = tallyUnits.map(item => item.lot);

      if (!lotsIds?.length) {
        return lots;
      }

      const fields = [
        'lot',
        'spec',
        'salesData',
        'dateHistory',
        'priceHistory',
        'brokerContract',
        'supplyContract',
        'allocatedTransactionId'
      ];

      lots = this.inventorySearchHelperService.loadLotsByIds(lotsIds, fields);
    }

    return lots;
  }

  loadTransactionById(id: string) {
    return this.transactionsService.loadTransactionById(id).pipe(
      catchError((error: Error) => {
        if (error.message === 'not available') {
          this.notificationHelperService.showValidation(
            'You do not have enough permissions to access this Transaction'
          );
          this.navigationHelperService.navigateToOrdersOverview();
          return EMPTY;
        }

        return throwError(() => error);
      })
    );
  }

  public getUserPermissionsForTx(transactionData: TransactionEntity): any {
    const userPermissions = {
      canUpdateTally: false,
      canUpdateTrackingData: false,
      canUpdatePrivateData: false,
      canDeleteTransaction: false
    };
    if (!transactionData) return userPermissions;
    const transactionPermissions =
      Environment.getCurrentUser().normalizedAccessControlRoles.TRANSACTION.transactionSection.sectionGroup;

    const tallyEditableState =
      transactionData.state === TransactionStateEnum.Quote || transactionData.state === TransactionStateEnum.Draft;

    userPermissions.canUpdateTally =
      tallyEditableState &&
      (transactionPermissions.updateTally.value === AccessControlScope.Company ||
        (transactionPermissions.updateTally.value === AccessControlScope.Owner && transactionData.isResourceOwner));
    userPermissions.canUpdateTrackingData =
      transactionPermissions.updateTrackingData.value === AccessControlScope.Company ||
      (transactionPermissions.updateTrackingData.value === AccessControlScope.Owner && transactionData.isResourceOwner);
    userPermissions.canUpdatePrivateData =
      transactionPermissions.updatePrivateData.value === AccessControlScope.Company ||
      (transactionPermissions.updatePrivateData.value === AccessControlScope.Owner && transactionData.isResourceOwner);

    userPermissions.canDeleteTransaction =
      !transactionData.passedTheState(TransactionStateEnum.Quote) &&
      (transactionPermissions.delete.value === AccessControlScope.Company ||
        (transactionPermissions.delete.value === AccessControlScope.Owner && transactionData.isResourceOwner));
    return userPermissions;
  }
}
