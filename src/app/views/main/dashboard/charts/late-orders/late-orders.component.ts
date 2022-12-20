import { Component, Input } from '@angular/core';
import { TransactionStateEnum } from '@app/services/app-layer/app-layer.enums';
import { NavigationHelperService } from '@app/services/helpers/navigation-helper/navigation-helper.service';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { TransactionEntity } from '@services/app-layer/entities/transaction';
import { startOfDay } from 'date-fns';

@Component({
  selector: 'app-late-orders',
  templateUrl: './late-orders.component.html'
})
export class LateOrdersComponent {
  private _tradersTransactions: any[];
  @Input() public get tradersTransactions(): TransactionEntity[] {
    return this._tradersTransactions;
  }
  public set tradersTransactions(value) {
    this._tradersTransactions = value;
    if (value) this.normalizeLateOrdersData();
  }

  @Input() maxRowCount = 4;
  @Input() showViewAll = true;

  public columns = ['', 'Order', 'Producer', 'Ship Date', 'Days Late'];
  public rows = [];

  constructor(private navigationHelper: NavigationHelperService, private dialog: MatDialog) {}

  private normalizeLateOrdersData(): void {
    const txs = this.tradersTransactions.filter(t => t.isConfirmedOrHigherState);
    const today = startOfDay(new Date());

    const lateOrders = txs.filter(tx => {
      const estimatedShipDate = tx.trackingData?.estimatedShipDate || tx.tallyShipDate || tx['date'];
      return estimatedShipDate < today && tx.state !== TransactionStateEnum.Complete;
    });

    const lateOrdersModel = lateOrders.map(x => ({
      buyingCompanyName: x.buyingCompanyName,
      buyingCompanyId: x.buyingCompanyId ? x.buyingCompanyId : '',
      id: x.id,
      transactionNumber: x.transactionNumber,
      // producer: x.producer,
      shipDate: x.trackingData?.estimatedShipDate || x.tallyShipDate || x['date'],
      daysLate: Math.round(
        (today.getTime() - (x.trackingData?.estimatedShipDate || x.tallyShipDate || x['date']).getTime()) /
          (1000 * 3600 * 24)
      )
    }));

    this.rows = lateOrdersModel.sort((a, b) => b.daysLate - a.daysLate);

    if (this.maxRowCount > -1) {
      this.rows = this.rows.slice(0, this.maxRowCount);
    }
  }

  public navigateToTransaction(transactionId: string) {
    this.navigationHelper.navigateToTransactionById(transactionId);
  }

  public navigateToCrmAccount(id) {
    this.navigationHelper.navigateToCrmEntity(id);
  }

  public onViewAllClick() {
    const config = new MatDialogConfig();
    config.width = '1000px';

    const dialogRef = this.dialog.open(LateOrdersComponent, config);
    const instance = dialogRef.componentInstance;
    instance.tradersTransactions = this.tradersTransactions;
    instance.maxRowCount = -1;
    instance.showViewAll = false;
  }
}
