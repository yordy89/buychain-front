import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { takeUntil } from 'rxjs/operators';
import { BehaviorSubject, Subject } from 'rxjs';
import { FormGroupHelper } from '@services/helpers/utils/form-group-helper';
import { ActivatedRoute } from '@angular/router';
import { NotificationHelperService } from '@services/helpers/notification-helper/notification-helper.service';
import { AccessControlScope } from '@services/app-layer/permission/permission.interface';
import {
  CompanySettingsExpandableSection,
  NavigationHelperService
} from '@services/helpers/navigation-helper/navigation-helper.service';
import { ObjectUtil } from '@services/helpers/utils/object-util';
import { Environment } from '@services/app-layer/app-layer.environment';
import { CompaniesService } from '@services/app-layer/companies/companies.service';
import { User } from '@services/app-layer/entities/user';
import { ProfileCompletionState } from '@services/app-layer/app-layer.enums';

@Component({
  selector: 'app-edit-member',
  templateUrl: './edit-member.component.html',
  styleUrls: ['./edit-member.component.scss']
})
export class EditMemberComponent implements OnInit, OnDestroy {
  public companyId: string;
  public memberId: string;
  public memberData: User;
  public initialData$: BehaviorSubject<User> = new BehaviorSubject<User>(null);
  public initialData: User | any;
  public form: FormGroup;
  public readonlyMode$: BehaviorSubject<boolean> = new BehaviorSubject(true);
  public currentUser: User;
  public canUpdateUser: boolean;
  public ProfileCompletionState = ProfileCompletionState;
  public isCurrentUserProfile = false;
  public canUpdateRoles = false;
  isDisabledViewCostCheckbox = true;

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private companiesService: CompaniesService,
    private notificationHelperService: NotificationHelperService,
    private navigationHelperService: NavigationHelperService
  ) {}

  ngOnInit() {
    this.currentUser = Environment.getCurrentUser();
    this.companyId = this.currentUser.companyId;
    this.createFormGroup();
    this.memberId = this.route.snapshot.params.memberId;

    this.initialData$.pipe(takeUntil(this.destroy$)).subscribe(value => {
      this.initialData = value || {};
      this.setPermissions();
    });

    this.loadCompanyMember();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.unsubscribe();
  }

  edit(): void {
    this.setReadOnlyStatus(false);
  }
  cancel(): void {
    this.setReadOnlyStatus(true);
  }

  updateUserProfile(): void {
    if (this.form.invalid) return FormGroupHelper.markTouchedAndDirty(this.form);

    if (ObjectUtil.isEmptyObject(FormGroupHelper.getDirtyValues(this.form.controls.profile)))
      return this.setReadOnlyStatus(true);
    this.companiesService
      .updateCompanyMemberInformation(this.memberData, FormGroupHelper.getDirtyValues(this.form.controls.profile))
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.memberData = user;
        this.initialData$.next(this.memberData);
        this.setReadOnlyStatus(true);
        this.notificationHelperService.showSuccess('Profile data was successfully updated');
      });
  }

  backToCompanySettings(): void {
    this.navigationHelperService.navigateCompanySettings(CompanySettingsExpandableSection.UserManagement);
  }

  onToggleViewCost(checked) {
    this.companiesService
      .updateCompanyMemberPermissions(this.companyId, this.memberId, { priceData: checked })
      .pipe(takeUntil(this.destroy$))
      .subscribe(permissions => {
        this.memberData = Object.assign({}, this.memberData, { permissions });
        this.initialData$.next(this.memberData);
      });
  }

  /*
   * private helpers
   * */

  private loadCompanyMember(): void {
    this.companiesService
      .getCompanyMemberById(this.companyId, this.memberId)
      .pipe(takeUntil(this.destroy$))
      .subscribe(member => {
        this.memberData = member;
        this.initialData$.next(this.memberData);
      });
  }

  private setPermissions(): void {
    this.isCurrentUserProfile = this.currentUser.id === this.initialData.id;

    const userPermissions = this.currentUser.normalizedAccessControlRoles.COMPANY.userSection.sectionGroup;

    this.canUpdateUser = userPermissions.updateUser.value !== AccessControlScope.None;
    this.canUpdateRoles = userPermissions.updateRole.value === AccessControlScope.Company && !this.isCurrentUserProfile;

    this.isDisabledViewCostCheckbox =
      this.isCurrentUserProfile || userPermissions.updateUser.value !== AccessControlScope.Company;
  }

  private setReadOnlyStatus(value: boolean): void {
    this.readonlyMode$.next(value);
  }

  private createFormGroup(): void {
    this.form = new FormGroup({});
  }
}
