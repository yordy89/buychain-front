import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { CrmContactEntity } from '@services/app-layer/entities/crm';
import { TokenHelper } from '@services/helpers/utils/token-helper';
import { catchError, takeUntil } from 'rxjs/operators';
import { BehaviorSubject, Subject } from 'rxjs';
import { ImageResourceType, MediaService } from '@services/app-layer/media/media.service';
import { UserService } from '@app/services/app-layer/user/user.service';
import { NotificationHelperService } from '@services/helpers/notification-helper/notification-helper.service';
import { AccessControlScope } from '@services/app-layer/permission/permission.interface';
import { FormGroupHelper } from '@services/helpers/utils/form-group-helper';
import { CompaniesService } from '@services/app-layer/companies/companies.service';
import { Environment } from '@services/app-layer/app-layer.environment';
import { CountriesService } from '@app/services/app-layer/countries/countries.service';
import { ProductsOfInterestService } from '@app/services/app-layer/product-of-interest/product-of-interest.service';
import { AccountState, ProductsOfInterest, ProfileCompletionState } from '@app/services/app-layer/app-layer.enums';
import { User } from '@app/services/app-layer/entities/user';
import { MatDialog } from '@angular/material/dialog';
import { ChangePasswordModalComponent } from './change-password-modal/change-password-modal.component';
import { GroupsService } from '@services/app-layer/groups/groups.service';
import { GroupEntity } from '@services/app-layer/entities/group';
import { AuthService } from '@services/app-layer/auth/auth.service';

export interface ExtendedProductsOfInterest extends ProductsOfInterest {
  isSelected: boolean;
}

const PrivacySettingsTooltipText =
  'Set your profile unlisted.' +
  ' A listed profile is discoverable by other BuyChain users. ' +
  'Users should not have unlisted profiles if they will participate in online sales transactions.' +
  ' Generally sales people will not want this checked, while finance, logistics and back-office users will.';

@Component({
  selector: 'app-profile-form',
  templateUrl: './profile-form.component.html',
  styleUrls: ['./profile-form.component.scss']
})
export class ProfileFormComponent implements OnInit, OnDestroy {
  @Input() parentForm: FormGroup;
  @Input() initialData$: BehaviorSubject<User | CrmContactEntity>;
  @Input() readonlyMode$: BehaviorSubject<boolean>;
  @Input() isCrm = false;

  public initialData: User | any;

  public form: FormGroup;
  public profilePictureUrl: FormControl;
  public firstName: FormControl;
  public lastName: FormControl;
  public workPhone: FormControl;
  public productsOfInterestIds: FormControl;
  public callingCode: FormControl;
  public title: FormControl;
  public username: FormControl;
  public reasonToUse: FormControl;
  public hearAboutUs: FormControl;
  public accountState: FormControl;
  public memberGroup: FormControl;

  public profileCompletion: boolean;

  public ProfileCompletionState = ProfileCompletionState;
  public ImageResourceType = ImageResourceType;
  public accountStateList: AccountState[];
  public groupsList: GroupEntity[];
  public productsOfInterestList: ExtendedProductsOfInterest[];
  public countryCodes: string[] = [];

  private destroy$ = new Subject<void>();
  public readonlyMode = false;
  public currentUser: User;
  public permissions = {
    canUpdateState: false,
    canUpdatePrivacy: false,
    canUpdateRoles: false,
    canUpdateUser: false,
    canUpdateGroup: false
  };
  public isCurrentUserProfile = false;

  public privacySettingsTooltipText = PrivacySettingsTooltipText;

  private countryList = [];

  constructor(
    private productsOfInterestService: ProductsOfInterestService,
    private countriesService: CountriesService,
    private companiesService: CompaniesService,
    private groupsService: GroupsService,
    private mediaService: MediaService,
    private userService: UserService,
    private notificationHelperService: NotificationHelperService,
    private dialog: MatDialog,
    private authService: AuthService
  ) {
    this.countryList = this.countriesService.getCountries();
    this.countryCodes = this.countryList.reduce((acc: string[], unit) => [...acc, ...unit.countryCallingCodes], []);
  }

  ngOnInit() {
    this.handleNoCompanyId();
    this.currentUser = Environment.getCurrentUser();
    this.profileCompletion = this.currentUser.profileCompletionState === ProfileCompletionState.PROFILE;
    this.createFormControls();
    this.createForm();
    this.initialData$.pipe(takeUntil(this.destroy$)).subscribe(value => {
      this.initialData = value || {};
      if (value?.profilePictureUrl && this.profilePictureUrl) this.profilePictureUrl.setValue(value.profilePictureUrl);
    });
    this.setUserPermissions();
    this.loadGroups();

    this.mediaService.isFetching().pipe(takeUntil(this.destroy$)).subscribe();

    if (!this.isCrm) {
      if (this.initialData.productsOfInterestIds) this.normalizeUserProductsOfInterest();
      this.accountStateList = this.userService.getUserAccountStatesList();

      this.setUserProductsOfInterest();

      this.handleAccountStateChange();
      this.handleMemberGroupChange();
    }

    this.setInitialData(this.initialData);
    this.extendParentFormGroup(this.parentForm);

    if (this.readonlyMode$) {
      this.handleReadonlyMode();
    }
    this.setInitialCountryCode();
  }

