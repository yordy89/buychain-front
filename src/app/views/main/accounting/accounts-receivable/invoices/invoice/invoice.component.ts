import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { ARInvoice, ARSalesOrder } from '@services/app-layer/entities/accounts-receivable';
import { NotificationHelperService } from '@services/helpers/notification-helper/notification-helper.service';
import { LogEntriesModalComponent } from '@views/main/common/modals/log-entries-modal/log-entries-modal.component';
import { EMPTY, forkJoin, of, Subject } from 'rxjs';
import { catchError, finalize, first, mergeMap, takeUntil, tap } from 'rxjs/operators';
import { InvoicesService } from '@views/main/accounting/accounts-receivable/invoices/invoices.service';
import { AccountEntity } from '@services/app-layer/entities/account';
import { CompanyDetails } from '@services/data-layer/http-api/base-api/swagger-gen';
import { Environment } from '@services/app-layer/app-layer.environment';
import { CrmLocationEntity } from '@services/app-layer/entities/crm';
import { MemberEntity } from '@services/app-layer/entities/member';
import { ViewInvoiceComponent } from '@views/main/accounting/accounts-receivable/invoices/components/view-invoice/view-invoice.component';
import { InvoicesApiService } from '@services/app-layer/invoices/invoices-api.services';
import { MilestoneEntity } from '@services/app-layer/entities/transaction';

enum PageStatesEnum {
  VIEW,
  ADD,
  EDIT
}

