import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Inject,
  Input,
  LOCALE_ID,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ARLineItem, ARSalesOrder } from '@services/app-layer/entities/accounts-receivable';
import { MatDialog } from '@angular/material/dialog';
import { InvoicesService } from '@views/main/accounting/accounts-receivable/invoices/invoices.service';
import { formatCurrency } from '@angular/common';
import { TableAction } from '@app/models';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SalesOrdersApiService } from '@services/app-layer/sales-orders/sales-orders-api.service';
import {
  AddEditOpenLineItemModalComponent,
  AddEditOpenLineItemModalData
} from '@views/main/accounting/accounts-receivable/invoices/components/add-edit-open-line-item-modal/add-edit-open-line-item-modal.component';
import { AccountEntity } from '@services/app-layer/entities/account';

enum Actions {
  EDIT,
  DELETE
}

@Component({
  selector: 'app-open-line-items-grid',
  templateUrl: 'open-line-items-grid.component.html',
  styleUrls: ['../common/invoice-grid-items.common.scss', 'open-line-items-grid.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OpenLineItemsGridComponent implements OnInit, OnDestroy {
  @Input() salesOrder: ARSalesOrder;
  @Input() accounts: AccountEntity[];

  @Output() selectedOpenLineItems = new EventEmitter<ARLineItem[]>();

  selectedRowKeys: ARLineItem[] = [];
  actions: TableAction[];
  permissions = {
    canCreateOpenLineItem: false,
    canUpdateOpenLineItem: false,
    canDeleteOpenLineItem: false
  };

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private invoicesService: InvoicesService,
    private salesOrdersApiService: SalesOrdersApiService,
    private router: Router,
    private cd: ChangeDetectorRef,
    private dialog: MatDialog,
    @Inject(LOCALE_ID) private localeId: string
  ) {}

  ngOnInit() {
    this.permissions = this.invoicesService.getOpenLineItemPermissions();
    this.initTableActions();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  formatAmountCurrency = e => {
    const formattedValue = formatCurrency(Math.abs(e.value), this.localeId, '$');
    if (e.value < 0) {
      return `(${formattedValue})`;
    }
    return formattedValue;
  };

  private initTableActions() {
    this.actions = [
      {
        label: 'Edit',
        icon: 'edit',
        value: Actions.EDIT,
        isHidden: !this.permissions.canUpdateOpenLineItem
      },
      {
        label: 'Delete',
        icon: 'delete',
        color: 'warn',
        value: Actions.DELETE,
        prompt: {
          title: 'Confirm please!',
          text: 'Are you sure you want to delete this Open Line Item?'
        },
        isHidden: !this.permissions.canDeleteOpenLineItem
      }
    ];
  }

  onAction(value: Actions, item: ARLineItem) {
    switch (value) {
      case Actions.EDIT:
        this.onAddEditOpenLineItem(item);
        break;
      case Actions.DELETE:
        this.onDeleteOpenLineItem(item);
        break;
    }
  }

  onInitialized(e) {
    e.component.selectAll();
  }

  onAddEditOpenLineItem(lineItem?: ARLineItem) {
    const data: AddEditOpenLineItemModalData = {
      salesOrderId: this.salesOrder.id,
      accounts: this.accounts,
      lineItem,
      editMode: !!lineItem
    };

    this.dialog
      .open(AddEditOpenLineItemModalComponent, {
        width: '848px',
        data
      })
      .afterClosed()
      .subscribe(this.onClose);
  }

  private onClose = ({ lineItem, adding }) => {
    if (lineItem) {
      if (adding) {
        this.salesOrder.openLineItems.push(lineItem);
        this.selectedRowKeys.push(lineItem);
      } else {
        const editedLineItemIndex = this.salesOrder.openLineItems.findIndex(item => item.id === lineItem.id);
        this.salesOrder.openLineItems.splice(editedLineItemIndex, 1, lineItem);
        const editedSelectedLineItemIndex = this.selectedRowKeys.findIndex(item => item.id === lineItem.id);
        if (editedSelectedLineItemIndex >= 0) {
          this.selectedRowKeys.splice(editedSelectedLineItemIndex, 1, lineItem);
        }
      }
      this.cd.markForCheck();
    }
  };

  onSelectionChanged(e) {
    this.selectedOpenLineItems.emit(e.component.getSelectedRowsData());
  }

  onDeleteOpenLineItem(entry: ARLineItem) {
    this.salesOrdersApiService
      .deleteSalesOrderOpenLineItem(this.salesOrder.id, entry.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const index = this.salesOrder.openLineItems.findIndex(item => item.id === entry.id);
        if (index === -1) {
          return;
        }
        this.salesOrder.openLineItems = this.salesOrder.openLineItems.filter(item => item.id !== entry.id);
        this.cd.markForCheck();
      });
  }
}
