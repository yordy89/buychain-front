import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { InventorySearchEntity } from '@services/app-layer/entities/inventory-search';
import { OrderPdfService } from '@views/main/order/order-pdf-templates/order-pdf.service';
import { first, map, takeUntil, tap } from 'rxjs/operators';
import { BehaviorSubject, combineLatest, Subject } from 'rxjs';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { FormGroupHelper } from '@services/helpers/utils/form-group-helper';
import { MilestoneService } from '@services/app-layer/milestone/milestone.service';
import { AddOffbookProductModalComponent } from './add-offbook-product-modal/add-offbook-product-modal.component';
import { ShippingInfoEditModalComponent } from './shipping-info-edit-modal/shipping-info-edit-modal.component';
import { AddProductLotModalComponent } from '@views/main/order/order-details/transaction-summary/add-product-lot-modal/add-product-lot-modal.component';
import { TransactionsService } from '@app/services/app-layer/transactions/transactions.service';
import {
  ChangeTransactionTypesEnum,
  RoleInTransaction,
  TransactionStateEnum
} from '@app/services/app-layer/app-layer.enums';
import { TransactionEntity } from '@app/services/app-layer/entities/transaction';
import { Environment } from '@services/app-layer/app-layer.environment';
import { User } from '@app/services/app-layer/entities/user';
import { ReportsService } from '@app/services/app-layer/reports/reports.service';
import { DialogModalComponent, DialogType } from '@app/components/common/modals/dialog-modal/dialog-modal.component';
import { TransactionSummaryService } from '@views/main/order/order-details/transaction-summary/transaction-summary.service';
import { OrdersOverviewHelperService } from '@views/main/order/orders-overview/orders-overview.helper.service';

@Component({
  selector: 'app-transaction-summary',
  templateUrl: './transaction-summary.component.html',
  styleUrls: ['./transaction-summary.component.scss']
})
export class TransactionSummaryComponent implements OnInit, OnDestroy, OnChanges {
  @Input() transactionData: TransactionEntity;
  @Input() currentOrderTransactions$: BehaviorSubject<TransactionEntity[]> = new BehaviorSubject<TransactionEntity[]>(
    []
  );
  @Output() transactionDeleted = new EventEmitter<string>();

  public RoleInTransaction = RoleInTransaction;
  public TransactionStateEnum = TransactionStateEnum;

  public transactionForm: FormGroup;
  public transactionDescription: FormControl;
  public transactionInternalNotes: FormControl;
  public estimatedShipDate: FormControl;

  lots: InventorySearchEntity[] = [];

  private destroy$ = new Subject<void>();

  public actions: { onStateUpdate: (tx: TransactionEntity) => void; onTrackingDataUpdate: () => void };

  public currentUser: User;
  public userPermissions = {
    canUpdateTally: false,
    canUpdateTrackingData: false,
    canUpdatePrivateData: false,
    canDeleteTransaction: false
  };

  public companyAutoInvoiceGenerationMode = Environment.getCurrentCompany().accountingPractices.autoInvoicingMethod;
  public isLoaded = false;

  // ToDo: dev-mode remove after reviews
  public docGenButtonsVisibility = false;
  public orderConfirmationMode = false;
  public invoiceMode = false;
  public pickSheetMode = false;
  public billOfLadingMode = false;
  public billOfLadingData: any = {};
  public orderConfirmationData: any = {};
  public invoiceData: any = {};
  public pickTicketData: any = {};

  public environment = Environment;
  public isOnlineTransactionsEnabled: boolean;
  isModifyTransportState: boolean;

  constructor(
    private dialog: MatDialog,
    private milestoneService: MilestoneService,
    private transactionsService: TransactionsService,
    private pdfService: OrderPdfService,
    private reportsService: ReportsService,
    private transactionSummaryService: TransactionSummaryService,
    private ordersOverviewHelperService: OrdersOverviewHelperService
  ) {
    this.isOnlineTransactionsEnabled = !Environment.isOnlyOffline();
  }

