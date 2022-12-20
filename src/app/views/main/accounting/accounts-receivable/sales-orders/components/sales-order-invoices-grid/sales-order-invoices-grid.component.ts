import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Inject,
  Input,
  LOCALE_ID,
  OnDestroy,
  OnInit
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TableAction } from '@app/models';
import { ARInvoice, ARInvoicePayment, ARSalesOrder } from '@services/app-layer/entities/accounts-receivable';
import { SalesOrdersService } from '@views/main/accounting/accounts-receivable/sales-orders/sales-orders.service';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { ARSalesOrderStateEnum } from '@services/app-layer/app-layer.enums';
import { InvoicesApiService } from '@services/app-layer/invoices/invoices-api.services';

enum Actions {
  VIEW,
  EDIT,
  DELETE,
  VOID
}

@Component({
  selector: 'app-sales-order-invoices-grid',
  templateUrl: 'sales-order-invoices-grid.component.html',
  styleUrls: ['./sales-order-invoices-grid.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SalesOrderInvoicesGridComponent implements OnInit, OnDestroy {
  @Input() salesOrder: ARSalesOrder;
  @Input() onInvoiceDeleted: (invoices: ARInvoice[]) => void;

  invoices: ARInvoice[] = [];
  actions: TableAction[] = [];
  permissions = {
    canReadInvoice: false,
    canCreateInvoice: false,
    canUpdateInvoice: false,
    canDeleteInvoice: false
  };

  private destroy$ = new Subject<void>();

  constructor(
    @Inject(LOCALE_ID) private localeId: string,
    private cd: ChangeDetectorRef,
    private salesOrdersService: SalesOrdersService,
    private invoicesApiService: InvoicesApiService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.invoices = this.salesOrder.invoices;
    this.permissions = this.salesOrdersService.getInvoicePermissions();
    this.initTableActions();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getInvoiceUrl(id: string) {
    return `${location.origin}/accounting/invoices/${id}`;
  }

  getRowData = rowData => rowData;

  get isEditSalesOrder() {
    return this.route.snapshot.queryParamMap.get('editSalesOrder') === 'true';
  }

  onAddInvoice() {
    this.router.navigate(['invoice/add'], {
      relativeTo: this.route,
      queryParams: {
        editSalesOrder: this.isEditSalesOrder
      }
    });
  }

  private onEditInvoice(entry: ARInvoice) {
    this.router.navigate(['invoice/', entry.id], {
      relativeTo: this.route,
      queryParams: {
        editInvoice: true,
        editSalesOrder: this.isEditSalesOrder
      }
    });
  }

  private onDeleteInvoice(entry: ARInvoice) {
    this.salesOrdersService
      .deleteInvoice(entry.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const index = this.invoices.findIndex(item => item.id === entry.id);
        if (index === -1) {
          return;
        }
        this.invoices = this.invoices.filter(item => item.id !== entry.id);
        if (this.onInvoiceDeleted) {
          this.onInvoiceDeleted(this.invoices);
        }
        this.cd.markForCheck();
      });
  }

  onVoidInvoice(entry: ARInvoice) {
    this.invoicesApiService
      .voidInvoice(entry.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe((voidedInvoice: ARInvoice) => {
        this.invoices = this.invoices.map(item => (item.id === entry.id ? voidedInvoice : item));
        this.cd.markForCheck();
      });
  }

  onInvoiceAction(value: Actions, item: ARInvoice) {
    switch (value) {
      case Actions.VIEW:
        this.onViewInvoice(item);
        break;
      case Actions.EDIT:
        this.onEditInvoice(item);
        break;
      case Actions.DELETE:
        this.onDeleteInvoice(item);
        break;
      case Actions.VOID:
        this.onVoidInvoice(item);
        break;
    }
  }

  onViewInvoice(entry: ARInvoice) {
    this.router.navigate(['invoice', entry.id], {
      relativeTo: this.route,
      queryParams: {
        editSalesOrder: this.isEditSalesOrder
      }
    });
  }

  get canAddNewInvoice() {
    return this.permissions.canCreateInvoice && this.salesOrder.state === ARSalesOrderStateEnum.OPEN;
  }

  voidNotAllowed = (action, invoice: ARInvoice) =>
    !invoice.isIssued || invoice.payments.some((item: ARInvoicePayment) => !item.isVoided);

  private initTableActions() {
    this.actions = [
      {
        label: 'View',
        icon: 'visibility',
        value: Actions.VIEW,
        isHidden: () => !this.permissions.canReadInvoice
      },
      {
        label: 'Edit',
        icon: 'edit',
        value: Actions.EDIT,
        isHidden: () => !this.permissions.canUpdateInvoice
      },
      {
        label: 'Delete',
        icon: 'delete',
        color: 'warn',
        value: Actions.DELETE,
        prompt: {
          title: 'Confirm please!',
          text: 'Are you sure you want to delete this Invoice?'
        },
        isHidden: (action, item: ARInvoice) => !(this.permissions.canDeleteInvoice && item.isDeleteAllowed)
      },
      {
        label: 'Void',
        icon: 'receipt',
        value: Actions.VOID,
        prompt: {
          title: 'Confirm please!',
          text: 'Are you sure you want to void this Invoice?'
        },
        isHidden: this.voidNotAllowed || !this.permissions.canUpdateInvoice
      }
    ];
  }
}
