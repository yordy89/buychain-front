import { Component, Input } from '@angular/core';
import { AccountingNaturalBalanceEnum, AccountingTypeEnum } from '@services/app-layer/app-layer.enums';
import { ObjectUtil } from '@services/helpers/utils/object-util';

@Component({
  selector: 'app-account-filters',
  templateUrl: './account-filters.component.html'
})
export class AccountFiltersComponent {
  @Input() filtersState: { [key: string]: boolean };
  private _filters: any;
  @Input() public get filters() {
    return this._filters;
  }
  public set filters(value) {
    this._filters = value;
  }

  public naturalBalancesList = ObjectUtil.enumToArray(AccountingNaturalBalanceEnum);
  public accountTypes = ObjectUtil.enumToArray(AccountingTypeEnum);

  public resetNaturalBalance(e): void {
    e.stopPropagation();
    this.filters.naturalBalance = '';
  }

  public resetAccountTypes(e): void {
    e.stopPropagation();
    this.filters.type = '';
  }
}
