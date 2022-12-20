import { Component, Input } from '@angular/core';
import { NavigationHelperService } from '@app/services/helpers/navigation-helper/navigation-helper.service';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { TransactionEntity } from '@services/app-layer/entities/transaction';

@Component({
  selector: 'app-top-customers',
  templateUrl: './top-customers.component.html',
  styleUrls: ['./top-customers.component.css']
})
export class TopCustomersComponent {
  private _tradersTransactions: any[];
  @Input() public get tradersTransactions(): TransactionEntity[] {
    return this._tradersTransactions;
  }
  public set tradersTransactions(value) {
    this._tradersTransactions = value;
    if (value) this.normalizeTopCustomersData();
  }

  @Input() maxRowCount = 4;
  @Input() showViewAll = true;

  public columns = ['', 'Orders', 'Revenues', 'Margin', 'Last Order'];
  public rows = [];

  constructor(private navigationHelper: NavigationHelperService, private dialog: MatDialog) {}

  private normalizeTopCustomersData(): void {
    const txs = this.tradersTransactions.filter(t => t.isConfirmedOrHigherState);
    const data = txs.reduce((acc, item) => {
      let found = acc.find(x => x.buyingCompanyName === item.buyingCompanyName);
      if (!found) {
        found = {
          buyingCompanyName: item.buyingCompanyName,
          buyingCompanyId: item.buyingCompanyId ? item.buyingCompanyId : '',
          ordersCount: 0,
          totalRevenues: 0,
          margin: 0,
          lastOrderDate: new Date(),
          number: 0
        };
        acc.push(found);
      }
      found.ordersCount += 1;
      found.totalRevenues += item.totalPrice;
      found.margin += item.profit || 0;
      if (found.lastOrderDate < item.confirmedDate) found.lastOrderDate = item.confirmedDate;
      return acc;
    }, []);

    this.rows = data.sort((a, b) => b.ordersCount - a.ordersCount);

    if (this.maxRowCount > -1) {
      this.rows = this.rows.slice(0, this.maxRowCount);
    }

    this.rows.forEach(x => (x.number = this.rows.indexOf(x) + 1));
  }

  public navigateToCrmAccount(id) {
    this.navigationHelper.navigateToCrmEntity(id);
  }

  public onViewAllClick() {
    const config = new MatDialogConfig();
    config.width = '1000px';

    const dialogRef = this.dialog.open(TopCustomersComponent, config);
    const instance = dialogRef.componentInstance;
    instance.tradersTransactions = this.tradersTransactions;
    instance.maxRowCount = -1;
    instance.showViewAll = false;
  }
}
