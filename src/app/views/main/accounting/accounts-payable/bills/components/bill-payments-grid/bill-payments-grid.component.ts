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
import { APBill, APBillPayment, APPurchaseOrder } from '@services/app-layer/entities/accounts-payable';
import { MatDialog } from '@angular/material/dialog';
import { BillsService } from '@views/main/accounting/accounts-payable/bills/bills.service';
import { formatCurrency } from '@angular/common';
import { TableAction } from '@app/models';
import { ListUtilHelper } from '@services/helpers/utils/list-util.helper';
import { MemberEntity } from '@services/app-layer/entities/member';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { BillsApiService } from '@services/app-layer/bills/bills-api.services';

enum Actions {
  EDIT,
  DELETE
}

@Component({
  selector: 'app-bill-payments-grid',
  templateUrl: 'bill-payments-grid.component.html',
  styleUrls: ['../common/bill-grid-items.common.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BillPaymentsGridComponent implements OnInit, OnDestroy {
  @Input() data: APBill;
  @Input() purchaseOrder: APPurchaseOrder;
  @Input() members: MemberEntity[];
  @Input() printing = false;

  @Output() paymentsUpdatedEvent = new EventEmitter();

  actions: TableAction[];
  permissions = {
    canCreatePayment: false,
    canUpdatePayment: false,
    canDeletePayment: false
  };

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private billsService: BillsService,
    private billsApiService: BillsApiService,
    private router: Router,
    private cd: ChangeDetectorRef,
    private dialog: MatDialog,
    @Inject(LOCALE_ID) private localeId: string
  ) {}

  ngOnInit() {
    this.permissions = this.billsService.getPaymentPermissions();
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
        isHidden: () => !this.permissions.canUpdatePayment
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
        isHidden: (action, item: APBillPayment) => !this.permissions.canDeletePayment || !item.isDraft
      }
    ];
  }

  onAction(value: Actions, item: APBillPayment) {
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
    const isEditBill = this.route.snapshot.queryParamMap.get('editBill') === 'true';
    this.router.navigate(['payment/add'], {
      relativeTo: this.route,
      queryParams: { editBill: isEditBill }
    });
  }

  onEditPayment(entry: APBillPayment) {
    const isEditBill = this.route.snapshot.queryParamMap.get('editBill') === 'true';
    this.router.navigate(['payment/', entry.id], {
      relativeTo: this.route,
      queryParams: {
        editBill: isEditBill,
        editPayment: true
      }
    });
  }

  onDeletePayment(entry: APBillPayment) {
    this.billsApiService
      .deleteBillPayment(this.data.id, entry.id)
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

  calculateDisplayCreatedByValue = (rowData: APPurchaseOrder) =>
    ListUtilHelper.getDisplayValueFromList(rowData.createdBy, this.members);

  get canAddPayment() {
    return this.permissions.canCreatePayment && !this.printing && !this.purchaseOrder.isClosed;
  }
}
