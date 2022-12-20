import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { TableAction } from '@app/models';
import { CrmStateService } from '@views/main/crm/crm/crm-state.service';
import { BehaviorSubject, Subject } from 'rxjs';
import { switchMap, takeUntil } from 'rxjs/operators';
import { NotificationHelperService } from '@services/helpers/notification-helper/notification-helper.service';
import { FormGroupHelper } from '@services/helpers/utils/form-group-helper';
import { MatDialog } from '@angular/material/dialog';
import { LinkedCrmAccountModalComponent } from '@views/main/crm/crm/right-hand-side/crm-account/linked-crm-account-modal/linked-crm-account-modal.component';
import { UnlinkedCrmAccountModalComponent } from '@views/main/crm/crm/right-hand-side/crm-account/unlinked-crm-account-modal/unlinked-crm-account-modal.component';
import { AccessControlScope } from '@services/app-layer/permission/permission.interface';
import { Environment } from '@services/app-layer/app-layer.environment';
import { CompaniesService } from '@services/app-layer/companies/companies.service';
import { MemberEntity } from '@services/app-layer/entities/member';
import { CrmAccountEntity, CrmLocationEntity, CrmContactEntity } from '@services/app-layer/entities/crm';
import { CrmComponentService } from '@views/main/crm/crm/crm.component.service';
import { ObjectUtil } from '@services/helpers/utils/object-util';
import { CrmTypeEnum, LabelKey, LabelGroupName } from '@services/app-layer/app-layer.enums';

enum Actions {
  DELETE
}

@Component({
  selector: 'app-crm-account',
  templateUrl: './crm-account.component.html',
  styleUrls: ['../common/right-hand-side.common.scss', './crm-account.component.scss']
})
export class CrmAccountComponent implements OnInit, OnDestroy {
  public crmAccountData$: BehaviorSubject<CrmAccountEntity> = new BehaviorSubject<CrmAccountEntity>(null);
  private _crmAccountData: CrmAccountEntity;
  @Input() get crmAccountData(): CrmAccountEntity {
    return this._crmAccountData;
  }
  set crmAccountData(value: CrmAccountEntity) {
    this._crmAccountData = value;
    this.crmAccountData$.next(value);
    if (value) {
      this.tabIndex = 0;
      this.setUserPermissions();
      this.setInitialData(value);
      this.setSalesTeamMembers();
      this.setDefaultBillTo(value);
    }
  }

  public readonlyMode$: BehaviorSubject<boolean> = new BehaviorSubject(true);
  public form: FormGroup;
  public crmPermissions: any;
  public LabelKey = LabelKey;
  public CRMType = CrmTypeEnum;
  public LabelGroupName = LabelGroupName;

  public tabIndex = 0;
  public membersList: MemberEntity[];
  public filteredMembersList: MemberEntity[];
  public salesTeamList: MemberEntity[];
  public isAddingSeller = false;
  public salesTeam: FormControl;
  public salesTeamSelectorControl: FormControl;

  public billToContactFormControl = new FormControl(null);
  public billToLocationFormControl = new FormControl(null);
  public isOnlyOffline = Environment.isOnlyOffline();
  showCreditMemosTab = false;

  readonly tableActions: TableAction[] = [
    {
      label: 'Delete',
      icon: 'delete',
      color: 'warn',
      value: Actions.DELETE,
      prompt: {
        title: 'Confirm please!',
        text: 'Are you sure you want to delete the sales team member?'
      }
    }
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private dialog: MatDialog,
    private companiesService: CompaniesService,
    private notificationHelperService: NotificationHelperService,
    private crmComponentService: CrmComponentService,
    public crmStateService: CrmStateService
  ) {
    this.createFormControls();
    this.createForm();
  }

