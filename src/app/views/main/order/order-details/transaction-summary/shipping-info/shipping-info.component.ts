import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { TransactionEntity } from '@app/services/app-layer/entities/transaction';
import { ChangeTransactionTypesEnum, TransactionStateEnum } from '@services/app-layer/app-layer.enums';
import { FacilitiesService } from '@services/app-layer/facilities/facilities.service';
import { CompaniesService } from '@services/app-layer/companies/companies.service';
import { CrmService } from '@services/app-layer/crm/crm.service';

@Component({
  selector: 'app-shipping-info',
  templateUrl: './shipping-info.component.html',
  styleUrls: ['./shipping-info.component.scss']
})
export class ShippingInfoComponent implements OnInit, OnDestroy {
  @Input() transactionData: TransactionEntity;
  @Input() isModified: boolean;

  public modifiedLocation: any;
  public isLocationModified = false;
  public modifiedContact: any;
  public isContactModified = false;
  public modifiedBillToLocation: any;
  public isBillToLocationModified = false;
  public modifiedBillToContact: any;
  public isBillToContactModified = false;

  private destroy$ = new Subject<void>();

  constructor(
    private facilitiesService: FacilitiesService,
    private crmService: CrmService,
    private companiesService: CompaniesService
  ) {}

  ngOnInit() {
    if (this.isModified) {
      this.loadModifiedShipToLocation();
      this.loadModifiedBillToLocation();
      this.loadModifiedShipToContact();
      this.loadModifiedBillToContact();
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  public get isModifyTransportState() {
    return (
      this.transactionData.state === TransactionStateEnum.ChangePending &&
      this.transactionData.changePending &&
      this.transactionData.changePending.type === ChangeTransactionTypesEnum.ModifyTransport
    );
  }

  private loadModifiedShipToLocation(): void {
    const modifiedTransport = this.transactionData.changePending?.transport;
    const modifiedShipToLocationId =
      modifiedTransport?.onlineData?.shipToLocation || modifiedTransport?.crmData?.shipToLocation;
    if (!modifiedShipToLocationId || modifiedShipToLocationId === this.transactionData.shipTo.id) {
      this.modifiedLocation = this.transactionData.shipTo;
      this.isLocationModified = false;
      return;
    }
    this.loadLocation(modifiedShipToLocationId)
      .pipe(takeUntil(this.destroy$))
      .subscribe(location => (this.modifiedLocation = location));
    this.isLocationModified = true;
  }
  private loadModifiedBillToLocation(): void {
    const modifiedTransport = this.transactionData.changePending?.transport;
    const modifiedBillToLocationId =
      modifiedTransport?.onlineData?.billToLocation || modifiedTransport?.crmData?.billToLocation;
    if (!modifiedBillToLocationId || modifiedBillToLocationId === this.transactionData.billToLocation.id) {
      this.modifiedBillToLocation = this.transactionData.billToLocation;
      this.isBillToLocationModified = false;
      return;
    }
    this.loadLocation(modifiedBillToLocationId)
      .pipe(takeUntil(this.destroy$))
      .subscribe(location => (this.modifiedBillToLocation = location));
    this.isBillToLocationModified = true;
  }

  private loadLocation(locationId): Observable<any> {
    const isCrm = !!this.transactionData.changePending?.transport?.crmData;
    if (isCrm) {
      return this.crmService.getLocations(true).pipe(map(locations => locations.find(l => l.id === locationId)));
    } else {
      return this.facilitiesService.getCompanyFacility(this.transactionData.buyingCompanyId, locationId);
    }
  }

  private loadModifiedShipToContact(): void {
    const modifiedTransport = this.transactionData.changePending?.transport;
    const modifiedShipToContactId =
      modifiedTransport?.onlineData?.shipToContact || modifiedTransport?.crmData?.shipToContact;
    if (!modifiedShipToContactId || modifiedShipToContactId === this.transactionData.buyer.id) {
      this.modifiedContact = this.transactionData.buyer;
      this.isContactModified = false;
      return;
    }
    this.loadContact(modifiedShipToContactId)
      .pipe(takeUntil(this.destroy$))
      .subscribe(contact => (this.modifiedContact = contact));
    this.isContactModified = true;
  }
  private loadModifiedBillToContact(): void {
    const modifiedTransport = this.transactionData.changePending?.transport;
    const modifiedBillToContactId =
      modifiedTransport?.onlineData?.billToContact || modifiedTransport?.crmData?.billToContact;
    if (!modifiedBillToContactId || modifiedBillToContactId === this.transactionData.billToContact.id) {
      this.modifiedBillToContact = this.transactionData.billToContact;
      this.isBillToContactModified = false;
      return;
    }
    this.loadContact(modifiedBillToContactId)
      .pipe(takeUntil(this.destroy$))
      .subscribe(contact => (this.modifiedBillToContact = contact));
    this.isBillToContactModified = true;
  }

  private loadContact(contactId: string): Observable<any> {
    const isCrm = !!this.transactionData.changePending?.transport?.crmData;
    if (isCrm) {
      return this.crmService.getContacts(true).pipe(map(contacts => contacts.find(c => c.id === contactId)));
    } else {
      return this.companiesService.getCompanyMemberById(this.transactionData.buyingCompanyId, contactId);
    }
  }
}
