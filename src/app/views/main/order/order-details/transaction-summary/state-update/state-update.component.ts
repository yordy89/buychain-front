import { Component, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { InventorySearchEntity } from '@services/app-layer/entities/inventory-search';
import { NotificationHelperService } from '@services/helpers/notification-helper/notification-helper.service';
import { TransactionSummaryService } from '@views/main/order/order-details/transaction-summary/transaction-summary.service';
import { catchError, first, mergeMap, takeUntil, tap } from 'rxjs/operators';
import { DialogModalComponent, DialogType } from '@components/common/modals/dialog-modal/dialog-modal.component';
import { combineLatest, EMPTY, Subject } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { SupplierFinanceReviewModalComponent } from '@views/main/order/order-details/transaction-summary/state-update/supplier-finance-review-modal/supplier-finance-review-modal.component';
import { TransactionEntity } from '@app/services/app-layer/entities/transaction';
import { TransactionsService } from '@app/services/app-layer/transactions/transactions.service';
import {
  ChangeTransactionTypesEnum,
  RoleInTransaction,
  TransactionStateEnum,
  TransactionStateReviewUpdateEnum,
  TransactionStateUpdateEnum
} from '@app/services/app-layer/app-layer.enums';
import { Environment } from '@services/app-layer/app-layer.environment';
import { AccessControlScope } from '@services/app-layer/permission/permission.interface';
import { ChangeTransactionModalComponent } from '@views/main/order/order-details/transaction-summary/state-update/change-transaction-modal/change-transaction-modal.component';
import { ShippingInfoEditModalComponent } from '@views/main/order/order-details/transaction-summary/shipping-info-edit-modal/shipping-info-edit-modal.component';
import { StateUpdateHelper } from '@views/main/order/order-details/transaction-summary/state-update/state-update-helper';

@Component({
  selector: 'app-state-update',
  templateUrl: './state-update.component.html',
  styleUrls: ['./state-update.component.scss']
})
export class StateUpdateComponent implements OnDestroy, OnChanges {
  @Input() transactionData: TransactionEntity;
  @Input() lots: InventorySearchEntity[];
  @Input() actions: any;
  private destroy$ = new Subject<void>();
  public TransactionStateEnum = TransactionStateEnum;
  public ChangeTransactionTypesEnum = ChangeTransactionTypesEnum;
  public RoleInTransaction = RoleInTransaction; // necessary in template to show review supplier finances button
  canUpdateState: boolean;
  canUpdateStateReview: boolean;
  transitionToQuoteStateAllowed: boolean;
  transitionToReviewStateAllowed: boolean;
  transitionToConfirmedStateAllowed: boolean;
  transitionToInTransitStateAllowed: boolean;
  draftStateTooltip: string;
  confirmedStateTooltip: string;
  quoteStateTooltip: string;
  reviewStateTooltip: string;

  hasOutstandingPurchaseContract = false;

  constructor(
    private stateUpdateHelper: StateUpdateHelper,
    private dialog: MatDialog,
    private transactionsService: TransactionsService,
    private transactionSummaryService: TransactionSummaryService,
    private notificationHelperService: NotificationHelperService
  ) {}

  ngOnChanges({ lots, transactionData }: SimpleChanges) {
    if (lots && lots.currentValue && this.transactionData.role === RoleInTransaction.Seller) {
      this.hasOutstandingPurchaseContract = this.lots.some(lot =>
        lot.products
          .filter(p => this.transactionData.tallyUnits.some(unit => unit.product.id === p.id))
          .some(product => product.brokerContract?.isOpen)
      );
    }

    if (transactionData?.currentValue) {
      this.canUpdateState = this.checkCanUpdateState();
      this.canUpdateStateReview = this.checkCanUpdateStateReview();
      this.draftStateTooltip = this.stateUpdateHelper.getDraftStateTooltip(this.transactionData);
      this.transitionToQuoteStateAllowed = this.stateUpdateHelper.hasCompleteInfoForQuote(this.transactionData);
      this.quoteStateTooltip = this.stateUpdateHelper.getQuoteStateTooltip(this.transactionData);
      this.transitionToReviewStateAllowed = this.stateUpdateHelper.hasCompleteInfoForReview(this.transactionData);
      this.confirmedStateTooltip = this.stateUpdateHelper.getConfirmedStateTooltip(this.transactionData);
      this.transitionToInTransitStateAllowed = this.checkTransitionToInTransitStateAllowed();
    }
    this.reviewStateTooltip = this.stateUpdateHelper.getReviewStateTooltip(
      this.transactionData,
      this.hasOutstandingPurchaseContract
    );
    this.transitionToConfirmedStateAllowed = this.checkTransitionToConfirmedStateAllowed();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.unsubscribe();
  }

  private checkCanUpdateState(): boolean {
    const transactionPermissions =
      Environment.getCurrentUser().normalizedAccessControlRoles.TRANSACTION.transactionSection.sectionGroup;
    return (
      transactionPermissions.updateState.value === AccessControlScope.Company ||
      (transactionPermissions.updateState.value === AccessControlScope.Owner && this.transactionData.isResourceOwner)
    );
  }

  private checkCanUpdateStateReview(): boolean {
    const transactionPermissions =
      Environment.getCurrentUser().normalizedAccessControlRoles.TRANSACTION.transactionSection.sectionGroup;
    return (
      transactionPermissions.updateStateReview.value === AccessControlScope.Company ||
      (transactionPermissions.updateStateReview.value === AccessControlScope.Owner &&
        this.transactionData.isResourceOwner)
    );
  }

  private checkTransitionToConfirmedStateAllowed(): boolean {
    return this.transactionData.isSales
      ? !this.hasOutstandingPurchaseContract && this.stateUpdateHelper.allTallyProductsAreActive(this.transactionData)
      : true; // if purchase tx, all are draft
  }

  private checkTransitionToInTransitStateAllowed(): boolean {
    return this.transactionData.isSales
      ? !this.stateUpdateHelper.tallyHasOutstandingProducts(this.transactionData)
      : this.stateUpdateHelper.tallyRLUProductsAreComplete(this.transactionData);
  }

  public goToQuoteState(): void {
    this.updateTransactionState(TransactionStateUpdateEnum.Quote);
  }

  public goToReviewState(): void {
    this.dialog
      .open(DialogModalComponent, {
        width: '450px',
        disableClose: true,
        data: {
          type: DialogType.Confirm,
          content: 'Are you sure you want to Approve the transaction?'
        }
      })
      .afterClosed()
      .subscribe(confirmed => {
        if (confirmed) this.updateTransactionState(TransactionStateUpdateEnum.Review);
      });
  }

  public goToConfirmState(): void {
    this.dialog
      .open(DialogModalComponent, {
        width: '450px',
        disableClose: true,
        data: {
          type: DialogType.Confirm,
          content: 'Are you sure you want to Approve the transaction?'
        }
      })
      .afterClosed()
      .subscribe(confirmed => {
        if (confirmed) {
          this.transactionsService
            .updateTransactionStateReview(this.transactionData.id, {
              state: TransactionStateReviewUpdateEnum.Confirmed
            })
            .subscribe(response => this.updateTransactionOnStateChange(<TransactionStateEnum>response.state));
        }
      });
  }

  public goToChangePending(): void {
    this.dialog
      .open(ChangeTransactionModalComponent, {
        width: '450px',
        disableClose: true,
        data: this.transactionData
      })
      .afterClosed()
      .subscribe(type => {
        if (type === ChangeTransactionTypesEnum.ModifyTransport) {
          this.dialog
            .open(ShippingInfoEditModalComponent, {
              width: '90%',
              disableClose: true,
              data: this.transactionData
            })
            .afterClosed()
            .pipe(first())
            .subscribe(submitted => {
              if (submitted) this.updateTransactionOnStateChange(TransactionStateEnum.ChangePending);
            });
        }
      });
  }

  public changePendingAccept(): void {
    this.transactionsService
      .updateTransactionStateFromChangePending(this.transactionData.id, { status: true })
      .subscribe(response =>
        this.updateTransactionOnStateChange(
          <TransactionStateEnum>response.state,
          false,
          TransactionStateEnum.ChangePending
        )
      );
  }
  public changePendingReject(): void {
    this.transactionsService
      .updateTransactionStateFromChangePending(this.transactionData.id, { status: false })
      .subscribe(response => this.updateTransactionOnStateChange(<TransactionStateEnum>response.state, true));
  }

  public goToInTransitState(): void {
    this.dialog
      .open(DialogModalComponent, {
        width: '450px',
        disableClose: true,
        data: {
          type: DialogType.Confirm,
          content: 'Are you sure you want to move the transaction to state "In Transit"?'
        }
      })
      .afterClosed()
      .subscribe(confirmed => {
        if (confirmed) this.updateTransactionState(TransactionStateUpdateEnum.InTransit);
      });
  }

  public openFinanceReview(): void {
    this.dialog.open(SupplierFinanceReviewModalComponent, {
      width: '90%',
      disableClose: true,
      data: this.transactionData
    });
  }

  public goBackToQuoteState(): void {
    this.transactionsService
      .updateTransactionStateReview(this.transactionData.id, { state: TransactionStateReviewUpdateEnum.Quote })
      .pipe(takeUntil(this.destroy$))
      .subscribe(response => this.updateTransactionOnStateChange(<TransactionStateEnum>response.state));
  }

  /*
   * private helpers
   * */

  private updateTransactionOnStateChange(
    state: TransactionStateEnum,
    skipPDFGeneration = false,
    prevState?: TransactionStateEnum
  ): void {
    this.transactionSummaryService
      .loadTransactionById(this.transactionData.id)
      .pipe(
        tap(tx => (this.transactionData = new TransactionEntity().init(tx))),
        mergeMap(() => this.transactionsService.loadMilestones(this.transactionData)),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        if (!skipPDFGeneration) this.generatePdfDocs(state, prevState);
        this.actions.onStateUpdate(this.transactionData);
      });
  }

  private generatePdfDocs(state: TransactionStateEnum, prevState?: TransactionStateEnum) {
    const loads = [];
    const companyAutoInvoiceGenerationMode = Environment.getCurrentCompany().accountingPractices.autoInvoicingMethod;
    if (
      state === TransactionStateEnum.InTransit &&
      companyAutoInvoiceGenerationMode === 'SHIPPED' &&
      this.transactionData.isSales
    ) {
      loads.push(this.stateUpdateHelper.generateInvoicePdf(this.transactionData));
    }

    if (
      state === TransactionStateEnum.Confirmed ||
      (state === TransactionStateEnum.InTransit && prevState === TransactionStateEnum.ChangePending)
    ) {
      loads.push(this.stateUpdateHelper.generateOrderConfirmationPdf(this.transactionData));

      if (this.transactionData.isSales) {
        loads.push(this.stateUpdateHelper.generateBillOfLadingPdf(this.transactionData));
        loads.push(this.stateUpdateHelper.generatePickSheetPdf(this.transactionData));

        if (companyAutoInvoiceGenerationMode === 'BOOKED') {
          loads.push(this.stateUpdateHelper.generateInvoicePdf(this.transactionData));
        }
      }
    }

    if (loads.length) combineLatest(loads).subscribe();
  }

  private updateTransactionState(state: TransactionStateUpdateEnum): void {
    this.transactionsService
      .updateTransactionState(this.transactionData.id, { state })
      .pipe(
        first(),
        catchError(({ error }) => {
          if (
            error.status === 403 &&
            error.message === 'There is no transition from current state to the requested one.'
          ) {
            this.notificationHelperService.showValidation(
              'The transaction state has already been updated. Please refresh the page to get an updated data.'
            );
          } else if (error.status === 409) {
            this.notificationHelperService.showValidation('Some lots of tally are allocated in another transaction.');
          } else {
            this.notificationHelperService.showValidation(
              'Something unexpected happened. Please reload and try again.'
            );
          }
          return EMPTY;
        })
      )
      .subscribe(data => this.updateTransactionOnStateChange(<TransactionStateEnum>data.state));
  }
}