  ngOnInit() {
    this.createFormControls();
    this.createForm();
    this.currentUser = Environment.getCurrentUser();
    this.setUserPermissions();

    this.actions = {
      onStateUpdate: (tx: TransactionEntity) => this.onTransactionStateUpdate(tx),
      onTrackingDataUpdate: () => this.onTransactionTrackingDataUpdate()
    };

    this.setInitialData();

    const load$ = [];

    load$.push(this.transactionsService.loadPrivateData(this.transactionData));
    load$.push(this.transactionsService.loadMilestones(this.transactionData));
    // dev mode only
    if (
      this.transactionData.tally.tallyLots.length > 0 &&
      (this.orderConfirmationMode || this.invoiceMode || this.pickSheetMode || this.billOfLadingMode)
    ) {
      load$.push(
        this.reportsService.getBillOfLading(this.transactionData.id).pipe(
          map(data => {
            this.billOfLadingData = data;
          })
        )
      );
      load$.push(
        this.reportsService.getOrderConfirmation(this.transactionData.id).pipe(
          map(data => {
            this.orderConfirmationData = data;
          })
        )
      );
      load$.push(
        this.reportsService.getInvoice(this.transactionData.id).pipe(
          map(data => {
            this.invoiceData = data;
          })
        )
      );
      load$.push(
        this.reportsService.getPickTicket(this.transactionData.id).pipe(
          map(data => {
            this.pickTicketData = data;
          })
        )
      );
    }

    combineLatest(load$)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.setPrivateNoteInputValidators();
        this.updateCurrentOrderTransactions(this.transactionData);
        this.isLoaded = true;
      });
  }

  ngOnChanges({ transactionData }: SimpleChanges) {
    if (transactionData && transactionData.currentValue) {
      this.loadTransactionTallyLotsForSeller();
      this.isModifyTransportState = this.checkIfIsModifyTransportState();
    }
  }

  private checkIfIsModifyTransportState() {
    return (
      this.transactionData.state === TransactionStateEnum.ChangePending &&
      this.transactionData.changePending &&
      this.transactionData.changePending.type === ChangeTransactionTypesEnum.ModifyTransport
    );
  }

  public openAddProductModal(): void {
    this.dialog
      .open(AddProductLotModalComponent, {
        width: '99%',
        maxWidth: '1480px',
        maxHeight: '98vh',
        panelClass: 'no-dialog-margin',
        disableClose: true,
        data: { transactionData: this.transactionData, lots: this.lots }
      })
      .afterClosed()
      .pipe(first())
      .subscribe(() => {
        this.onTransactionTallyUpdate().pipe(takeUntil(this.destroy$)).subscribe();
      });
  }

  public openAddOffMarketProductModal() {
    this.dialog
      .open(AddOffbookProductModalComponent, {
        width: '95%',
        disableClose: true,
        data: this.transactionData
      })
      .afterClosed()
      .pipe(first())
      .subscribe(data => {
        if (data) {
          this.onTransactionTallyUpdate()
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => this.openShippingEditModal());
        }
      });
  }

  public openShippingEditModal(): void {
    this.dialog
      .open(ShippingInfoEditModalComponent, {
        maxWidth: '96vw',
        disableClose: true,
        data: this.transactionData
      })
      .afterClosed()
      .pipe(first())
      .subscribe(submitted => {
        if (submitted) this.onTransactionTrackingDataUpdate();
      });
  }

  public updateTransactionDescription(): void {
    if (this.transactionData.tally.contentDescription === this.transactionDescription.value) return;
    if (this.transactionDescription.invalid) {
      return FormGroupHelper.markControlTouchedAndDirty(this.transactionDescription);
    }

    this.transactionsService
      .updateTransactionTally(this.transactionData.id, { contentDescription: this.transactionDescription.value })
      .pipe(takeUntil(this.destroy$))
      .subscribe(tally => (this.transactionData.tally.contentDescription = tally.contentDescription));
  }

  public updateInternalNotes(): void {
    const notes = this.transactionData.trackingData?.privateData?.notes;
    if (notes === this.transactionInternalNotes.value || (!notes && !this.transactionInternalNotes.value)) return;
    if (this.transactionInternalNotes.invalid) {
      return FormGroupHelper.markControlTouchedAndDirty(this.transactionInternalNotes);
    }
    this.transactionsService
      .updateTransactionPrivateData(this.transactionData.id, { notes: this.transactionInternalNotes.value })
      .pipe(takeUntil(this.destroy$))
      .subscribe(privateData => (this.transactionData.trackingData.privateData = privateData));
  }

  public updatePurchaseOrderNumber(value) {
    return this.transactionsService.updateTransactionTrackingData(this.transactionData.id, { PONumber: value }).pipe(
      map(trackingData => {
        this.transactionData.trackingData.purchaseOrderNumber = trackingData.purchaseOrderNumber;
      })
    );
  }

  public updateSalesOrderNumber(value) {
    return this.transactionsService.updateTransactionTrackingData(this.transactionData.id, { SONumber: value }).pipe(
      map(trackingData => {
        this.transactionData.trackingData.salesOrderNumber = trackingData.salesOrderNumber;
      })
    );
  }

  public deleteTransaction(): void {
    this.dialog
      .open(DialogModalComponent, {
        width: '600px',
        disableClose: true,
        data: {
          type: DialogType.Confirm,
          content:
            `You are about to permanently delete transaction ${this.transactionData.transactionNumber}.` +
            ' IF you delete this transaction it will no longer be retrievable.' +
            ' Additional all notes, chat logs and milestones including attached documents will also be deleted.' +
            ' If any of this information is important please click cancel and back it up manually now.'
        }
      })
      .afterClosed()
      .subscribe(confirmed => {
        if (confirmed) {
          this.transactionsService
            .deleteTransaction(this.transactionData.id)
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => {
              this.ordersOverviewHelperService.transactionRemoved(this.transactionData.id);
              this.transactionDeleted.emit(this.transactionData.id);
            });
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.unsubscribe();
  }

  /*
   * private helpers
   * */

  private createFormControls(): void {
    this.transactionDescription = new FormControl('', [Validators.maxLength(900)]);
    this.transactionInternalNotes = new FormControl('', [Validators.maxLength(900)]);
    this.estimatedShipDate = new FormControl();
  }

  private createForm(): void {
    this.transactionForm = new FormGroup({
      transactionDescription: this.transactionDescription,
      transactionInternalNotes: this.transactionInternalNotes,
      estimatedShipDate: this.estimatedShipDate
    });
  }

  private setInitialData(): void {
    this.transactionDescription.setValue(this.transactionData.tally.contentDescription);
    if (!this.userPermissions.canUpdateTally || this.transactionData.state === TransactionStateEnum.Canceled) {
      this.transactionDescription.disable({ emitEvent: false });
    }
    this.setEstimatedShipDate();
  }

  private setEstimatedShipDate(): void {
    this.estimatedShipDate.setValue(
      this.transactionData.trackingData.estimatedShipDate || this.transactionData.tallyShipDate
    );
  }

  private setPrivateNoteInputValidators(): void {
    this.transactionInternalNotes.setValue(this.transactionData.trackingData.privateData?.notes);
    if (!this.userPermissions.canUpdatePrivateData) this.transactionInternalNotes.disable({ emitEvent: false });
  }

  public updateTxOnTallyUpdate(): void {
    this.onTransactionTallyUpdate().pipe(takeUntil(this.destroy$)).subscribe();
  }

  private onTransactionTallyUpdate() {
    return this.transactionSummaryService.loadTransactionById(this.transactionData.id).pipe(
      first(),
      tap(tx => this.updateTransactionLoadedData(tx))
    );
  }

  private loadTransactionTallyLotsForSeller() {
    this.transactionSummaryService
      .loadTransactionTallyLotsForSeller(this.transactionData)
      .pipe(
        first(),
        tap((items: InventorySearchEntity[]) => (this.lots = items))
      )
      .subscribe();
  }

  private onTransactionTrackingDataUpdate(): void {
    this.transactionSummaryService
      .loadTransactionById(this.transactionData.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe(tx => this.updateTransactionLoadedData(tx));
  }

  private updateTransactionLoadedData(tx: TransactionEntity): void {
    tx.milestones = this.transactionData.milestones;
    this.transactionData = new TransactionEntity().init(tx);
    this.setUserPermissions();
    this.updateCurrentOrderTransactions(this.transactionData);
    this.setInitialData();
  }

  private onTransactionStateUpdate(tx: TransactionEntity) {
    this.transactionData = tx;
    this.updateCurrentOrderTransactions(this.transactionData);
    this.setUserPermissions();
    this.transactionData.state !== TransactionStateEnum.Quote
      ? this.transactionDescription.disable({ emitEvent: false })
      : this.transactionDescription.enable({ emitEvent: false });
  }

  private updateCurrentOrderTransactions(transaction: TransactionEntity): void {
    this.currentOrderTransactions$.pipe(first()).subscribe((transactions: TransactionEntity[]) => {
      transactions = transactions.map(item => (item.id === transaction.id ? this.transactionData : item));
      this.currentOrderTransactions$.next(transactions);
    });
  }

  private setUserPermissions(): void {
    this.userPermissions = this.transactionSummaryService.getUserPermissionsForTx(this.transactionData);
    this.userPermissions.canUpdatePrivateData
      ? this.transactionInternalNotes.enable({ emitEvent: false })
      : this.transactionInternalNotes.disable({ emitEvent: false });
    this.userPermissions.canUpdateTally
      ? this.transactionDescription.enable({ emitEvent: false })
      : this.transactionDescription.disable({ emitEvent: false });
  }
}