  private handleReadonlyMode() {
    this.readonlyMode$.pipe(takeUntil(this.destroy$)).subscribe(value => {
      this.readonlyMode = value;
      if (!value) {
        this.setInitialData(this.initialData);
        this.setProductsOfInterestSelection(this.initialData);
        FormGroupHelper.markUntouchedAndPristine(this.form);
      }
      if (this.permissions.canUpdateState) {
        value ? this.accountState.disable({ emitEvent: false }) : this.accountState.enable({ emitEvent: false });
      }

      if (this.permissions.canUpdateGroup) {
        value ? this.memberGroup.disable({ emitEvent: false }) : this.memberGroup.enable({ emitEvent: false });
      }
    });
  }

  public ngOnDestroy(): void {
    this.removeCurrentFormControl();
    this.destroy$.next();
    this.destroy$.unsubscribe();
  }

  public selectProductUserRole(item: ExtendedProductsOfInterest): void {
    if (!item) return;
    item.isSelected = !item.isSelected;
    this.productsOfInterestIds.setValue(this.getSelectedProductsOfInterestIds());
    FormGroupHelper.markControlTouchedAndDirty(this.productsOfInterestIds);
  }

  public updateUserPrivacySettings(event): void {
    this.companiesService
      .updateCompanyMemberPrivacySettings(this.initialData.id, { allowListing: !event.checked })
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }

  public openChangePasswordModal(e) {
    e.preventDefault();

    this.dialog
      .open(ChangePasswordModalComponent, {
        width: '400px',
        disableClose: true,
        data: { userId: this.initialData.id }
      })
      .afterClosed()
      .subscribe();
  }

  /*
   * Private Methods
   */
  private createFormControls(): void {
    const profileRequired = this.profileCompletion ? [Validators.required] : [];
    const crmRequired = !this.isCrm ? [Validators.required] : [];
    this.firstName = new FormControl('', [Validators.required, Validators.maxLength(20)]);
    this.lastName = new FormControl('', [Validators.required, Validators.maxLength(30)]);
    this.username = new FormControl('', [Validators.email, Validators.maxLength(50), ...crmRequired]);
    this.profilePictureUrl = new FormControl('');
    this.workPhone = new FormControl('', [Validators.maxLength(10), Validators.minLength(10), ...profileRequired]);
    this.productsOfInterestIds = new FormControl([], [...profileRequired]);
    this.callingCode = new FormControl('', ...profileRequired);
    this.title = new FormControl('', [Validators.maxLength(30), ...profileRequired]);
    this.accountState = new FormControl({ value: '', disabled: true });
    this.memberGroup = new FormControl({ value: '', disabled: true });

    this.reasonToUse = new FormControl('', [...profileRequired]);
    this.hearAboutUs = new FormControl('', ...profileRequired);
  }

  private setInitialData(initialData: User | any): void {
    if (initialData) {
      this.profilePictureUrl.setValue(
        initialData.profilePictureUrl ? `${initialData.profilePictureUrl}?${new Date().getTime()}` : ''
      );
      this.workPhone.setValue(initialData.workPhone);
      this.firstName.setValue(initialData.firstName);
      this.lastName.setValue(initialData.lastName);
      if (initialData.callingCode) {
        this.callingCode.setValue(initialData.callingCode);
      }
      this.title.setValue(initialData.title);
      this.username.setValue(initialData.username);
      if (!this.isCrm) {
        this.productsOfInterestIds.setValue(initialData.productsOfInterestIds);
        this.username.disable({ emitEvent: false });
      }
      this.accountState.setValue(this.initialData.accountState, { emitEvent: false });
      this.memberGroup.setValue(this.initialData.group, { emitEvent: false });
    }
  }
  private createForm(): void {
    this.form = new FormGroup({
      profilePictureUrl: this.profilePictureUrl,
      firstName: this.firstName,
      lastName: this.lastName,
      workPhone: this.workPhone,
      callingCode: this.callingCode,
      title: this.title,
      username: this.username
    });

    if (!this.isCrm) {
      this.form.addControl('productsOfInterestIds', this.productsOfInterestIds);
    }

    if (this.profileCompletion) {
      this.form.addControl('reasonToUse', this.reasonToUse);
      this.form.addControl('hearAboutUs', this.hearAboutUs);
    }
  }
  private extendParentFormGroup(parentForm: FormGroup): void {
    parentForm.addControl('profile', this.form || new FormGroup({}));
  }
  private removeCurrentFormControl(): void {
    this.parentForm.removeControl('profile');
  }

