import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { SelectedTransportMethod, TransactionEntity } from '@app/services/app-layer/entities/transaction';
import { endOfDay } from 'date-fns';
import { Subject } from 'rxjs';
import { takeUntil, map } from 'rxjs/operators';
import { TransportMethodType } from '@app/services/app-layer/entities/facility';
import { TransactionsService } from '@app/services/app-layer/transactions/transactions.service';
import { TransactionStateEnum, TransportTermEnum } from '@app/services/app-layer/app-layer.enums';
import { NotificationHelperService } from '@services/helpers/notification-helper/notification-helper.service';

interface ModifiedProperty {
  isModified: boolean;
  value: any;
}

@Component({
  selector: 'app-transportation-info',
  templateUrl: './transportation-info.component.html',
  styleUrls: ['./transportation-info.component.scss']
})
export class TransportationInfoComponent implements OnInit, OnDestroy {
  @Input() transactionData: TransactionEntity;
  @Input() userPermissions: any;
  @Input() isModified: boolean;
  public transportTypes = TransportMethodType;
  public TransactionStateEnum = TransactionStateEnum;

  public modifiedTransportData: {
    estimatedShipDate: ModifiedProperty;
    transportation: ModifiedProperty;
    freightTerm: ModifiedProperty;
    shippingCost: ModifiedProperty;
  };

  get minEstimatedShipDate(): Date {
    return this.transactionData.tallyShipDate || new Date();
  }

  get transportMethod(): SelectedTransportMethod {
    return this.transactionData?.trackingData?.selectedTransportMethod || <SelectedTransportMethod>{};
  }
  get freightTerms(): TransportTermEnum {
    return this.transactionData?.trackingData?.transportTerm;
  }

  private destroy$ = new Subject<void>();

  constructor(
    private transactionService: TransactionsService,
    private notificationService: NotificationHelperService
  ) {}

  ngOnInit() {
    if (this.isModified) this.setModifiedTransportation();
  }

  public updateRailCarNumber(newValue) {
    return this.update('railCarNumber', newValue);
  }

  public updateNotes(newValue) {
    return this.update('notes', newValue);
  }

  updateShipDate(newValue: Date) {
    if (newValue) newValue = endOfDay(newValue);
    const payload = { estimatedShipDate: newValue || null };
    return this.transactionService.updateTransactionTrackingData(this.transactionData.id, payload).pipe(
      takeUntil(this.destroy$),
      map(trackingData => {
        this.transactionData.trackingData.estimatedShipDate = trackingData.estimatedShipDate;
        this.transactionData = new TransactionEntity().init(this.transactionData);
        if (!trackingData.estimatedShipDate)
          this.notificationService.showSuccess('Ship week estimate is set to default date.');
      })
    );
  }

  public get canEditShipDate() {
    return (
      this.userPermissions.canUpdateTrackingData && !this.transactionData.passedTheState(TransactionStateEnum.Quote)
    );
  }

  private update(field, newValue) {
    const payload = { [field]: newValue };
    return this.transactionService.updateTransportMethod(this.transactionData.id, payload).pipe(
      takeUntil(this.destroy$),
      map(selectedTransportMethod => {
        this.transactionData.trackingData.selectedTransportMethod = selectedTransportMethod;
      })
    );
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.unsubscribe();
  }

  private setModifiedTransportation(): void {
    const modifiedData = this.transactionData.changePending ? this.transactionData.changePending.transport : null;
    if (!modifiedData) return;

    const estimatedShipDate = modifiedData.estimatedShipDate || this.transactionData.shipDate;
    const transportMethod = modifiedData.transportMethod || this.transportMethod;
    const shippingCost =
      modifiedData.shippingCost || modifiedData.shippingCost === 0
        ? modifiedData.shippingCost
        : this.transactionData.costData.shippingCost;
    const freightTerm = modifiedData.transportTerm || this.transactionData.trackingData.transportTerm;
    this.modifiedTransportData = {
      estimatedShipDate: {
        value: estimatedShipDate,
        isModified: !(new Date(estimatedShipDate).getTime() === new Date(this.transactionData.shipDate).getTime())
      },
      transportation: {
        value: transportMethod,
        isModified: !(
          !transportMethod ||
          (transportMethod.type === this.transportMethod.type &&
            (!transportMethod.carrier ||
              (transportMethod.carrier === this.transportMethod.carrier &&
                transportMethod.railCarNumber === this.transportMethod.railCarNumber &&
                transportMethod.railRestriction === this.transportMethod.railRestriction)))
        )
      },
      freightTerm: {
        value: freightTerm,
        isModified: !(freightTerm === this.transactionData.trackingData.transportTerm)
      },
      shippingCost: {
        value: shippingCost,
        isModified: !(shippingCost === this.transactionData.costData.shippingCost)
      }
    };
  }
}
