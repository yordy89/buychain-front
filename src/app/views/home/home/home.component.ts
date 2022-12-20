import { Component, OnDestroy, OnInit } from '@angular/core';
import { UserService } from '@app/services/app-layer/user/user.service';
import { BehaviorSubject, Subject } from 'rxjs';
import { FormGroup } from '@angular/forms';
import { NavigationHelperService } from '@services/helpers/navigation-helper/navigation-helper.service';
import { NotificationHelperService } from '@services/helpers/notification-helper/notification-helper.service';
import { TemporaryCompanyService } from '@app/services/app-layer/temporary-company/temporary-company.service';
import { takeUntil } from 'rxjs/operators';
import { FormGroupHelper } from '@services/helpers/utils/form-group-helper';
import { CompaniesService } from '@services/app-layer/companies/companies.service';
import { CompaniesSummary, TemporaryCompany } from '@app/services/data-layer/http-api/base-api/swagger-gen';
import { Environment } from '@services/app-layer/app-layer.environment';
import { User } from '@app/services/app-layer/entities/user';
import { ProfileCompletionState } from '@app/services/app-layer/app-layer.enums';

enum CompanyCreationState {
  INITIAL = 'INITIAL',
  COMPANY_CREATION = 'COMPANY_CREATION',
  COMPANY_JOIN = 'COMPANY_JOIN'
}

const confirmMsg = `
  You will receive a confirmation email within 24 hours to confirm your account has been set up and let you know it is live.
  Please contact newaccount@buychain.co if you have not received a confirmation email within 48 hours.
  Welcome to BuyChain!`;

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {
  public companyJoin = `\n`;
  public CJPendingMsg = `Thank you for joining the Company.\n${confirmMsg}`;
  public CCPendingMsg = `Thank you for creating a Company.\n${confirmMsg}`;
  private destroy$ = new Subject<void>();
  public user: User;
  public initialData$: BehaviorSubject<User> = new BehaviorSubject<User>(null);
  public profileCompletionState: ProfileCompletionState;
  public companyCreationState = CompanyCreationState.INITIAL;
  public tempCompany: TemporaryCompany;
  public form: FormGroup;
  public CompanyCreationState = CompanyCreationState;
  public ProfileCompletionState = ProfileCompletionState;
  public companiesSummaryList: CompaniesSummary;

  constructor(
    private userService: UserService,
    private companiesService: CompaniesService,
    private navigationHelperService: NavigationHelperService,
    private notificationHelperService: NotificationHelperService,
    private temporaryCompanyService: TemporaryCompanyService
  ) {}

  ngOnInit() {
    this.createForm();
    this.user = Environment.getCurrentUser();
    if (this.user.profileCompletionState === ProfileCompletionState.COMPLETE)
      this.navigationHelperService.navigateUserHome();
    this.initialData$.next(this.user);
    this.profileCompletionState = this.user.profileCompletionState;
    if (this.user.temporaryCompanyId && !this.tempCompany) {
      this.temporaryCompanyService
        .getUserTempCompany(this.user.temporaryCompanyId)
        .pipe(takeUntil(this.destroy$))
        .subscribe(tempUserCompany => (this.tempCompany = tempUserCompany));
    }
  }

  public ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.unsubscribe();
  }

  public nextState(state?: CompanyCreationState): void {
    this.companyCreationState = state;
    if (state === CompanyCreationState.COMPANY_JOIN) {
      this.companiesService
        .getCompanyNames()
        .pipe(takeUntil(this.destroy$))
        .subscribe((companyNames: CompaniesSummary) => {
          if (!companyNames.length) {
            this.notificationHelperService.showValidation('Warning!, There is no company to join.');
            this.backToInitialState();
          }
          this.companiesSummaryList = companyNames;
        });
    }
  }

  public create(): void {
    if (this.form.invalid) return FormGroupHelper.markTouchedAndDirty(this.form);

    this.temporaryCompanyService.createCompany(this.form.value.company).subscribe(company => {
      this.tempCompany = company;
      this.profileCompletionState = ProfileCompletionState.PENDING_COMPANY;
    });
  }

  public join(): void {
    if (this.form.invalid) return FormGroupHelper.markTouchedAndDirty(this.form);

    const targetCompany = this.companiesSummaryList.find(
      item => item.id === this.form.value.selectedData.selectedCompany
    );
    this.companiesService.addCompanyPendingMember(targetCompany.id).subscribe(() => {
      this.companyJoin = this.companyJoin.replace('the company', targetCompany.name);
      this.profileCompletionState = ProfileCompletionState.MEMBER;
    });
  }

  public backToInitialState(): void {
    this.companyCreationState = CompanyCreationState.INITIAL;
  }

  public saveProfile(): void {
    if (this.form.invalid) return FormGroupHelper.markTouchedAndDirty(this.form);
    this.userService
      .createUserProfile(this.getCreateUserPayload())
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.userService.fetchCurrentUser().pipe(takeUntil(this.destroy$)).subscribe();
        this.navigationHelperService.navigateUserHome();
      });
  }

  /*
   * Private Methods
   */
  private createForm(): void {
    this.form = new FormGroup({});
  }

  private getCreateUserPayload(): any {
    const payload = this.form.value.profile;
    delete payload.hearAboutUs; // redundant fields not accepted by back, might be used later
    delete payload.reasonToUse; // redundant fields not accepted by back, might be used later
    return payload;
  }
}
