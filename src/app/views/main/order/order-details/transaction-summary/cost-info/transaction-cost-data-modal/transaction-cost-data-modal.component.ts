import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { TypeCheck } from '@services/helpers/utils/type-check';
import { IntegerValidator } from '@validators/integer.validator/integer.validator';
import { debounceTime, first, takeUntil } from 'rxjs/operators';
import { FormGroupHelper } from '@services/helpers/utils/form-group-helper';
import { AccessControlScope } from '@services/app-layer/permission/permission.interface';
import { CostDataCostOfGood, TransactionEntity } from '@app/services/app-layer/entities/transaction';
import { TransactionsService } from '@app/services/app-layer/transactions/transactions.service';
import { CogTypeEnum, RoleInTransaction, TransactionStateEnum } from '@app/services/app-layer/app-layer.enums';
import { Environment } from '@services/app-layer/app-layer.environment';
import { combineLatest, Subject } from 'rxjs';
import { NotificationHelperService } from '@services/helpers/notification-helper/notification-helper.service';
import { ObjectUtil } from '@services/helpers/utils/object-util';

@Component({
  selector: 'app-transaction-cost-data-modal',
  templateUrl: './transaction-cost-data-modal.component.html',
  styleUrls: ['./transaction-cost-data-modal.component.scss']
})
export class TransactionCostDataModalComponent implements OnInit, OnDestroy {
  public costsForm: FormGroup;
  public cogSubtotal: number;
  public buyChainTxFee: number;
  public haveAccessToEdit = false;
  public cogArray: CostDataCostOfGood[];
  public transaction: TransactionEntity;
  public RoleInTransaction = RoleInTransaction;
  public CogTypeEnum = CogTypeEnum;
  title = '';
  subtotal = 0;

  private destroy$ = new Subject<void>();

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { transaction: TransactionEntity; buyChainTxFee: number },
    private dialogRef: MatDialogRef<TransactionCostDataModalComponent>,
    private transactionsService: TransactionsService,
    private notificationService: NotificationHelperService
  ) {
    this.transaction = data.transaction;
    this.buyChainTxFee = data.buyChainTxFee;
  }

  ngOnInit() {
    this.cogArray = ObjectUtil.getDeepCopy(this.transaction.costData.cogs || this.transaction.costData.cogp);
    this.initTitle();
    this.setAccessControl();
    this.createForm();
    this.calculateSubtotal();
    this.handleFormChanges();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getControl(item): FormControl {
    return this.costsForm.get(item) as FormControl;
  }

  private handleFormChanges() {
    this.costsForm.valueChanges.pipe(debounceTime(500), takeUntil(this.destroy$)).subscribe(() => {
      this.calculateSubtotal();
    });
  }

  public updateAllChangedCogs() {
    if (this.costsForm.invalid) return FormGroupHelper.markTouchedAndDirty(this.costsForm);

    const createTasks = this.cogArray
      .filter(x => !x.createdAt)
      .map(cog => {
        const value = this.getControlValue(cog.id);
        const label = this.capitalizeFirstLetter(this.getControlValue(cog.id + 'label'));
        const payload = { label, value };
        return this.transactionsService.AddTransactionCostDataCog(this.transaction.id, payload, this.transaction.role);
      });

    const updateTasks = this.cogArray
      .filter(x => x.createdAt)
      .filter(x => x.value !== this.getControlValue(x.id))
      .map(cog => {
        const newValue = this.getControlValue(cog.id);
        const payload = { value: newValue };
        return this.transactionsService.updateTransactionCostDataCog(
          this.transaction.id,
          cog.id,
          payload,
          this.transaction.role
        );
      });

    const tasks = createTasks.concat(updateTasks);

    if (!tasks.length) return this.close(false);

    try {
      combineLatest(tasks)
        .pipe(first())
        .subscribe(() => {
          FormGroupHelper.markUntouchedAndPristine(this.costsForm);
          this.close(true);
        });
    } catch (error) {
      const message = error.error ? error.error.message : error.message;
      this.notificationService.showValidation(message);
    }
  }

  public onAddClick() {
    const cog = new CostDataCostOfGood();
    cog.id = (this.cogArray.length + 1).toString();
    cog.type = CogTypeEnum.Other;
    cog.value = 0;

    const newValueFrom = new FormControl(cog.value, [Validators.required, Validators.min(0), IntegerValidator()]);
    const newLabelFrom = new FormControl(cog.label, [Validators.required, Validators.maxLength(100)]);

    this.costsForm.addControl(cog.id, newValueFrom);
    this.costsForm.addControl(cog.id + 'label', newLabelFrom);

    this.cogArray.push(cog);
  }

  public onRemoveClick(cogId) {
    this.cogArray = this.cogArray.filter(item => item.id !== cogId);

    this.costsForm.removeControl(cogId);
    this.costsForm.removeControl(cogId + 'label');
  }

  public close(changed: boolean): void {
    this.dialogRef.close(changed);
  }

  public setAccessControl(): void {
    const currentUser = Environment.getCurrentUser();
    const transactionPermissions = currentUser.normalizedAccessControlRoles.TRANSACTION.transactionSection.sectionGroup;
    this.haveAccessToEdit =
      !this.transaction.passedTheState(TransactionStateEnum.Review) &&
      (transactionPermissions.updateCostData.value === AccessControlScope.Company ||
        (transactionPermissions.updateCostData.value === AccessControlScope.Owner && this.transaction.isResourceOwner));
  }

  private initTitle() {
    const statusName = this.transaction.role === this.RoleInTransaction.Seller ? 'Sold' : 'Purchased';
    this.title = `Edit Cost Of Goods ${statusName}`;
  }

  private createForm(): void {
    this.costsForm = new FormGroup({});
    this.cogArray.forEach(cog => {
      this.costsForm.addControl(
        cog.id,
        new FormControl(cog.value, [Validators.required, Validators.min(0), IntegerValidator()])
      );
    });
    if (!this.haveAccessToEdit) this.costsForm.disable({ emitEvent: false });
  }

  private calculateSubtotal() {
    this.subtotal = Object.keys(this.costsForm.value)
      .map(key => this.costsForm.value[key])
      .filter(item => TypeCheck.isNumber(item))
      .reduce((acc, curr) => acc + curr, 0);
  }

  private capitalizeFirstLetter(string) {
    if (!string || !string.length) return string;
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  private getControlValue(key) {
    return this.costsForm.controls[key].value;
  }
}
