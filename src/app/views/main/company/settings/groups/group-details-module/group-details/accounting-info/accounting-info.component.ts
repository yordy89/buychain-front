import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { AccountsService } from '@services/app-layer/accounts/accounts.service';
import { AccountingInfoEntity, GroupEntity } from '@services/app-layer/entities/group';
import { GroupsService } from '@services/app-layer/groups/groups.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { BehaviorSubject, EMPTY, Subject } from 'rxjs';
import { Environment } from '@services/app-layer/app-layer.environment';
import { AccessControlScope } from '@services/app-layer/permission/permission.interface';
import { FormGroupHelper } from '@services/helpers/utils/form-group-helper';
import { ObjectUtil } from '@services/helpers/utils/object-util';
import { NotificationHelperService } from '@services/helpers/notification-helper/notification-helper.service';
import { catchError, takeUntil } from 'rxjs/operators';
import { AccountEntity } from '@services/app-layer/entities/account';
import { AccountingNaturalBalanceEnum, AccountingTypeEnum } from '@services/app-layer/app-layer.enums';

@Component({
  selector: 'app-accounting-info',
  templateUrl: './accounting-info.component.html',
  styleUrls: ['./accounting-info.component.scss']
})
export class AccountingInfoComponent implements OnInit, OnChanges, OnDestroy {
  @Input() groupDetails: GroupEntity;
  @Output() accountingInfoUpdated = new EventEmitter();
  public accountingInfo: AccountingInfoEntity;

  public currencies = ['USD'];
  public userPermissions = { canUpdate: false };

  public readonlyMode$: BehaviorSubject<boolean> = new BehaviorSubject(true);

  public formGroup: FormGroup;
  public EIN: FormControl;
  public currency: FormControl;
  public paymentDetails: FormControl;
  public REAccountId: FormControl;

  public REAccountsList: AccountEntity[] = [];
  public REAccount: AccountEntity;
  private accountsOffset = 0;
  private accountsLimit = 1000;
  public allLoaded = false;

  private destroy$ = new Subject<void>();

  constructor(
    private groupsService: GroupsService,
    private accountsService: AccountsService,
    private notificationHelperService: NotificationHelperService
  ) {}

  ngOnInit(): void {
    this.setPermissions();
    this.createFormControls();
    this.createForm();
    this.setInitialData();
    if (this.accountingInfo.REAccountId) this.getAccount();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.groupDetails) {
      this.accountingInfo = this.groupDetails.accountingInfo;
      this.setAccounts();
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  updateGroupAccountingInfo(): void {
    if (this.formGroup.invalid) return FormGroupHelper.markTouchedAndDirty(this.formGroup);
    const payload = FormGroupHelper.getChangedValues(
      FormGroupHelper.getDirtyValues(this.formGroup),
      this.accountingInfo
    );
    if (payload.EIN === '') payload.EIN = null;
    if (payload.EIN) payload.EIN = Number(payload.EIN);
    if (ObjectUtil.isEmptyObject(payload)) {
      FormGroupHelper.markUntouchedAndPristine(this.formGroup);
      return this.setReadOnlyStatus(true);
    }

    this.groupsService
      .updateGroupAccountingInfo(this.groupDetails, payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe(accountingInfo => {
        this.accountingInfoUpdated.emit(accountingInfo);
        this.setReadOnlyStatus(true);
        FormGroupHelper.markUntouchedAndPristine(this.formGroup);
        this.notificationHelperService.showSuccess('Accounting information was successfully updated');
      });
  }

  edit(): void {
    this.loadAccounts();
    this.setInitialData();
    this.setReadOnlyStatus(false);
  }
  cancel(): void {
    this.setReadOnlyStatus(true);
    FormGroupHelper.markUntouchedAndPristine(this.formGroup);
  }

  /*
   * private helpers
   * */

  private getAccount(): void {
    this.accountsService
      .getAccountById(this.accountingInfo.REAccountId)
      .pipe(
        catchError(() => {
          this.REAccount = null;
          this.REAccountId.setValue(null);
          return EMPTY;
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(account => (this.REAccount = account));
  }

  loadAccounts(): void {
    this.accountsService
      .getAccounts(this.accountsLimit, this.accountsOffset, {
        type: AccountingTypeEnum.Equity,
        naturalBalance: AccountingNaturalBalanceEnum.Credit
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe(accounts => {
        this.REAccountsList = [...this.REAccountsList, ...accounts].filter(item => !item.system && !item.archived);
        this.accountsOffset += this.accountsLimit;
        this.allLoaded = accounts.length < this.accountsLimit;
      });
  }

  private setAccounts(): void {
    if (!this.REAccountsList?.length) return;
    this.REAccount = this.REAccountsList.find(account => account.id === this.accountingInfo.REAccountId);
  }

  private setReadOnlyStatus(value: boolean): void {
    this.readonlyMode$.next(value);
  }

  private createFormControls(): void {
    this.EIN = new FormControl('', [Validators.maxLength(9), Validators.minLength(9)]);
    this.currency = new FormControl();
    this.paymentDetails = new FormControl('', [Validators.maxLength(1000)]);
    this.REAccountId = new FormControl('');
  }

  private createForm(): void {
    this.formGroup = new FormGroup({
      EIN: this.EIN,
      currency: this.currency,
      paymentDetails: this.paymentDetails,
      REAccountId: this.REAccountId
    });
  }

  private setInitialData(): void {
    this.EIN.setValue(this.convertEINtoString(this.accountingInfo.EIN));
    this.currency.setValue(this.accountingInfo.currency);
    this.paymentDetails.setValue(this.accountingInfo.paymentDetails);
    this.REAccountId.setValue(this.accountingInfo.REAccountId);
  }

  private setPermissions(): void {
    const currentUser = Environment.getCurrentUser();
    const groupPermissions = currentUser.normalizedAccessControlRoles.GROUP.groupSection.sectionGroup;
    this.userPermissions.canUpdate = groupPermissions.updateAccountingInfo.value === AccessControlScope.Company;
  }

  private convertEINtoString(input: number): string {
    if (!input && input !== 0) return undefined;
    let string = input.toString();
    while (string.length < 9) {
      string = '0' + string;
    }
    return string;
  }
}
