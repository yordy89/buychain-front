import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { takeUntil } from 'rxjs/operators';
import { FormControl, FormGroup } from '@angular/forms';
import { Subject } from 'rxjs';
import { AccessControlScope } from '@services/app-layer/permission/permission.interface';
import {
  CompanySettingsExpandableSection,
  NavigationHelperService
} from '@services/helpers/navigation-helper/navigation-helper.service';
import { Environment } from '@services/app-layer/app-layer.environment';
import { CrmAccountEntity, CrmContactEntity, CrmLocationEntity } from '@services/app-layer/entities/crm';
import { CrmComponentService } from '@views/main/crm/crm/crm.component.service';
import { CrmTypeEnum, LabelKey, LabelGroupName } from '@services/app-layer/app-layer.enums';
import { LabelEntity } from '@app/services/app-layer/entities/label';
import { LabelsService } from '@app/services/app-layer/labels/labels.service';

@Component({
  selector: 'app-labels-group',
  templateUrl: './labels-group.component.html',
  styleUrls: ['./labels-group.component.scss']
})
export class LabelsGroupComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  @Input() labelGroup: LabelKey;
  @Input() crmType: CrmTypeEnum;
  @Input() labelSection: LabelGroupName;
  @Input() singleSelection: boolean;
  @Input() header: string;
  private _crmAccountData: CrmAccountEntity;
  @Input() get crmAccountData(): CrmAccountEntity {
    return this._crmAccountData;
  }
  set crmAccountData(value: CrmAccountEntity) {
    if (!value) return;
    this._crmAccountData = value;
    this.setPermissions(value);
    this.setAccountLabels(value);
  }
  private _crmContactData: CrmContactEntity;
  @Input() get crmContactData(): CrmContactEntity {
    return this._crmContactData;
  }
  set crmContactData(value: CrmContactEntity) {
    if (!value) return;
    this._crmContactData = value;
    this.setPermissions(value.crmAccount);
    this.setContactLabels(value);
  }
  private _crmLocationData: CrmLocationEntity;
  @Input() get crmLocationData(): CrmLocationEntity {
    return this._crmLocationData;
  }
  set crmLocationData(value: CrmLocationEntity) {
    if (!value) return;
    this._crmLocationData = value;
    this.setPermissions(value.crmAccount);
    this.setLocationLabels(value);
  }
  public labels: LabelEntity[];

  public labelsCompleteList: LabelEntity[];
  public labelsFilteredList: LabelEntity[];

  public canUpdateLabels: boolean;
  public changeMade = false;

  public searchInput: FormControl;
  public form: FormGroup;

  constructor(
    private labelsService: LabelsService,
    private crmComponentService: CrmComponentService,
    private navigationHelperService: NavigationHelperService
  ) {
    this.createFormControls();
    this.createForm();
  }

  ngOnInit() {
    this.searchInput.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((value: string) => {
      if (this.labelsCompleteList) {
        this.labelsFilteredList = this.labelsCompleteList.filter(
          item =>
            item.name.toLowerCase().includes(value.toLowerCase()) ||
            item.description.toLowerCase().includes(value.toLowerCase())
        );
      }
    });
  }

  public ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.unsubscribe();
  }

  public updateLabels(): void {
    if (this.canUpdateLabels && this.changeMade) {
      const body = {
        [this.labelGroup]: this.singleSelection
          ? this.labelsCompleteList.find(item => item.isSelected)?.id || null
          : this.labelsCompleteList.filter(item => item.isSelected).map(item => item.id)
      };

      if (this.crmType === CrmTypeEnum.ACCOUNT) this.updateCrmAccountLabels(body);
      else if (this.crmType === CrmTypeEnum.CONTACT) this.updateCrmContactLabels(body);
      else if (this.crmType === CrmTypeEnum.LOCATION) this.updateCrmLocationLabels(body);

      this.changeMade = false;
    }
  }
  private updateCrmAccountLabels(payload): void {
    this.crmComponentService
      .updateAccountLabels(this.crmAccountData, payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe(account => {
        this.singleSelection
          ? (this.labels = account.labels[this.labelGroup] ? [account.labels[this.labelGroup]] : [])
          : (this.labels = account.labels[this.labelGroup]);
      });
  }
  private updateCrmContactLabels(payload): void {
    this.crmComponentService
      .updateContactLabels(this.crmContactData, payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe(contact => {
        this.singleSelection
          ? (this.labels = [contact.labels[this.labelGroup]])
          : (this.labels = contact.labels[this.labelGroup]);
      });
  }
  private updateCrmLocationLabels(payload): void {
    this.crmComponentService
      .updateLocationLabels(this.crmLocationData, payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe(location => {
        this.singleSelection
          ? (this.labels = [location.labels[this.labelGroup]])
          : (this.labels = location.labels[this.labelGroup]);
      });
  }
  public toggleLabelSelection(label): void {
    this.changeMade = true;
    if (this.canUpdateLabels) {
      if (this.singleSelection) {
        label.isSelected
          ? (label.isSelected = false)
          : this.labelsCompleteList.map(item => (item.isSelected = label.id === item.id));
      } else label.isSelected = !label.isSelected;
    }
  }
  public navigateToLabelSettings(): void {
    this.navigationHelperService.navigateCompanySettings(CompanySettingsExpandableSection.LabelManagement);
  }

  /*
   * private helpers
   * */

  private createFormControls(): void {
    this.searchInput = new FormControl('');
  }
  private createForm(): void {
    this.form = new FormGroup({
      searchInput: this.searchInput
    });
  }

  private setPermissions(account: CrmAccountEntity): void {
    const currentUser = Environment.getCurrentUser();
    this.canUpdateLabels =
      currentUser.normalizedAccessControlRoles.CRM_ACCOUNT.CRMSection.sectionGroup.updateEntry.value ===
        AccessControlScope.Company ||
      (currentUser.normalizedAccessControlRoles.CRM_ACCOUNT.CRMSection.sectionGroup.updateEntry.value ===
        AccessControlScope.Owner &&
        account &&
        account.salesTeam.some(seller => seller === currentUser.id));
  }

  private setAccountLabels(account: CrmAccountEntity): void {
    if (this.crmType === CrmTypeEnum.ACCOUNT) {
      if (account && account.labels && account.labels[this.labelGroup]) {
        this.singleSelection
          ? (this.labels = [account.labels[this.labelGroup]])
          : (this.labels = account.labels[this.labelGroup]);
      } else this.labels = [];
    }
    this.setCompanyLabels();
  }
  private setContactLabels(contact: CrmContactEntity): void {
    if (this.crmType === CrmTypeEnum.CONTACT)
      this.labels = contact && contact.labels ? contact.labels[this.labelGroup] : [];
    this.setCompanyLabels();
  }
  private setLocationLabels(location: CrmLocationEntity): void {
    if (this.crmType === CrmTypeEnum.LOCATION)
      this.labels = location && location.labels ? location.labels[this.labelGroup] : [];
    this.setCompanyLabels();
  }

  private setCompanyLabels(): void {
    this.labelsService
      .getCompanyLabels()
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        if (this.labels) {
          this.labelsCompleteList = data[this.labelSection];
          this.labelsCompleteList.forEach(item => (item.isSelected = this.labels.some(label => label.id === item.id)));
          this.labelsFilteredList = this.labelsCompleteList;
        }
      });
    this.searchInput.setValue('');
  }
}
