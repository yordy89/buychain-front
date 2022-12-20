import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { OrderTypeEnum, StockSubTypeEnum } from '@app/services/app-layer/app-layer.enums';
import { FormGroupHelper } from '@app/services/helpers/utils/form-group-helper';
import { NotificationHelperService } from '@app/services/helpers/notification-helper/notification-helper.service';
import { NavigationHelperService } from '@app/services/helpers/navigation-helper/navigation-helper.service';
import { TransactionsService } from '@app/services/app-layer/transactions/transactions.service';
import { AccessControlScope } from '@app/services/app-layer/permission/permission.interface';
import { Environment } from '@app/services/app-layer/app-layer.environment';
import { ObjectUtil } from '@services/helpers/utils/object-util';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-new-order',
  templateUrl: './new-order.component.html',
  styleUrls: ['./new-order.component.scss']
})
export class NewOrderComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  public initialOrderForm: FormGroup;
  public orderType: FormControl;
  public OrderType = OrderTypeEnum;
  public orderTypesList = ObjectUtil.enumToArray(OrderTypeEnum);
  public orderSubType: FormControl;
  public orderSubTypeList = ObjectUtil.enumToArray(StockSubTypeEnum);

  public userPermissions = {
    canRead: false,
    canDelete: false,
    canCreate: false
  };

  constructor(
    private notificationHelperService: NotificationHelperService,
    private transactionsService: TransactionsService,
    private navigationHelperService: NavigationHelperService
  ) {
    this.createOrderFormControls();
    this.createOrderForm();
    this.setUserPermissions();
  }

  ngOnInit(): void {
    this.orderType.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(typeValue => {
      // for different order types different subtypes may come
      typeValue ? this.orderSubType.enable() : this.orderSubType.disable();
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.unsubscribe();
  }

  public async createNewOrder() {
    if (this.initialOrderForm.invalid) {
      this.notificationHelperService.showValidation('Make sure to fill necessary data to create an order');
      return FormGroupHelper.markTouchedAndDirty(this.initialOrderForm);
    }

    this.transactionsService
      .createTransaction({ type: OrderTypeEnum.Stock, subtype: this.initialOrderForm.value.orderSubType })
      .pipe()
      .subscribe(transaction => {
        if (transaction) this.navigationHelperService.navigateToTransactionById(transaction.id);
      });
  }

  private setUserPermissions(): void {
    const currentUser = Environment.getCurrentUser();

    const txPermissions = currentUser.normalizedAccessControlRoles.TRANSACTION.transactionSection.sectionGroup;
    this.userPermissions.canCreate =
      (txPermissions.create.value === AccessControlScope.Company ||
        txPermissions.create.value === AccessControlScope.Owner) &&
      (txPermissions.readList.value === AccessControlScope.Company ||
        txPermissions.readList.value === AccessControlScope.Owner);
  }

  private createOrderFormControls(): void {
    this.orderType = new FormControl('', [Validators.required]);
    this.orderSubType = new FormControl({ value: '', disabled: true }, [Validators.required]);
  }

  private createOrderForm(): void {
    this.initialOrderForm = new FormGroup({
      orderType: this.orderType,
      orderSubType: this.orderSubType
    });
  }
}
