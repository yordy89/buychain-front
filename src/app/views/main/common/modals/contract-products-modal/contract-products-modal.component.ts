import { ChangeDetectionStrategy, Component, Inject, OnDestroy } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Environment } from '@services/app-layer/app-layer.environment';
import { CrmAccountEntity } from '@services/app-layer/entities/crm';
import { ProductEntity } from '@services/app-layer/entities/inventory-search';
import { GridHelperService } from '@services/helpers/grid-helper/grid-helper.service';
import { NavigationHelperService } from '@services/helpers/navigation-helper/navigation-helper.service';
import { ListUtilHelper } from '@services/helpers/utils/list-util.helper';
import { CloseContractModalComponent } from '@views/main/common/modals/close-contract-modal/close-contract-modal.component';
import { Subject } from 'rxjs';

@Component({
  templateUrl: './contract-products-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContractProductsModalComponent implements OnDestroy {
  selectedIds = [];

  private destroy$ = new Subject<void>();

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: {
      products: ProductEntity[];
      crmAccounts: CrmAccountEntity[];
    },
    private dialogRef: MatDialogRef<ContractProductsModalComponent>,
    private dialog: MatDialog,
    private gridHelperService: GridHelperService,
    private navigationService: NavigationHelperService
  ) {}

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  goToTransaction(txId: string) {
    this.navigationService.navigateToTransactionById(txId);
    this.dialogRef.close();
  }

  calculateDisplaySupplierValue = (rowData: ProductEntity) => this.calculateCrmAccountValue(rowData.contract?.supplier);
  calculateDisplayBrokerValue = (rowData: ProductEntity) => this.calculateCrmAccountValue(rowData.contract?.broker);

  close(refresh?): void {
    this.dialogRef.close(refresh);
  }

  onCellPrepared(e: any) {
    const cb = (data: ProductEntity) => !data.isContractType;
    this.gridHelperService.disableCheckboxes(e, cb);
  }

  onConvertToCash() {
    const products = this.data.products.filter(item => this.selectedIds.includes(item.id));

    this.dialog
      .open(CloseContractModalComponent, {
        width: '1500px',
        disableClose: true,
        data: {
          products,
          crmAccounts: this.data.crmAccounts
        }
      })
      .afterClosed()
      .subscribe(refresh => {
        if (refresh) {
          this.selectedIds = [];
          this.close(true);
        }
      });
  }

  private calculateCrmAccountValue = (value: string) => {
    const notAvailableText = 'not available';

    if (value) {
      if (!this.data.crmAccounts?.length) {
        return notAvailableText;
      }

      return ListUtilHelper.getDisplayValueFromList(value, this.data.crmAccounts, 'id', 'name', notAvailableText);
    }

    return Environment.getCurrentCompany().name;
  };
}
