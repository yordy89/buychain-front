import { Component, Input } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { TransactionEntity } from '@services/app-layer/entities/transaction';

@Component({
  selector: 'app-leaderboard',
  templateUrl: './leaderboard.component.html',
  styleUrls: ['./leaderboard.component.css']
})
export class LeaderboardComponent {
  private _managersTransactions: any[];
  @Input() public get managersTransactions(): TransactionEntity[] {
    return this._managersTransactions;
  }
  public set managersTransactions(value) {
    this._managersTransactions = value;
    if (value) this.extractLeaderboardData();
  }

  @Input() maxRowCount = 4;
  @Input() showViewAll = true;

  public columns = ['', 'Orders', 'Total Sales', 'Last Order'];
  public rows = [];

  constructor(private dialog: MatDialog) {}

  private extractLeaderboardData(): void {
    const txs = this.managersTransactions.filter(t => t.isConfirmedOrHigherState);
    const data = txs.reduce((acc, item) => {
      let found = acc.find(x => x.sellerName === item.sellerName);
      if (!found) {
        found = {
          sellerName: item.sellerName,
          sellerProfilePictureUrl: item.seller.profilePictureUrl,
          ordersCount: 0,
          totalSales: 0,
          lastOrderDate: new Date()
        };
        acc.push(found);
      }
      found.ordersCount += 1;
      found.totalSales += item.totalPrice;
      if (found.lastOrderDate < item.confirmedDate) found.lastOrderDate = item.confirmedDate;
      return acc;
    }, []);

    this.rows = data.sort((a, b) => b.ordersCount - a.ordersCount);

    if (this.maxRowCount > -1) {
      this.rows = this.rows.slice(0, this.maxRowCount);
    }
  }

  public onViewAllClick() {
    const config = new MatDialogConfig();
    config.width = '1000px';

    const dialogRef = this.dialog.open(LeaderboardComponent, config);
    const instance = dialogRef.componentInstance;
    instance.managersTransactions = this.managersTransactions;
    instance.maxRowCount = -1;
    instance.showViewAll = false;
  }
}
