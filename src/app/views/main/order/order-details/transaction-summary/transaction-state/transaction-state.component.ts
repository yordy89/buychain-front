import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ObjectUtil } from '@services/helpers/utils/object-util';
import { ChangeTransactionTypesEnum, TransactionStateEnum } from '@app/services/app-layer/app-layer.enums';
import { TransactionEntity } from '@app/services/app-layer/entities/transaction';

@Component({
  selector: 'app-transaction-state',
  templateUrl: './transaction-state.component.html',
  styleUrls: ['./transaction-state.component.scss']
})
export class TransactionStateComponent implements OnChanges {
  @Input() transactionData: TransactionEntity;
  transactionStateIndex: number;
  isNegativeState: boolean;

  public ChangeTransactionTypesEnum = ChangeTransactionTypesEnum; // TODO on state update
  public TransactionStateEnum = TransactionStateEnum;

  public transactionStatesList = ObjectUtil.enumToArray(TransactionStateEnum).filter(
    s => s !== TransactionStateEnum.Canceled && s !== TransactionStateEnum.ChangePending
  );

  ngOnChanges({ transactionData }: SimpleChanges) {
    if (transactionData?.currentValue) {
      this.transactionStateIndex = this.getTransactionStateIndex();
      this.isNegativeState = this.checkIfIsNegativeState();
    }
  }

  private getTransactionStateIndex(): number {
    if (!this.transactionData?.state || !this.transactionStatesList) return null;
    return this.transactionStatesList.findIndex(item => item === this.transactionData.state);
  }

  private checkIfIsNegativeState(): boolean {
    return (
      this.transactionData.state === TransactionStateEnum.ChangePending ||
      this.transactionData.state === TransactionStateEnum.Canceled
    );
  }
}
