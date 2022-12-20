import { Component, Input } from '@angular/core';
import { TableAction } from '@app/models';
import { TransactionEntity } from '@services/app-layer/entities/transaction';
import { GridHelperService } from '@services/helpers/grid-helper/grid-helper.service';
import { NavigationHelperService } from '@services/helpers/navigation-helper/navigation-helper.service';
import { MatDialogRef } from '@angular/material/dialog';
import { SupplierFinanceReviewModalComponent } from '@views/main/order/order-details/transaction-summary/state-update/supplier-finance-review-modal/supplier-finance-review-modal.component';

enum Actions {
  VIEW
}

@Component({
  selector: 'app-open-transactions',
  templateUrl: './open-transactions.component.html',
  styleUrls: ['./open-transactions.component.scss']
})
export class OpenTransactionsComponent {
  @Input() transactionsList: TransactionEntity[] = [];
  actions: TableAction[] = [
    {
      label: 'View',
      icon: 'visibility',
      value: Actions.VIEW
    }
  ];

  constructor(
    private navigationHelperService: NavigationHelperService,
    private dialogRef: MatDialogRef<SupplierFinanceReviewModalComponent>,
    private gridHelperService: GridHelperService
  ) {}

  public goToTransaction(transaction: TransactionEntity): void {
    this.navigationHelperService.navigateToTransaction(transaction);
    this.dialogRef.close();
  }

  onTableAction(value: Actions, item: TransactionEntity) {
    if (value === Actions.VIEW) {
      this.goToTransaction(item);
    }
  }

  onExporting(e) {
    this.gridHelperService.exportToExcel(e, 'Transactions');
  }
}
