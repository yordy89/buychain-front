import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AccountEntity } from '@services/app-layer/entities/account';
import { ARInvoice, ARLineItem } from '@services/app-layer/entities/accounts-receivable';
import { EMPTY, forkJoin, Subject } from 'rxjs';
import { catchError, finalize, takeUntil, tap } from 'rxjs/operators';
import { NotificationHelperService } from '@services/helpers/notification-helper/notification-helper.service';
import { InvoicesService } from '@views/main/accounting/accounts-receivable/invoices/invoices.service';

enum PageStatesEnum {
  ADD,
  EDIT
}

@Component({
  selector: 'app-invoice-line',
  templateUrl: 'invoice-line.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InvoiceLineComponent implements OnInit, OnDestroy {
  permissions = {
    canCreateLineItem: false,
    canUpdateLineItem: false,
    canDeleteLineItem: false
  };
  data: ARLineItem;
  accounts: AccountEntity[] = [];
  invoice: ARInvoice;

  state: PageStatesEnum = null;
  isLoaded = false;
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private invoicesService: InvoicesService,
    private router: Router,
    private cd: ChangeDetectorRef,
    private notificationHelperService: NotificationHelperService
  ) {}

  ngOnInit() {
    this.setPermissions();
    this.initState();
    this.loadData();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initState() {
    const lineId = this.route.snapshot.paramMap.has('lineId');
    const isEdit = this.route.snapshot.queryParamMap.get('editLineItem') === 'true';

    if (!lineId && this.permissions.canCreateLineItem) {
      this.state = PageStatesEnum.ADD;
    } else if (isEdit && this.permissions.canUpdateLineItem) {
      this.state = PageStatesEnum.EDIT;
    }
  }

  get isAddState() {
    return this.state === PageStatesEnum.ADD;
  }

  get isEditState() {
    return this.state === PageStatesEnum.EDIT;
  }

  get title() {
    if (this.isEditState) {
      return 'Edit Line Item';
    }

    if (this.isAddState) {
      return 'Add Line Item';
    }
  }

  get invoiceId() {
    const isFromSalesOrder = this.router.url.includes('sales-orders');
    const paramName = isFromSalesOrder ? 'invoiceId' : 'id';
    return this.route.snapshot.paramMap.get(paramName);
  }

  private loadData() {
    forkJoin([this.getItemData(), this.invoicesService.getAccounts(), this.invoicesService.getInvoice(this.invoiceId)])
      .pipe(
        tap(([lineItem, accounts, invoice]: [ARLineItem, AccountEntity[], ARInvoice]) => {
          this.data = lineItem;
          this.accounts = accounts;
          this.invoice = invoice;
        }),
        catchError(({ error }) => {
          this.notificationHelperService.showValidation(error.message);
          this.router.navigate(['../'], { relativeTo: this.route });
          return EMPTY;
        }),
        finalize(() => this.cd.markForCheck()),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.isLoaded = true;
      });
  }

  private getItemData() {
    const lineId = this.route.snapshot.paramMap.get('lineId');

    return this.invoicesService.getInvoiceLineItem(this.invoiceId, lineId);
  }

  onClose() {
    const isEditInvoice = this.route.snapshot.queryParamMap.get('editInvoice') === 'true';
    this.router.navigate(['../../'], {
      relativeTo: this.route,
      queryParams: {
        editInvoice: isEditInvoice
      }
    });
  }

  private setPermissions(): void {
    this.permissions = this.invoicesService.getLineItemPermissions();
  }
}
