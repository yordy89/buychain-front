import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { FacilitiesService } from '@app/services/app-layer/facilities/facilities.service';
import { NotificationHelperService } from '@app/services/helpers/notification-helper/notification-helper.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { first, map, takeUntil } from 'rxjs/operators';
import { BehaviorSubject, combineLatest, Subject } from 'rxjs';
import { TransactionsService } from '@app/services/app-layer/transactions/transactions.service';
import {
  ChangeTransactionTypesEnum,
  RoleInTransaction,
  TransactionStateEnum
} from '@app/services/app-layer/app-layer.enums';
import {
  BuyerDataEntity,
  SelectedTransportMethod,
  SellerData,
  TransactionEntity
} from '@services/app-layer/entities/transaction';
import { CompaniesService } from '@services/app-layer/companies/companies.service';
import { CrmComponentService } from '@views/main/crm/crm/crm.component.service';
import { CrmAccountEntity } from '@services/app-layer/entities/crm';
import { ObjectUtil } from '@services/helpers/utils/object-util';
import { CrmService } from '@services/app-layer/crm/crm.service';
import { StateUpdateHelper } from '@views/main/order/order-details/transaction-summary/state-update/state-update-helper';

@Component({
  selector: 'app-shipping-info-edit-modal',
  templateUrl: './shipping-info-edit-modal.component.html',
  styleUrls: ['./shipping-info-edit-modal.component.scss']
})
export class ShippingInfoEditModalComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  public isLoaded: boolean;
  public transaction: TransactionEntity;
  public sellerData: SellerData;
  public buyerData: BuyerDataEntity;

  public TransactionStateEnum = TransactionStateEnum;
  public shipFromUser: any;

  public shipToCompanyName: string;
  public shipToFacilityName: string;
  public shipToUserName: string;

  public shipToFormGroup: FormGroup;
  public shipToCompany: FormControl;
  public shipToFacility: FormControl;
  public shipToUser: FormControl;

  public billToContact: FormControl;
  public billToLocation: FormControl;

  public selectedShipToFacility$: BehaviorSubject<any> = new BehaviorSubject<any>('');
  public transportMethod: SelectedTransportMethod;

  public companies: CrmAccountEntity[];
  public facilities: any = [];
  public users: any[] = [];
  public isUserSeller: boolean;
  public isUserBuyer: boolean;

  public transportationFormGroup: FormGroup;
  public freightTermsFromControl: FormControl;
  public estimatedShipDateFormControl: FormControl;

  public isModifyTransportMode: boolean;

  public shipToDisabledTooltip = '';

  constructor(
    @Inject(MAT_DIALOG_DATA) private data: TransactionEntity,
    private dialogRef: MatDialogRef<ShippingInfoEditModalComponent>,
    private dialog: MatDialog,
    private notificationService: NotificationHelperService,
    private crmService: CrmService,
    private crmComponentService: CrmComponentService,
    private facilitiesService: FacilitiesService,
    private companiesService: CompaniesService,
    private transactionsService: TransactionsService,
    private stateUpdateHelper: StateUpdateHelper
  ) {
    this.transaction = this.data;
    this.transportMethod = this.transaction.trackingData.selectedTransportMethod || <SelectedTransportMethod>{};
    this.sellerData = this.transaction.trackingData.sellerData;
    this.buyerData = this.transaction.trackingData.buyerData;
    this.isModifyTransportMode =
      this.transaction.state === TransactionStateEnum.Confirmed ||
      this.transaction.state === TransactionStateEnum.InTransit;

    this.shipFromUser = this.transaction.seller;

    this.isUserSeller = this.transaction.role === RoleInTransaction.Seller;
    this.isUserBuyer = this.transaction.role === RoleInTransaction.Buyer;
  }

  ngOnInit() {
    const load$ = [];

    if (this.isUserBuyer) {
      this.shipToCompanyName = this.transaction.buyingCompanyName;

      load$.push(this.loadCompanyFacilities(this.buyerData.onlineData.buyingCompany.id));
      load$.push(this.loadCompanyMembers());
    } else {
      // Sales
      load$.push(this.loadCrmAccounts());

      if (this.buyerData.crmData && this.buyerData.crmData.buyingCompany) {
        load$.push(this.loadCrmLocations(this.buyerData.crmData.buyingCompany.id));
        load$.push(this.loadCrmContacts(this.buyerData.crmData.buyingCompany.id));
      }

      if (this.isUserSeller && this.buyerData.onlineData && !this.buyerData.crmData) {
        this.shipToCompanyName = this.transaction.buyingCompanyName;
        this.shipToFacilityName = this.transaction.shipToName;
        this.shipToUserName = this.transaction.buyerName;
      }
    }

    combineLatest(load$)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.initializeShipToFormGroup();
        this.initializeFreightTermsFromControl();
        this.initializeEstimatedShipDateFormControl();
        if (!this.transportationFormGroup) this.transportationFormGroup = new FormGroup({});
        this.isLoaded = true;
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.unsubscribe();
  }
  public async submit() {
    try {
      if (this.isModifyTransportMode) {
        if (this.onModifyTransportNothingChanged()) return this.close();
        const payload = this.getModifyTransportPayload();
        await this.transactionsService.updateTransactionStateChangePending(this.transaction.id, payload).toPromise();
      } else {
        if (this.transaction.state === TransactionStateEnum.Draft) {
          await this.updateBuyerDataInDraftState();
        }

        if (this.transaction.state === TransactionStateEnum.Quote) {
          await this.updateBuyerDataInQuoteState();
        }

        await this.updateFreightTermsMethod(this.freightTermsFromControl.value);
        await this.updateTransportMethod(this.transportationFormGroup.value);
      }

      this.dialogRef.close(true);
    } catch (error) {
      const err = error.error || error;
      this.notificationService.showValidation(err.message);
    }
  }

  public close() {
    this.dialogRef.close();
  }

  /*
   * private helpers
   * */

  private async updateBuyerDataInDraftState() {
    if (this.isUserBuyer) {
      const buyerData = {
        shipTo: this.shipToFacility.value,
        buyingUser: this.shipToUser.value,
        billToContact: this.billToContact.value,
        billToLocation: this.billToLocation.value
      };
      await this.transactionsService.updateTransactionBuyerOnlineData(this.transaction.id, buyerData).toPromise();
    } else if (this.isUserSeller) {
      const buyerData = {
        buyingCompany: this.shipToCompany.value,
        shipTo: this.shipToFacility.value,
        buyingUser: this.shipToUser.value,
        billToContact: this.billToContact.value,
        billToLocation: this.billToLocation.value
      };
      await this.transactionsService.updateTransactionBuyerCrmData(this.transaction.id, buyerData).toPromise();
    }
  }

  private async updateBuyerDataInQuoteState() {
    if (this.isUserSeller) {
      const buyerData = {
        buyingCompany: this.shipToCompany.value,
        shipTo: this.shipToFacility.value,
        buyingUser: this.shipToUser.value,
        billToContact: this.billToContact.value,
        billToLocation: this.billToLocation.value
      };
      await this.transactionsService.updateTransactionBuyerCrmData(this.transaction.id, buyerData).toPromise();
    } else if (this.isUserBuyer) {
      const buyerData = {
        shipTo: this.shipToFacility.value,
        buyingUser: this.shipToUser.value,
        billToContact: this.billToContact.value,
        billToLocation: this.billToLocation.value
      };
      await this.transactionsService.updateTransactionBuyerOnlineData(this.transaction.id, buyerData).toPromise();
    }
  }

  private async updateFreightTermsMethod(newValue) {
    if (newValue && newValue !== this.transaction.trackingData.transportTerm) {
      const payload = { transportTerm: newValue };
      await this.transactionsService.updateTransactionTrackingData(this.transaction.id, payload).toPromise();
    }
  }

  private async updateTransportMethod(values) {
    if (values.transportMethod) {
      this.transportMethod.type = values.transportMethod.transportMethod.type;
      this.transportMethod.carrier = values.transportMethod.transportMethod.carrier || undefined;
      this.transportMethod.railRestriction = values.transportMethod.transportMethod.railRestriction || undefined;
      this.transportMethod.railCarNumber = values.transportMethod.transportMethod.railCarNumber || undefined;
      this.transportMethod.cost = this.transaction.canSetShippingCost(this.freightTermsFromControl.value)
        ? values.transportMethod.cost
        : 0;
    } else {
      this.transportMethod.type = values.transportType;
      this.transportMethod.carrier = values.railCarrier ? values.railCarrier.abbreviation : undefined;
      this.transportMethod.railRestriction = values.railRestriction || undefined;
      this.transportMethod.railCarNumber = values.railCarNumber || undefined;
      this.transportMethod.cost = values.cost;
    }

    await this.transactionsService.updateTransportMethod(this.transaction.id, this.transportMethod).toPromise();
  }

  private initializeFreightTermsFromControl() {
    this.freightTermsFromControl = new FormControl(this.transaction.trackingData.transportTerm, [Validators.required]);
  }
  private initializeEstimatedShipDateFormControl() {
    this.estimatedShipDateFormControl = new FormControl();
    this.estimatedShipDateFormControl.setValue(this.transaction.shipDate);
  }

  private initializeShipToFormGroup() {
    const companyId = this.transaction.buyingCompanyId;
    const facilityId = this.transaction.shipTo.id;
    const userId = this.transaction.buyer.id;
    const billToLocationId = this.transaction.billToLocation.id;
    const billToContactId = this.transaction.billToContact.id;

    const isCompanySelected = !!companyId;

    this.shipToCompany = new FormControl({ value: companyId, disabled: this.isModifyTransportMode }, [
      Validators.required
    ]);
    this.shipToFacility = new FormControl(
      { value: facilityId, disabled: !isCompanySelected && !this.isModifyTransportMode },
      [Validators.required]
    );
    this.shipToUser = new FormControl({ value: userId, disabled: !isCompanySelected && !this.isModifyTransportMode }, [
      Validators.required
    ]);

    this.billToLocation = new FormControl({ value: billToLocationId, disabled: !isCompanySelected }, [
      Validators.required
    ]);
    this.billToContact = new FormControl({ value: billToContactId, disabled: !isCompanySelected }, [
      Validators.required
    ]);

    this.shipToFormGroup = new FormGroup({
      shipToCompany: this.shipToCompany,
      shipToFacility: this.shipToFacility,
      shipToUser: this.shipToUser
    });
    this.shipToCompany.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(shipToCompanyId => this.onShipToCompanyChange(shipToCompanyId));
    this.shipToFacility.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(shipToFacilityId => this.onShipToFacilityIdChange(shipToFacilityId));
    if (
      this.transaction.state !== TransactionStateEnum.Draft &&
      this.transaction.state !== TransactionStateEnum.Quote &&
      !this.isModifyTransportMode
    ) {
      this.shipToFormGroup.disable({ emitEvent: false });
    }
    if (this.transaction.state === TransactionStateEnum.Quote) this.shipToCompany.disable({ emitEvent: false });
    if (this.stateUpdateHelper.hasAllocatedLotInTally(this.transaction)) {
      this.shipToFacility.disable({ emitEvent: false });
      this.shipToDisabledTooltip =
        'You cannot modify the Ship To location. The purchased lots are allocated in a sales transaction';
    }
  }

  private onShipToCompanyChange(companyId) {
    const load$ = [];

    if (this.isUserBuyer) {
      load$.push(this.loadCompanyFacilities(companyId));
      load$.push(this.loadCompanyMembers());
    } else if (this.isUserSeller) {
      load$.push(this.loadCrmLocations(companyId));
      load$.push(this.loadCrmContacts(companyId));
    }

    combineLatest(load$).subscribe(() => {
      this.shipToFacility.enable({ emitEvent: false });
      this.shipToUser.enable({ emitEvent: false });
      this.billToLocation.enable({ emitEvent: false });
      this.billToContact.enable({ emitEvent: false });
      this.shipToFacility.reset();
      this.shipToUser.reset();
      this.billToLocation.reset();
      this.billToContact.reset();
      this.setSelectedShipToCompanyDefaultBillTo();
    });
  }

  private onShipToFacilityIdChange(facilityId) {
    const selectedShipToFacility = this.getSelectedShipToFacility(facilityId);
    this.selectedShipToFacility$.next(selectedShipToFacility);
  }

  private setSelectedShipToCompanyDefaultBillTo() {
    const selectedShipToCompany = this.companies.find(x => x.id === this.shipToCompany.value);
    if (!selectedShipToCompany) return;

    this.billToContact.setValue(selectedShipToCompany.defaultBillToContact);
    this.billToLocation.setValue(selectedShipToCompany.defaultBillToLocation);
  }

  private getSelectedShipToFacility(facilityId) {
    return this.facilities.find(x => x.id === facilityId);
  }

  private loadCrmAccounts() {
    return this.crmService.getAccounts().pipe(
      first(),
      map(accounts => {
        this.companies = accounts;
      })
    );
  }
  private loadCrmLocations(accountId: string) {
    return this.crmService.getLocations().pipe(
      first(),
      map(locations => {
        this.facilities = locations.filter(entity => entity.crmAccountId === accountId);
      })
    );
  }
  private loadCrmContacts(accountId: string) {
    return this.crmService.getContacts().pipe(
      first(),
      map(contacts => {
        this.users = contacts.filter(entity => entity.crmAccountId === accountId);
      })
    );
  }
  private loadCompanyFacilities(companyId: string) {
    return this.facilitiesService.getCompanyFacilities(companyId).pipe(
      map(facilities => {
        this.facilities = facilities;
      })
    );
  }
  private loadCompanyMembers() {
    return this.companiesService.getCompanyCompleteMembers().pipe(map(members => (this.users = members)));
  }

  /*
   * private helpers
   * */

  // todo make public, disable submit with tooltip.
  private onModifyTransportNothingChanged(): boolean {
    const estimatedShipDateModified = !(
      new Date(this.estimatedShipDateFormControl.value).getTime() === new Date(this.transaction.shipDate).getTime()
    );
    const transportationFormValue = this.transportationFormGroup.value;
    const transportationModified = !(
      this.transportMethod.type === transportationFormValue.transportType &&
      (!transportationFormValue.railCarrier ||
        (transportationFormValue.railCarrier &&
          this.transportMethod.carrier === transportationFormValue.railCarrier.abbreviation &&
          this.transportMethod.railRestriction === transportationFormValue.railRestriction &&
          this.transportMethod.railCarNumber === transportationFormValue.railCarNumber))
    );
    const costModified =
      (transportationFormValue.cost || transportationFormValue?.cost === 0) &&
      transportationFormValue?.cost !== this.transaction.costData.shippingCost;
    const freightTermModified = this.freightTermsFromControl.value !== this.transaction.trackingData.transportTerm;
    const shipToSectionModified =
      this.shipToUser.value !== this.transaction.buyer.id ||
      this.shipToFacility.value !== this.transaction.shipTo.id ||
      this.billToContact.value !== this.transaction.billToContact.id ||
      this.billToLocation.value !== this.transaction.billToLocation.id;
    return (
      !shipToSectionModified &&
      !freightTermModified &&
      !costModified &&
      !estimatedShipDateModified &&
      !transportationModified
    );
  }

  private getModifyTransportPayload(): any {
    const freightTerm = this.freightTermsFromControl.dirty ? this.freightTermsFromControl.value : null;
    const shippingInfoPayload = {
      shipToContact: this.shipToUser.dirty ? this.shipToUser.value : null,
      shipToLocation: this.shipToFacility.dirty ? this.shipToFacility.value : null,
      billToContact: this.billToContact.dirty ? this.billToContact.value : null,
      billToLocation: this.billToLocation.dirty ? this.billToLocation.value : null
    };
    const shippingInfo = this.transaction.isBuyerCrm
      ? { crmData: shippingInfoPayload }
      : { onlineData: shippingInfoPayload };

    const payload = ObjectUtil.deleteEmptyProperties({
      type: ChangeTransactionTypesEnum.ModifyTransport,
      transport: {
        estimatedShipDate: this.getModifiedTransportEstimatedShipDate(),
        transportMethod: this.getModifiedTransportMethodPayload(),
        transportTerm: freightTerm,
        ...shippingInfo
      }
    });
    if (this.getModifiedTransportCost() || this.getModifiedTransportCost() === 0)
      payload.transport.shippingCost = this.getModifiedTransportCost();
    return payload;
  }

  private getModifiedTransportMethodPayload(): any {
    if (!this.transportationFormGroup.dirty) return null;
    const transportData = this.transportationFormGroup.value.transportMethod
      ? this.transportationFormGroup.value.transportMethod.transportMethod
      : this.transportationFormGroup.value;

    return {
      ...ObjectUtil.deleteEmptyProperties({
        type: transportData.transportType || transportData.type,
        carrier: transportData.railCarrier
          ? transportData.railCarrier.abbreviation
          : transportData.railCarrier || transportData.carrier,
        railRestriction: transportData.railRestriction,
        railCarNumber: transportData.railCarNumber
      }),
      notes: this.transportMethod.notes
    };
  }

  private getModifiedTransportCost(): number {
    if (!this.transportationFormGroup.dirty) return null;
    const transportData = this.transportationFormGroup.value;
    const freightTerm = this.freightTermsFromControl.value;
    if (!this.transaction.canSetShippingCost(freightTerm)) return 0;
    return transportData.cost || transportData.cost === 0 ? transportData.cost : transportData.transportMethod.cost;
  }

  private getModifiedTransportEstimatedShipDate(): any {
    let estimatedShipDate;
    if (this.estimatedShipDateFormControl.dirty) {
      if (new Date(this.estimatedShipDateFormControl.value).getTime() < new Date().getTime()) {
        estimatedShipDate = new Date();
        estimatedShipDate.setMinutes(estimatedShipDate.getMinutes() + 1);
      } else estimatedShipDate = this.estimatedShipDateFormControl.value;
    } else estimatedShipDate = null;
    return estimatedShipDate;
  }
}
