import { Component, OnInit, ChangeDetectionStrategy, Input } from '@angular/core';
import { OrderConfirmationEntity } from '@services/app-layer/entities/order-confirmation';

@Component({
  selector: 'app-order-confirmation',
  templateUrl: './order-confirmation.component.html',
  styleUrls: ['../common/pdf-templates.common.scss', './order-confirmation.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrderConfirmationComponent implements OnInit {
  @Input() orderConfirmation: OrderConfirmationEntity;

  public sellingCompany: any = {};
  public buyingCompany: any = {};
  public shipFromLocation: any = {};
  public shipFromContact: any = {};
  public shipToLocation: any = {};
  public shipToContact: any = {};
  public billToLocation: any = {};
  public billToContact: any = {};

  public currentDate = new Date();

  ngOnInit() {
    this.sellingCompany = this.orderConfirmation.sellerCompany;
    this.buyingCompany = this.orderConfirmation.buyingCompany;
    this.shipFromLocation = this.orderConfirmation.shipFrom;
    this.shipFromContact = this.orderConfirmation.seller;
    this.shipToLocation = this.orderConfirmation.shipTo;
    this.shipToContact = this.orderConfirmation.buyer;
    this.billToContact = this.orderConfirmation.billToContact;
    this.billToLocation = this.orderConfirmation.billToLocation;
  }

  public spacerRowHeight() {
    return Math.max(400 - 50 * this.orderConfirmation.availableTallyUnits.length, 0);
  }
}
