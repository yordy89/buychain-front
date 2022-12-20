import { Component, Input, OnInit } from '@angular/core';
import { InvoiceEntity } from '@services/app-layer/entities/invoice';
import { TransportTermEnum } from '@services/app-layer/app-layer.enums';

@Component({
  selector: 'app-invoice',
  templateUrl: './invoice.component.html',
  styleUrls: ['../common/pdf-templates.common.scss', './invoice.component.scss']
})
export class InvoiceComponent implements OnInit {
  @Input() invoice: InvoiceEntity;

  shipToCompany: any = {};
  sellerCompany: any = {};
  shipToLocation: any = {};
  shipToContact: any = {};
  billToLocation: any = {};
  billToContact: any = {};
  invoiceSubtotal: number;
  showShippingAsLineItem: boolean;

  ngOnInit() {
    this.sellerCompany = this.invoice.sellerCompany;
    this.shipToCompany = this.invoice.buyingCompany;
    this.shipToLocation = this.invoice.shipTo;
    this.shipToContact = this.invoice.buyer;
    this.billToContact = this.invoice.billToContact;
    this.billToLocation = this.invoice.billToLocation;
    this.showShippingAsLineItem =
      this.invoice.trackingData.transportTerm === TransportTermEnum.FOB_DEST_PREPAY_CHARGE ||
      this.invoice.trackingData.transportTerm === TransportTermEnum.FOB_ORIGIN_PREPAY_CHARGE;
    this.invoiceSubtotal =
      this.invoice.deliveredPriceTotal + (this.showShippingAsLineItem ? this.invoice.costData.shippingCost : 0);
  }

  spacerRowHeight() {
    return Math.max(400 - 50 * this.invoice.availableTallyUnits.length, 0);
  }
}
