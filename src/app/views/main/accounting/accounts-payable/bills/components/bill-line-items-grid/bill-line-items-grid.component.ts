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
import { APBill, APLineItem, APPurchaseOrder } from '@services/app-layer/entities/accounts-payable';
import { MatDialog } from '@angular/material/dialog';
import { BillsService } from '@views/main/accounting/accounts-payable/bills/bills.service';
import { formatCurrency } from '@angular/common';
import { TableAction } from '@app/models';
import { AddLineFromPurchaseOrderModalComponent } from '@views/main/accounting/accounts-payable/bills/components/add-line-from-purchase-order-modal/add-line-from-purchase-order-modal.component';
import { Subject } from 'rxjs';
import { switchMap, takeUntil } from 'rxjs/operators';
import { BillsApiService } from '@services/app-layer/bills/bills-api.services';

enum Actions {
  EDIT,
  DELETE
}

@Component({
  selector: 'app-bill-line-items-grid',
  templateUrl: 'bill-line-items-grid.component.html',
  styleUrls: ['../common/bill-grid-items.common.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BillLineItemsGridComponent implements OnInit, OnDestroy {
  @Input() data: APBill;
  @Input() purchaseOrder: APPurchaseOrder;
  @Input() printing = false;

  actions: TableAction[];
  openLineItems: APLineItem[] = [];
  permissions = {
    canCreateLineItem: false,
    canUpdateLineItem: false,
    canDeleteLineItem: false
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
    this.permissions = this.billsService.getLineItemPermissions();
    this.openLineItems = this.purchaseOrder.openLineItems;
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
        isHidden: !(this.permissions.canUpdateLineItem && this.data.isDraft)
      },
      {
        label: 'Delete',
        icon: 'delete',
        color: 'warn',
        value: Actions.DELETE,
        prompt: {
          title: 'Confirm please!',
          text: 'Are you sure you want to delete this Line Item?'
        },
        isHidden: !(this.permissions.canDeleteLineItem && this.data.isDraft)
      }
    ];
  }

  onAction(value: Actions, item: APLineItem) {
    switch (value) {
      case Actions.EDIT:
        this.onEditLineItem(item);
        break;
      case Actions.DELETE:
        this.onDeleteLineItem(item);
        break;
    }
  }

  onAddLineItem() {
    const isEditBill = this.route.snapshot.queryParamMap.get('editBill') === 'true';
    this.router.navigate(['line/add'], {
      relativeTo: this.route,
      queryParams: {
        editBill: isEditBill
      }
    });
  }

  get canNotAddLineItems() {
    return !this.data.isDraft;
  }

  get canNotAddLineItemsFromPurchaseOrder() {
    return this.canNotAddLineItems || !this.openLineItems?.length;
  }

  onAddLineItemFromPurchaseOrder() {
    const data = {
      purchaseOrderId: this.purchaseOrder.id,
      openLineItems: this.openLineItems,
      billId: this.data.id
    };

    this.dialog
      .open(AddLineFromPurchaseOrderModalComponent, {
        width: '848px',
        data
      })
      .afterClosed()
      .subscribe((addedLineItems: APLineItem[]) => {
        if (addedLineItems?.length) {
          this.data.billLineItems = addedLineItems;
          const isNotAddedLineItem = (lineItem: APLineItem) =>
            addedLineItems.every(addedLineItem => addedLineItem.id !== lineItem.id);
          this.openLineItems = this.openLineItems.filter(isNotAddedLineItem);
          this.cd.markForCheck();
        }
      });
  }

  onEditLineItem(entry: APLineItem) {
    const isEditBill = this.route.snapshot.queryParamMap.get('editBill') === 'true';
    this.router.navigate(['line/', entry.id], {
      relativeTo: this.route,
      queryParams: {
        editBill: isEditBill,
        editLineItem: true
      }
    });
  }

  onDeleteLineItem(entry: APLineItem) {
    this.billsApiService
      .deleteBillLineItem(this.data.id, entry.id)
      .pipe(
        switchMap(() => {
          return this.billsService.getPurchaseOrder(this.purchaseOrder.id).pipe(takeUntil(this.destroy$));
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(po => {
        const index = this.data.billLineItems.findIndex(item => item.id === entry.id);

        if (index === -1) {
          return;
        }

        if (po?.openLineItems) {
          this.openLineItems = po.openLineItems;
        }

        this.data.billLineItems = this.data.billLineItems.filter(item => item.id !== entry.id);
        this.cd.markForCheck();
      });
  }
}