@Component({
  selector: 'app-invoice',
  styleUrls: ['./invoice.component.scss'],
  templateUrl: 'invoice.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InvoiceComponent implements OnInit, OnDestroy {
  @ViewChild(ViewInvoiceComponent) viewInvoiceComponent: ViewInvoiceComponent;

  invoice: ARInvoice = null;
  state: PageStatesEnum = null;
  isLoaded = false;

  accounts: AccountEntity[] = [];
  salesOrder: ARSalesOrder;
  company: CompanyDetails = Environment.getCurrentCompany();
  billToLocation: CrmLocationEntity;
  shipToLocation: CrmLocationEntity;
  members: MemberEntity[] = [];
  milestones: MilestoneEntity[] = [];

  permissions = { canRead: false, canCreate: false, canUpdate: false, canDelete: false };

  private destroy$ = new Subject<void>();

  constructor(
    private invoicesService: InvoicesService,
    private invoicesApiService: InvoicesApiService,
    private router: Router,
    private route: ActivatedRoute,
    private notificationHelperService: NotificationHelperService,
    private cd: ChangeDetectorRef,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.setPermissions();

    if (this.permissions.canRead) {
      this.initState();
      this.loadData();
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initState() {
    const isAdd = this.route.snapshot.url[0]?.path === 'add';
    const isEdit = this.route.snapshot.queryParamMap.get('editInvoice') === 'true';

    if (isAdd && this.permissions.canCreate) {
      this.state = PageStatesEnum.ADD;
    } else if (isEdit && this.permissions.canUpdate) {
      this.state = PageStatesEnum.EDIT;
    } else {
      this.state = PageStatesEnum.VIEW;
    }
  }

  get isAddState() {
    return this.state === PageStatesEnum.ADD;
  }

  get isEditState() {
    return this.state === PageStatesEnum.EDIT;
  }

  get isViewState() {
    return this.state === PageStatesEnum.VIEW;
  }

  get title() {
    if (this.isViewState) {
      return 'View Invoice';
    }

    if (this.isAddState) {
      return 'Add Invoice';
    }

    if (this.isEditState) {
      return 'Edit Invoice';
    }
  }

  get isFromSalesOrder() {
    return this.router.url.includes('sales-orders');
  }

  get isAssigningLineItem() {
    return !!this.route.snapshot.queryParamMap.get('lineItemId');
  }

  private navigateToSO() {
    if (this.isAssigningLineItem) {
      this.router.navigate(['/accounting/sales-orders'], { relativeTo: this.route });
    } else {
      const isEditSalesOrder = this.route.snapshot.queryParamMap.get('editSalesOrder') === 'true';
      const salesOrderId = this.route.snapshot.paramMap.get('id');
      this.router.navigate(['/accounting/sales-orders', salesOrderId], {
        relativeTo: this.route,
        queryParams: {
          editSalesOrder: isEditSalesOrder
        }
      });
    }
  }

  onClose() {
    if (this.isFromSalesOrder) {
      this.navigateToSO();
    } else {
      this.router.navigate(['/accounting/invoices'], { relativeTo: this.route });
    }
  }

  onOpenLog() {
    this.dialog
      .open(LogEntriesModalComponent, {
        disableClose: true,
        width: '800px',
        data: {
          logs: this.invoice.log,
          members: this.members,
          name: 'Invoice'
        }
      })
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }

  private setPermissions(): void {
    this.permissions = this.invoicesService.getInvoicePermissions();
  }

  private loadData() {
    if (this.isAddState) {
      return this.loadAddStateData();
    }

    return this.loadViewEditStateData();
  }

  private loadViewEditStateData() {
    return forkJoin([this.getItemData(), this.loadAccounts(), this.loadMembers(), this.loadMilestones()])
      .pipe(
        mergeMap(() => this.loadLocations()),
        catchError(this.handleLoadDataError),
        finalize(() => this.cd.markForCheck()),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.isLoaded = true;
      });
  }

  private loadAddStateData() {
    return forkJoin([this.loadAccounts(), this.loadSalesOrder()])
      .pipe(
        mergeMap(() => this.loadLocations()),
        catchError(this.handleLoadDataError),
        finalize(() => this.cd.markForCheck()),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.isLoaded = true;
      });
  }

  private handleLoadDataError = ({ error }) => {
    this.notificationHelperService.showValidation(error.message);
    this.router.navigate(['../'], { relativeTo: this.route });
    return EMPTY;
  };

  private getItemData() {
    const invoiceId = this.isFromSalesOrder
      ? this.route.snapshot.paramMap.get('invoiceId')
      : this.route.snapshot.paramMap.get('id');

    if (!invoiceId) {
      return of(null);
    }

    return this.invoicesService.getInvoiceFromSalesOrder(invoiceId).pipe(
      tap(data => {
        this.invoice = data.invoice;
        this.salesOrder = data.salesOrder;
      })
    );
  }

  private loadAccounts() {
    return this.invoicesService.getAccounts().pipe(
      tap((accounts: AccountEntity[]) => {
        this.accounts = accounts;
      })
    );
  }

  private loadSalesOrder() {
    const salesOrderId = this.route.snapshot.paramMap.get('id');

    return this.invoicesService.getSalesOrder(salesOrderId).pipe(
      tap((salesOrder: ARSalesOrder) => {
        this.salesOrder = salesOrder;
      })
    );
  }

  private loadLocations() {
    return this.invoicesService.getCrmLocations(this.salesOrder.customer).pipe(
      first(),
      tap(locations => {
        this.billToLocation = this.invoice?.altBillTo || locations.billToLocation;
        this.shipToLocation = locations.shipToLocation;
      })
    );
  }

  private loadMembers() {
    return this.invoicesService.getMembers().pipe(
      first(),
      tap(members => {
        this.members = members;
      })
    );
  }

  private loadMilestones() {
    const invoiceId = this.isFromSalesOrder
      ? this.route.snapshot.paramMap.get('invoiceId')
      : this.route.snapshot.paramMap.get('id');
    return this.invoicesApiService.getInvoiceMilestones(invoiceId).pipe(
      first(),
      tap(milestones => {
        this.milestones = milestones;
      })
    );
  }

  onEdit() {
    this.state = PageStatesEnum.EDIT;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { editInvoice: true }
    });
  }

  onResult(invoiceId: string) {
    if (this.isFromSalesOrder) {
      this.navigateToSO();
    } else {
      this.isLoaded = false;
      this.router.navigate(['/accounting/invoices', invoiceId], { relativeTo: this.route }).then(() => {
        this.initState();
        this.loadData();
      });
    }
  }

  generateViewInvoicePDF() {
    this.viewInvoiceComponent.generateViewInvoicePDF();
  }
}
