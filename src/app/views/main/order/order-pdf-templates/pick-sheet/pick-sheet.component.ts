import { Component, OnInit, Input } from '@angular/core';
import { PickTicketEntity } from '@services/app-layer/entities/pick-ticket';

@Component({
  selector: 'app-pick-sheet',
  templateUrl: './pick-sheet.component.html',
  styleUrls: ['../common/pdf-templates.common.scss', './pick-sheet.component.scss']
})
export class PickSheetComponent implements OnInit {
  @Input() pickTicket: PickTicketEntity;

  public currentDate = new Date();
  public sellerCompany: any = {};
  public shipToCompany: any = {};
  public shipToLocation: any = {};
  public shipToContact: any = {};
  public billToLocation: any = {};
  public billToContact: any = {};

  ngOnInit() {
    this.sellerCompany = this.pickTicket.sellerCompany;
    this.shipToCompany = this.pickTicket.buyingCompany;
    this.shipToLocation = this.pickTicket.shipTo;
    this.shipToContact = this.pickTicket.buyer;
    this.billToContact = this.pickTicket.billToContact;
    this.billToLocation = this.pickTicket.billToLocation;
  }

  public spacerRowHeight() {
    return Math.max(400 - 50 * this.pickTicket.availableTallyUnits.length, 0);
  }
}