  private loadGroups(): void {
    this.groupsService
      .getCompanyGroups()
      .pipe(takeUntil(this.destroy$))
      .subscribe(groupsList => {
        this.groupsList = this.filterOutArchivedGroups(groupsList).map(g => {
          g.name = g.name + (g.archived ? '(Archived)' : '');
          return g;
        });
      });
  }

  private filterOutArchivedGroups(groupsList: GroupEntity[]): GroupEntity[] {
    return groupsList.filter(g => !g.archived || g.id === this.initialData.group);
  }

  private handleMemberGroupChange(): void {
    this.memberGroup.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(value => {
      this.companiesService
        .updateCompanyMemberGroup(this.initialData.id, value)
        .pipe(
          catchError(({ error }) => {
            this.notificationHelperService.showValidation(error.message);
            throw error;
          }),
          takeUntil(this.destroy$)
        )
        .subscribe(updatedData => {
          this.initialData.group = updatedData.group;
          this.groupsList = this.filterOutArchivedGroups(this.groupsList);
          this.notificationHelperService.showSuccess('Member group is successfully updated');
        });
    });
  }

  private handleAccountStateChange(): void {
    this.accountState.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(value => {
      this.companiesService
        .updateCompanyMemberAccountState(this.initialData.id, { accountState: value })
        .pipe(
          catchError(({ error }) => {
            this.notificationHelperService.showValidation(error.message);
            throw error;
          }),
          takeUntil(this.destroy$)
        )
        .subscribe(state => {
          this.initialData.accountState = state.accountState;
          this.notificationHelperService.showSuccess('Member account state is successfully updated');
        });
    });
  }

  // TODO review refactor
  private normalizeUserProductsOfInterest(): void {
    this.initialData = {
      ...this.initialData,
      productsOfInterest: this.productsOfInterestService
        .getProductsOfInterestList()
        .filter(role => this.initialData.productsOfInterestIds.find(item => item === role.id))
    };
  }
  private getSelectedProductsOfInterestIds(): string[] {
    return this.productsOfInterestList.reduce((acc: string[], current: ExtendedProductsOfInterest) => {
      if (current.isSelected) acc.push(current.id);
      return acc;
    }, []);
  }
  private setUserProductsOfInterest(): void {
    this.productsOfInterestList = this.productsOfInterestService.getProductsOfInterestList().map(role => ({
      description: role.description,
      id: role.id,
      name: role.name,
      iconUrl: role.iconUrl,
      isSelected: false
    }));
    this.setProductsOfInterestSelection(this.initialData);
  }
  private setProductsOfInterestSelection(initialData: User): void {
    if (!this.productsOfInterestList || !initialData || !initialData.productsOfInterestIds) return;
    this.productsOfInterestList = this.productsOfInterestList.map(product => ({
      ...product,
      isSelected: (product.isSelected = initialData.productsOfInterestIds.some(id => id === product.id))
    }));
  }

  private handleNoCompanyId(): void {
    if (!TokenHelper.getTokenData?.user?.companyId) {
      this.notificationHelperService.showValidation('Please log in again to continue.');
      this.authService.signOut(false);
    }
  }

  private setInitialCountryCode(): void {
    this.companiesService
      .getUserCompany()
      .pipe(takeUntil(this.destroy$))
      .subscribe(company => {
        if (!this.callingCode.value) {
          const companyCountry = this.countryList.find(country => country.name === company.country);
          if (companyCountry) {
            this.callingCode.setValue(companyCountry.countryCallingCodes[0], { emitEvent: false });
          }
        }
      });
  }

  private setUserPermissions(): void {
    this.isCurrentUserProfile = this.currentUser.id === this.initialData.id;

    const userPermissions = this.currentUser.normalizedAccessControlRoles.COMPANY.userSection.sectionGroup;

    this.permissions.canUpdateState =
      userPermissions.updateState.value === AccessControlScope.Company && !this.isCrm && !this.isCurrentUserProfile;
    this.permissions.canUpdatePrivacy = userPermissions.updatePrivacySettings.value === AccessControlScope.Company;
    this.permissions.canUpdateRoles =
      userPermissions.updateRole.value === AccessControlScope.Company && !this.isCrm && !this.isCurrentUserProfile;

    this.permissions.canUpdateUser = this.isCurrentUserProfile;
    this.permissions.canUpdateGroup = userPermissions.updateGroup.value === AccessControlScope.Company && !this.isCrm;
  }
}
