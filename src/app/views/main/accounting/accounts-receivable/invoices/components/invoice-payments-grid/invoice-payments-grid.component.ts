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
import { ARInvoice, ARInvoicePayment, ARSalesOrder } from '@services/app-layer/entities/accounts-receivable';
import { MatDialog } from '@angular/material/dialog';
import { InvoicesService } from '@views/main/accounting/accounts-receivable/invoices/invoices.service';
import { formatCurrency } from '@angular/common';
import { TableAction } from '@app/models';
import { ListUtilHelper } from '@services/helpers/utils/list-util.helper';
import { MemberEntity } from '@services/app-layer/entities/member';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

enum Actions {
  EDIT,
  DELETE
}

@Component({
  selector: 'app-invoice-payments-grid',
  templateUrl: 'invoice-payments-grid.component.html',
  styleUrls: ['../common/invoice-grid-items.common.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InvoicePaymentsGridComponent implements OnInit, OnDestroy {
  @Input() data: ARInvoice;
  @Input() salesOrder: ARSalesOrder;
  @Input() members: MemberEntity[];
  @Input() printing = false;

  @Output() paymentsUpdatedEvent = new EventEmitter();

  actions: TableAction[];
  permissions = {
    canCreatePayment: false,
    canUpdatePayment: false,
    canDeletePayment: false,
    canApplyCreditMemo: false
  };

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private invoicesService: InvoicesService,
    private router: Router,
    private cd: ChangeDetectorRef,
    private dialog: MatDialog,
    @Inject(LOCALE_ID) private localeId: string
  ) {}

  ngOnInit() {
    this.permissions = this.invoicesService.getPaymentPermissions();
    this.initTableActions();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  formatAmountCurrency = e => formatCurrency(e.value, this.localeId, '$');

  private initTableActions() {
    this.actions = [
      {
        label: 'Edit',
        icon: 'edit',
        value: Actions.EDIT,
        isHidden: (action, item: ARInvoicePayment) =>
          !(this.permissions.canUpdatePayment && item.isEditDeleteAllowed && this.data.isIssued)
      },
      {
        label: 'Delete',
        icon: 'delete',
        color: 'warn',
        value: Actions.DELETE,
        prompt: {
          title: 'Confirm please!',
          text: 'Are you sure you want to delete this Payment?'
        },
        isHidden: (action, item: ARInvoicePayment) =>
          !(this.permissions.canDeletePayment && item.isEditDeleteAllowed && this.data.isIssued)
      }
    ];
  }

  onAction(value: Actions, item: ARInvoicePayment) {
    switch (value) {
      case Actions.EDIT:
        this.onEditPayment(item);
        break;
      case Actions.DELETE:
        this.onDeletePayment(item);
        break;
    }
  }

  onAddPayment() {
    const isEditInvoice = this.route.snapshot.queryParamMap.get('editInvoice') === 'true';
    this.router.navigate(['payment/add'], {
      relativeTo: this.route,
      queryParams: { editInvoice: isEditInvoice }
    });
  }

  onApplyCreditMemo() {
    const isEditInvoice = this.route.snapshot.queryParamMap.get('editInvoice') === 'true';
    this.router.navigate(['/accounting/credit-memos/apply'], {
      relativeTo: this.route,
      queryParams: {
        isEditInvoice,
        invoiceId: this.data.id
      }
    });
  }

  onEditPayment(entry: ARInvoicePayment) {
    const isEditInvoice = this.route.snapshot.queryParamMap.get('editInvoice') === 'true';
    this.router.navigate(['payment/', entry.id], {
      relativeTo: this.route,
      queryParams: {
        editInvoice: isEditInvoice,
        editPayment: true
      }
    });
  }

  onDeletePayment(entry: ARInvoicePayment) {
    this.invoicesService
      .deleteInvoicePayment(this.data.id, entry.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const index = this.data.payments.findIndex(item => item.id === entry.id);
        if (index === -1) {
          return;
        }
        this.data.payments = this.data.payments.filter(item => item.id !== entry.id);
        this.cd.markForCheck();
        this.paymentsUpdatedEvent.emit();
      });
  }

  get canAddPayment() {
    return this.data.isApproved && this.data.isIssued;
  }

  get canApplyCreditMemo() {
    return this.canAddPayment && !this.data.isPaid;
  }

  calculateDisplayCreatedByValue = (rowData: ARSalesOrder) =>
    ListUtilHelper.getDisplayValueFromList(rowData.createdBy, this.members);
}
