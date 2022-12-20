import { formatCurrency } from '@angular/common';
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
  Output,
  ViewChild
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ARInvoice, ARSalesOrder } from '@services/app-layer/entities/accounts-receivable';
import { DimensionEntity } from '@services/app-layer/entities/dimension';
import { GroupEntity } from '@services/app-layer/entities/group';
import { MemberEntity } from '@services/app-layer/entities/member';
import { TransactionEntity } from '@services/app-layer/entities/transaction';
import {
  ChartSeriesItem,
  SalesOrdersService
} from '@views/main/accounting/accounts-receivable/sales-orders/sales-orders.service';
import { DxChartComponent } from 'devextreme-angular';
import { Utils } from '@app/services/helpers/utils/utils';
import { takeUntil } from 'rxjs/operators';
import { CrmAccountEntity } from '@services/app-layer/entities/crm';
import { Subject } from 'rxjs';
import { DialogModalComponent, DialogType } from '@components/common/modals/dialog-modal/dialog-modal.component';
import { MatDialog } from '@angular/material/dialog';
import { ARSalesOrderStateEnum } from '@services/app-layer/app-layer.enums';
import { ChartLegend } from '@app/models';

@Component({
  selector: 'app-view-sales-order',
  templateUrl: 'view-sales-order.component.html',
  styleUrls: ['./view-sales-order.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ViewSalesOrderComponent implements OnInit, OnDestroy {
  @Input() data: ARSalesOrder;
  @Input() groups: GroupEntity[] = [];
  @Input() dimensions: DimensionEntity[] = [];
  @Input() members: MemberEntity[] = [];
  @Input() transaction: TransactionEntity = null;
  @Input() crmAccounts: CrmAccountEntity[] = [];
  @Input() creditTerms: string;

  @Output() lineItemDeletedEvent = new EventEmitter();

  @ViewChild('profitChart', { read: DxChartComponent }) set profitContent(chart) {
    if (this.profitChart) {
      return;
    }
    this.profitChart = chart;
    this.profitLegendsList = this.salesOrdersService.generateProfitLegendsList(chart, this.profitData);
    this.profitItemsList = this.salesOrdersService.getRearrangedProfitItemsList(this.profitData);
    this.cd.detectChanges();
  }

  permissions = { canRead: false, canCreate: false, canUpdate: false, canDelete: false, canClose: false };
  profitLegendsList: ChartLegend[] = [];
  profitData: { name: string; revenue?: number; expense?: number; profit?: number }[] = [];
  profitItemsList: ChartSeriesItem[] = [];
  readonly entryUrl = location.href;
  attachments = [];
  transactionUrl = null;

  private profitChart: DxChartComponent;

  private destroy$ = new Subject<void>();

  constructor(
    @Inject(LOCALE_ID) private localeId: string,
    private cd: ChangeDetectorRef,
    private salesOrdersService: SalesOrdersService,
    private router: Router,
    private route: ActivatedRoute,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.calculateProfitTotals();
    this.permissions = this.salesOrdersService.getSalesOrderPermissions();
    this.transactionUrl = `${location.origin}/order/transaction/${this.transaction?.id}`;
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  customizeStackedBarTooltip = arg => {
    let value = formatCurrency(arg.originalValue, this.localeId, '$');
    if (arg.seriesName === 'Profit/(Loss)' && this?.profitData[0]?.profit < 0) {
      value = `(${value})`;
    }

    return { text: `<b>${arg.seriesName}:</b> ${value}` };
  };

  customizeStackedBarLabelText = item => {
    const text = `$${Utils.abbreviateNumber(item.value)}`;
    if (item.seriesName === 'Profit/(Loss)' && this?.profitData[0]?.profit < 0) {
      return `(${text})`;
    }
    return text;
  };

  valueAxisTitle = () => `$${Utils.abbreviateNumber(this.data.revenue)}`;

  legendValue = value => formatCurrency(Math.abs(value), this.localeId, '$');

  getAxisColor = list => list[0]?.color;

  getProfitData = () => {
    const { expense, profit, revenue } = this.data;
    return [
      {
        name: 'profit_expense',
        expense,
        profit: Math.abs(profit),
        revenue
      }
    ];
  };

  onLineItemDeleted() {
    this.lineItemDeletedEvent.emit();
  }

  onInvoiceDeleted = (invoices: ARInvoice[]) => {
    this.data.invoices = invoices;
    this.cd.markForCheck();
  };

  private calculateProfitTotals() {
    const { expense, profit, revenue } = this.data;

    this.profitData = [
      {
        name: 'profit_expense',
        expense,
        profit,
        revenue
      }
    ];
  }

  get canCloseSalesOrder() {
    return this.permissions.canClose && this.data.isPendingClose;
  }

  onCloseSalesOrder() {
    this.dialog
      .open(DialogModalComponent, {
        width: '450px',
        disableClose: true,
        data: {
          type: DialogType.Confirm,
          content: 'Are you sure you want to CLOSE this SALES ORDER?'
        }
      })
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(confirmed => {
        if (confirmed) {
          this.salesOrdersService
            .closeSalesOrder(this.data.id)
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => {
              this.data.state = ARSalesOrderStateEnum.CLOSED;
              this.cd.markForCheck();
            });
        }
      });
  }
}