  ngOnInit() {
    this.subscribeOnBillToFormChange();
    const companyFeatures = Environment.getCompanyFeatures();
    const isAllowedEnvironment = Environment.isDevelopment || Environment.isDemo;
    this.showCreditMemosTab =
      isAllowedEnvironment && companyFeatures.accounting && this.crmPermissions.canReadCreditMemoInfo;
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  public edit(): void {
    this.setReadOnlyStatus(false);
  }
  public cancel(): void {
    this.setReadOnlyStatus(true);
    FormGroupHelper.markUntouchedAndPristine(this.form);
    this.salesTeamList = this.membersList.filter(item =>
      this.crmAccountData.salesTeam.find(sellerId => sellerId === item.id)
    );
  }

  public updateCRMAccount(): void {
    if (this.form.invalid) return FormGroupHelper.markTouchedAndDirty(this.form);
    if (ObjectUtil.isEmptyObject(this.getNormalizedPayload())) {
      FormGroupHelper.markUntouchedAndPristine(this.form);
      return this.setReadOnlyStatus(true);
    }

    this.crmComponentService
      .updateAccount(this.crmAccountData, this.getNormalizedPayload())
      .pipe(takeUntil(this.destroy$))
      .subscribe((updatedAccount: CrmAccountEntity) => {
        this.crmStateService.updateActiveAccount(updatedAccount);
        FormGroupHelper.markUntouchedAndPristine(this.form);
        this.notificationHelperService.showSuccess('CRM Account was successfully updated');
        this.setReadOnlyStatus(true);
      });
  }

  public openLinkedCrmAccountModal(entity?: CrmAccountEntity): void {
    this.dialog
      .open(LinkedCrmAccountModalComponent, {
        width: '648px',
        disableClose: true,
        data: entity || this.crmAccountData
      })
      .afterClosed()
      .subscribe(data => {
        if (data) {
          this.crmStateService.updateActiveAccount(data);
          this.crmStateService.unlinkEntitiesFromAccount(data);
        }
      });
  }
  public openUnlinkedCrmAccountModal(): void {
    this.dialog
      .open(UnlinkedCrmAccountModalComponent, {
        width: '648px',
        disableClose: true,
        data: this.crmAccountData
      })
      .afterClosed()
      .subscribe(data => {
        if (data) {
          this.crmStateService.updateActiveAccount(data);
          this.openLinkedCrmAccountModal(data);
        }
      });
  }

  // Sales Team methods

  public removeSalesTeamMember(salesTeamMember: MemberEntity): void {
    this.salesTeamList = this.salesTeamList.filter(member => member.id !== salesTeamMember.id);
    this.filteredMembersList = this.membersList.filter(
      item => !this.salesTeamList.some(seller => seller.id === item.id)
    );
    this.salesTeam.setValue(this.salesTeamList.map(item => item.id));
    FormGroupHelper.markControlTouchedAndDirty(this.salesTeam);
  }
  public addSalesTeamMember(): void {
    if (this.salesTeamList.some(seller => seller.id === this.salesTeamSelectorControl.value.id)) {
      this.notificationHelperService.showValidation('This user is already in sales team');
    } else {
      this.salesTeamList.push(this.salesTeamSelectorControl.value);
      this.filteredMembersList = this.membersList.filter(
        item => !this.salesTeamList.some(seller => seller.id === item.id)
      );
      this.salesTeam.setValue(this.salesTeamList.map(item => item.id));
      FormGroupHelper.markControlTouchedAndDirty(this.salesTeam);
      this.isAddingSeller = false;
      this.salesTeamSelectorControl.reset();
    }
  }
  public toggleAddSellerMode(value: boolean): void {
    this.isAddingSeller = value;
  }

  public getContacts(): CrmContactEntity[] {
    return this.crmStateService.crmContacts.filter(x => x.crmAccountId === this.crmAccountData.id);
  }

  public getLocations(): CrmLocationEntity[] {
    return this.crmStateService.crmLocations.filter(x => x.crmAccountId === this.crmAccountData.id);
  }

  onTableAction(value: Actions, item: MemberEntity) {
    if (value === Actions.DELETE) {
      this.removeSalesTeamMember(item);
    }
  }

  resetCrmAccountField(event, control: FormControl) {
    event.stopPropagation();
    control.reset(null);
  }

  /*
   * private helpers
   * */

  private createForm(): void {
    this.form = new FormGroup({
      salesTeam: this.salesTeam
    });
  }
  private createFormControls(): void {
    this.salesTeam = new FormControl([]);
    this.salesTeamSelectorControl = new FormControl('');
  }
  private setInitialData(salesInitialInfo: CrmAccountEntity): void {
    this.salesTeam.setValue(salesInitialInfo.salesTeam);
  }

  private setReadOnlyStatus(value: boolean): void {
    this.readonlyMode$.next(value);
  }

  private setUserPermissions(): void {
    const user = Environment.getCurrentUser();
    this.crmPermissions = {
      canReadSalesInfo:
        user.normalizedAccessControlRoles.CRM_ACCOUNT.CRMSection.sectionGroup.readSalesInfo.value ===
          AccessControlScope.Company ||
        (user.normalizedAccessControlRoles.CRM_ACCOUNT.CRMSection.sectionGroup.readSalesInfo.value ===
          AccessControlScope.Owner &&
          this.crmAccountData.salesTeam.some(seller => seller === user.id)),
      canReadCreditInfo:
        user.normalizedAccessControlRoles.CRM_ACCOUNT.CRMSection.sectionGroup.readCreditInfo.value ===
          AccessControlScope.Company ||
        (user.normalizedAccessControlRoles.CRM_ACCOUNT.CRMSection.sectionGroup.readCreditInfo.value ===
          AccessControlScope.Owner &&
          this.crmAccountData.salesTeam.some(seller => seller === user.id)),
      canReadCreditMemoInfo: true, //Need to wait for permission to be added to the API
      canReadPaymentInfo:
        user.normalizedAccessControlRoles.CRM_ACCOUNT.CRMSection.sectionGroup.readPaymentInfo.value ===
          AccessControlScope.Company ||
        (user.normalizedAccessControlRoles.CRM_ACCOUNT.CRMSection.sectionGroup.readPaymentInfo.value ===
          AccessControlScope.Owner &&
          this.crmAccountData.salesTeam.some(seller => seller === user.id)),
      canUpdate:
        user.normalizedAccessControlRoles.CRM_ACCOUNT.CRMSection.sectionGroup.updateEntry.value ===
          AccessControlScope.Company ||
        (user.normalizedAccessControlRoles.CRM_ACCOUNT.CRMSection.sectionGroup.updateEntry.value ===
          AccessControlScope.Owner &&
          this.crmAccountData.salesTeam.some(seller => seller === user.id)),
      canReadTransactions:
        user.normalizedAccessControlRoles.TRANSACTION.transactionSection.sectionGroup.readList.value ===
          AccessControlScope.Company ||
        user.normalizedAccessControlRoles.TRANSACTION.transactionSection.sectionGroup.readList.value ===
          AccessControlScope.Owner
    };
  }

  private setSalesTeamMembers(): void {
    this.companiesService
      .getCompanyCompleteMembers()
      .pipe(takeUntil(this.destroy$))
      .subscribe(members => {
        this.membersList = members;
        this.salesTeamList = this.crmAccountData.salesTeam.map(
          sellerId => this.membersList.find(member => member.id === sellerId) || <any>{ id: sellerId }
        );
        this.filteredMembersList = this.membersList.filter(
          item => !this.salesTeamList.some(seller => seller.id === item.id)
        );
      });
  }

  private setDefaultBillTo(crmAccount) {
    if (this.billToContactFormControl.value !== (crmAccount.defaultBillToContact || null)) {
      this.billToContactFormControl.setValue(crmAccount.defaultBillToContact);
    }

    if (this.billToLocationFormControl.value !== (crmAccount.defaultBillToLocation || null)) {
      this.billToLocationFormControl.setValue(crmAccount.defaultBillToLocation);
    }
  }

  private getNormalizedPayload(): any {
    const payload = FormGroupHelper.getDirtyValues(this.form.controls.company);
    // TODO enhance after getChangeValues refactored;
    // if country only removed the address controls become disabled and dirty is getting false
    const form = this.form.controls.company['controls'];
    if (form.state.value !== this.crmAccountData.state) payload.state = form.state.value || null;
    if (form.city.value !== this.crmAccountData.city) payload.city = form.city.value || null;
    if (form.zipCode.value !== this.crmAccountData.zipCode) payload.zipCode = form.zipCode.value || null;
    if (this.salesTeam.dirty) payload.salesTeam = this.salesTeam.value;
    return payload;
  }

  private subscribeOnBillToFormChange() {
    this.billToContactFormControl.valueChanges
      .pipe(
        switchMap(newContactId =>
          this.crmComponentService.updateAccount(this.crmAccountData, { defaultBillToContact: newContactId })
        )
      )
      .subscribe(data => {
        this.crmStateService.updateActiveAccount(data);
      });

    this.billToLocationFormControl.valueChanges
      .pipe(
        switchMap(newLocationId =>
          this.crmComponentService.updateAccount(this.crmAccountData, { defaultBillToLocation: newLocationId })
        )
      )
      .subscribe(data => {
        this.crmStateService.updateActiveAccount(data);
      });
  }
}
