import { Component, Input, ViewChild } from '@angular/core';
import { GridHelperService } from '@services/helpers/grid-helper/grid-helper.service';
import { NavigationHelperService } from '@services/helpers/navigation-helper/navigation-helper.service';
import { TransactionEntity } from '@services/app-layer/entities/transaction';
import { CrmAccountEntity } from '@services/app-layer/entities/crm';
import { DxDataGridComponent } from 'devextreme-angular';
import { ObjectUtil } from '@app/services/helpers/utils/object-util';
import { BookmarkService } from '@app/services/app-layer/bookmark/bookmark.service';
import { SearchService } from '@services/app-layer/search/search.service';
import { MatMenuTrigger } from '@angular/material/menu';
import { Utils } from '@services/helpers/utils/utils';

class ViewState {
  public grid = null;
}

@Component({
  selector: 'app-crm-account-orders',
  templateUrl: './crm-account-orders.component.html',
  styleUrls: ['./crm-account-orders.component.scss']
})
export class CrmAccountOrdersComponent {
  @ViewChild('txGrid') txGrid: DxDataGridComponent;
  @ViewChild(MatMenuTrigger) ordersMenuTrigger: MatMenuTrigger;

  public txGridMenuData = {
    position: {
      x: '',
      y: ''
    },
    selectedTx: TransactionEntity
  };

  public viewKey = 'crmTransactions';
  public viewState: ViewState;
  public defaultState = new ViewState();

  private _crmAccountData: CrmAccountEntity;
  @Input() get crmAccountData(): CrmAccountEntity {
    return this._crmAccountData;
  }
  set crmAccountData(value: CrmAccountEntity) {
    if (!value) return;
    this._crmAccountData = value;
    this.setAccountTransactions();
  }

  public companyNormalizedTransactions: TransactionEntity[] = [];

  constructor(
    private searchService: SearchService,
    private navigationHelperService: NavigationHelperService,
    private bookmarkService: BookmarkService,
    private gridHelperService: GridHelperService
  ) {
    this.saveGridState = this.saveGridState.bind(this);
    this.loadGridState = this.loadGridState.bind(this);
    this.initViewState();
  }

  onExporting(e) {
    this.gridHelperService.exportToExcel(e, 'Transactions');
  }

  public onTransactionSelectionChanged(event): void {
    if (!event.key || event.rowType === 'group') return;
    this.txGridMenuData.position.x = `${event.event.clientX}px`;
    this.txGridMenuData.position.y = `${event.event.clientY}px`;
    this.txGridMenuData.selectedTx = event.data;
    this.ordersMenuTrigger.openMenu();
  }

  public openTxDetails(): void {
    if (!this.txGridMenuData.selectedTx) return;
    this.navigationHelperService.navigateToTransaction(this.txGridMenuData.selectedTx as any);
  }

  openTxInNewTab(): void {
    if (!this.txGridMenuData.selectedTx) return;
    window.open(`${location.origin}/order/transaction/${this.txGridMenuData.selectedTx['id']}`);
  }
  openTxInNewWindow(): void {
    if (!this.txGridMenuData.selectedTx) return;
    const strWindowFeatures = 'location=yes';
    window.open(
      `${location.origin}/order/transaction/${this.txGridMenuData.selectedTx['id']}`,
      '_blank',
      strWindowFeatures
    );
  }

  public onStateChanged(viewState) {
    this.viewState = viewState;
    this.setGridState(viewState.grid);
  }

  public setGridState(state) {
    this.txGrid.instance.state(state);
  }

  public loadGridState() {
    return this.viewState.grid;
  }

  public saveGridState(gridState) {
    const gridStoringState = ObjectUtil.getDeepCopy(gridState);
    gridStoringState.selectedRowKeys = [];
    this.viewState.grid = gridStoringState;
  }

  public onToolbarPreparing(e) {
    this.gridHelperService.prepareToolbarCollapseExpand(e, () => this.txGrid);
  }

  private setAccountTransactions(): void {
    this.searchService.fetchTransactionData(this.getSearchPayload()).subscribe(transactions => {
      this.companyNormalizedTransactions = transactions.map(tx => new TransactionEntity().init(tx));
    });
  }

  private getSearchPayload(): any {
    const vendorPayload = {
      value: { field: 'vendorCrm', comparisonOperator: 'eq', fieldValue: this.crmAccountData.id }
    };
    const customerPayload = {
      value: { field: 'customerCrm', comparisonOperator: 'eq', fieldValue: this.crmAccountData.id }
    };
    const filters: any = {
      children: {
        logicalOperator: 'and',
        items: [
          { children: { logicalOperator: 'or', items: [vendorPayload, customerPayload] } },
          Utils.getSearchTxCancelStateExcludePayload(),
          Utils.getSearchTxExcludeArchivedPayload()
        ]
      }
    };
    return {
      filters: filters,
      fields: ['trackingData', 'costData', 'state', 'register', 'tally']
    };
  }

  private initViewState() {
    this.viewState =
      this.bookmarkService.getLastSessionState(this.viewKey) || ObjectUtil.getDeepCopy(this.defaultState);
  }
}
