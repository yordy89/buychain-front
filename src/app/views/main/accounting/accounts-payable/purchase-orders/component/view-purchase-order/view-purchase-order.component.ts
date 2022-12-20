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
import { APBill, APPurchaseOrder } from '@services/app-layer/entities/accounts-payable';
import { DimensionEntity } from '@services/app-layer/entities/dimension';
import { GroupEntity } from '@services/app-layer/entities/group';
import { MemberEntity } from '@services/app-layer/entities/member';
import { TransactionEntity } from '@services/app-layer/entities/transaction';
import { PurchaseOrdersService } from '@views/main/accounting/accounts-payable/purchase-orders/purchase-orders.service';
import { takeUntil } from 'rxjs/operators';
import { CrmAccountEntity } from '@services/app-layer/entities/crm';
import { Subject } from 'rxjs';
import { DialogModalComponent, DialogType } from '@components/common/modals/dialog-modal/dialog-modal.component';
import { MatDialog } from '@angular/material/dialog';
import { PurchaseOrdersApiService } from '@services/app-layer/purchase-orders/purchase-orders-api.service';
import { APPurchaseOrderStateEnum } from '@services/app-layer/app-layer.enums';

@Component({
  selector: 'app-view-purchase-order',
  templateUrl: 'view-purchase-order.component.html',
  styleUrls: ['./view-purchase-order.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ViewPurchaseOrderComponent implements OnInit, OnDestroy {
  @Input() data: APPurchaseOrder;
  @Input() groups: GroupEntity[] = [];
  @Input() dimensions: DimensionEntity[] = [];
  @Input() members: MemberEntity[] = [];
  @Input() transaction: TransactionEntity = null;
  @Input() crmAccounts: CrmAccountEntity[] = [];
  @Input() creditTerms: string;

  @Output() lineItemDeletedEvent = new EventEmitter();

  permissions = { canRead: false, canCreate: false, canUpdate: false, canDelete: false, canClose: false };
  transactionUrl = null;
  readonly entryUrl = location.href;

  private destroy$ = new Subject<void>();

  constructor(
    @Inject(LOCALE_ID) private localeId: string,
    private cd: ChangeDetectorRef,
    private purchaseOrdersService: PurchaseOrdersService,
    private purchaseOrdersApiService: PurchaseOrdersApiService,
    private router: Router,
    private route: ActivatedRoute,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.permissions = this.purchaseOrdersService.getPurchaseOrderPermissions();
    this.transactionUrl = `${location.origin}/order/transaction/${this.transaction?.id}`;
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onLineItemDeleted() {
    this.lineItemDeletedEvent.emit();
  }

  onBillDeleted = (bills: APBill[]) => {
    this.data.bills = bills;
    this.cd.markForCheck();
  };

  get canClosePurchaseOrder() {
    return this.permissions.canClose && this.data.isPendingClose;
  }

  onClosePurchaseOrder() {
    this.dialog
      .open(DialogModalComponent, {
        width: '450px',
        disableClose: true,
        data: {
          type: DialogType.Confirm,
          title: 'Confirm please!',
          content: 'Are you sure you want to CLOSE this PURCHASE ORDER?'
        }
      })
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(confirmed => {
        if (confirmed) {
          this.purchaseOrdersApiService.closePurchaseOrder(this.data.id).subscribe(() => {
            this.data.state = APPurchaseOrderStateEnum.CLOSED;
            this.cd.markForCheck();
          });
        }
      });
  }
}
