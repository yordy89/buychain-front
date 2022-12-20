import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { TransactionEntity } from '@services/app-layer/entities/transaction';
import { MemberEntity } from '@services/app-layer/entities/member';
import { CrmAccountEntity } from '@services/app-layer/entities/crm';

@Component({
  selector: 'app-filter-by-trader',
  templateUrl: './filter-by-trader.component.html',
  styleUrls: ['./filter-by-trader.component.scss']
})
export class FilterByTraderComponent implements OnInit, OnDestroy {
  @Input() crmSellersList: MemberEntity[];
  @Input() crmTransactions: TransactionEntity[];
  private _crmAccountData: CrmAccountEntity;
  @Input() get crmAccountData(): CrmAccountEntity {
    return this._crmAccountData;
  }
  set crmAccountData(value: CrmAccountEntity) {
    if (!value) return;
    this._crmAccountData = value;
    this.sellerSelectorControl.setValue('all');
  }
  @Input() action: any;

  private destroy$ = new Subject<void>();

  public form: FormGroup;
  public sellerSelectorControl: FormControl;

  constructor() {
    this.createFormControls();
    this.createForm();
  }

  ngOnInit() {
    this.sellerSelectorControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(value => {
      if (!value || !this.crmTransactions) return;
      if (value === 'all') this.action.onTraderSelect(this.crmTransactions);
      else this.action.onTraderSelect(this.crmTransactions.filter(transaction => transaction.seller.id === value.id));
    });
  }

  public ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.unsubscribe();
  }

  public trackByFn(index, member) {
    return member.id;
  }

  /*
   * private helpers
   * */
  private createFormControls(): void {
    this.sellerSelectorControl = new FormControl('all');
  }
  private createForm(): void {
    this.form = new FormGroup({ sellerSelectorControl: this.sellerSelectorControl });
  }
}
