import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, Injector } from '@angular/core';
import { BaseApiService } from '@app/services/data-layer/http-api/base-api/base-api.service';
import { AuthService } from '@services/app-layer/auth/auth.service';
import { PermissionHelper } from '@services/app-layer/permission/permission-helper';
import { EMPTY, Observable, of, throwError } from 'rxjs';
import { Environment } from '@services/app-layer/app-layer.environment';
import { NotificationHelperService } from '@services/helpers/notification-helper/notification-helper.service';
import { TypeCheck } from '@services/helpers/utils/type-check';
import {
  CompaniesSummary,
  CompanyAccountingPractices,
  CompanyAccountingPracticesDefaultAccounts,
  CompanyDetails,
  CompanyMemberAccountState,
  CompanyPendingMembers,
  CompanyPrivacySettings,
  CompanySalesPractices,
  UserPermissions
} from '@app/services/data-layer/http-api/base-api/swagger-gen';
import { catchError, first, map, mergeMap, tap } from 'rxjs/operators';
import { ObjectUtil } from '@services/helpers/utils/object-util';
import { MemberEntity, MemberSummaryEntity } from '@services/app-layer/entities/member';
import { User } from '../entities/user';
import { CompanyUpdatePayload } from '@app/services/data-layer/http-api/base-api/swagger-gen/model/companyUpdatePayload';
import { ProfileCompletionState } from '@services/app-layer/app-layer.enums';

@Injectable({
  providedIn: 'root'
})
export class CompaniesService {
  constructor(
    private baseApi: BaseApiService,
    private notificationHelperService: NotificationHelperService,
    private injector: Injector
  ) {}

  public getCompanyNames(): Observable<CompaniesSummary> {
    return this.fetchCompanyNamesByOffset(0);
  }

  private fetchCompanyNamesByOffset(offset: number): Observable<CompaniesSummary> {
    return this.baseApi.companies.getCompaniesSummary(1000, offset).pipe(
      first(),
      mergeMap(async (data: any[]) => {
        if (data.length === 1000) {
          const chunk = await this.fetchCompanyNamesByOffset(offset + 1000).toPromise();
          data = data.concat(chunk);
        }
        return data;
      })
    );
  }

  updateCompanyMemberPermissions(id: string, memberId: string, payload: UserPermissions) {
    return this.baseApi.companies.updateCompanyMemberPermissions(id, memberId, payload);
  }

  public getUserCompany(): Observable<CompanyDetails> {
    const currentUser = Environment.getCurrentUser();
    if (!currentUser.companyId && currentUser.profileCompletionState !== ProfileCompletionState.INITIAL) {
      this.notificationHelperService.showValidation(
        'No Company for specified User, Please, contact user administrator'
      );
      return of({});
    }

    return this.baseApi.companies.getCompany(currentUser.companyId).pipe(
      first(),
      tap(company => Environment.setCurrentCompany(company)),
      catchError((error: HttpErrorResponse) => {
        if (error.status === 404) {
          this.notificationHelperService.showValidation(
            'Company for specified user was not found or it has been archived. Please, contact user administrator'
          );
          this.injector.get(AuthService).signOut();
          return EMPTY;
        }

        return throwError(() => error);
      })
    );
  }

  public updateUserCompany(companyId: string, formData: any): Observable<CompanyDetails> {
    return this.baseApi.companies.updateCompany(companyId, this.normalizeCompanyToApi(formData)).pipe();
  }

  public updateCompanyAccountingPractices(
    companyId: string,
    payload: CompanyAccountingPractices
  ): Observable<CompanyAccountingPractices> {
    return this.baseApi.companies.updateCompanyAccountingPractices(companyId, payload).pipe();
  }

  public updateCompanyAccountingPracticesDefaultAccounts(
    companyId: string,
    payload: CompanyAccountingPracticesDefaultAccounts
  ): Observable<CompanyAccountingPracticesDefaultAccounts> {
    return this.baseApi.companies.updateCompanyAccountingPracticesDefaultAccounts(companyId, payload);
  }

  public updateCompanyPrivacySettings(
    companyId: string,
    payload: CompanyPrivacySettings
  ): Observable<CompanyPrivacySettings> {
    return this.baseApi.companies.updateCompanyPrivacySettings(companyId, payload).pipe();
  }

  public updateCompanySalesPractices(
    companyId: string,
    payload: CompanySalesPractices
  ): Observable<CompanySalesPractices> {
    return this.baseApi.companies.updateCompanySalesPractices(companyId, payload).pipe();
  }

  public getCompanyPendingMembers(): Observable<CompanyPendingMembers> {
    return this.fetchCompanyPendingMembersByOffset(0);
  }

  private fetchCompanyPendingMembersByOffset(offset: number): Observable<CompanyPendingMembers> {
    const companyId = Environment.getCurrentUser().companyId;
    return this.baseApi.companies.getCompanyPendingMembers(companyId, 1000, offset).pipe(
      first(),
      mergeMap(async (data: any[]) => {
        if (data.length === 1000) {
          const chunk = await this.fetchCompanyPendingMembersByOffset(offset + 1000).toPromise();
          data = data.concat(chunk);
        }
        return data;
      })
    );
  }

  public addCompanyPendingMember(companyId: string): Observable<any> {
    const url = Environment.linkToApplicationUi() + 'company/settings';
    return this.baseApi.companies.addCompanyPendingMember(companyId, { applicationUrl: url }).pipe();
  }

  public approveCompanyPendingMember(companyId: string, pendingMemberId: string): Observable<any> {
    const payload = { applicationUrl: Environment.linkToApplicationUi() };
    return this.baseApi.companies.companyPendingMemberApproval(companyId, pendingMemberId, payload).pipe();
  }

  public disapproveCompanyPendingMember(companyId: string, pendingMemberId: string): Observable<any> {
    return this.baseApi.companies.addCompanyPendingMemberDisapproval(companyId, pendingMemberId);
  }

  public getCompanyMembers(): Observable<MemberEntity[]> {
    return this.fetchCompanyMembersByOffset(0);
  }

  private fetchCompanyMembersByOffset(offset: number): Observable<MemberEntity[]> {
    const companyId = Environment.getCurrentUser().companyId;
    return this.baseApi.companies.getCompanyMembers(companyId, 1000, offset).pipe(
      first(),
      mergeMap(async (data: any[]) => {
        if (data.length === 1000) {
          const chunk = await this.fetchCompanyMembersByOffset(offset + 1000).toPromise();
          data = data.concat(chunk);
        }
        return data.map(member => new MemberEntity(member));
      })
    );
  }

  public getCompanyCompleteMembers(): Observable<MemberEntity[]> {
    return this.getCompanyMembers().pipe(
      map(members => members.filter(m => m.firstName).sort((a, b) => a.name.localeCompare(b.name)))
    );
  }

  public getCompanyMembersSummary(companyId): Observable<MemberSummaryEntity[]> {
    return this.fetchCompanyMembersSummaryByOffset(companyId, 0);
  }

  private fetchCompanyMembersSummaryByOffset(companyId: string, offset: number): Observable<MemberSummaryEntity[]> {
    return this.baseApi.companies.getCompanyMembersSummary(companyId, 1000, offset).pipe(
      first(),
      mergeMap(async (data: any[]) => {
        if (data.length === 1000) {
          const chunk = await this.fetchCompanyMembersSummaryByOffset(companyId, offset + 1000).toPromise();
          data = data.concat(chunk);
        }
        return data.map(member => new MemberSummaryEntity(member));
      })
    );
  }

  public getCompanyMemberById(companyId: string, memberId: string): Observable<User> {
    return this.baseApi.companies
      .getCompanyMember(companyId, memberId)
      .pipe(map(data => this.normalizeMemberData(data)));
  }

  public updateCompanyMemberInformation(member: User, body): Observable<User> {
    const currentUser = Environment.getCurrentUser();
    return this.baseApi.companies
      .updateCompanyMember(currentUser.companyId, member.id, ObjectUtil.deleteEmptyProperties(body))
      .pipe(
        first(),
        map(updated => Object.assign(member, updated))
      );
  }

  public updateCompanyMemberAccountState(memberId: string, body): Observable<CompanyMemberAccountState> {
    const currentUser = Environment.getCurrentUser();
    return this.baseApi.companies.updateCompanyMemberAccountState(currentUser.companyId, memberId, body).pipe();
  }

  public updateCompanyMemberPrivacySettings(memberId: string, body: { allowListing: boolean }): Observable<any> {
    const currentUser = Environment.getCurrentUser();
    return this.baseApi.companies.updateCompanyMemberPrivacySettings(currentUser.companyId, memberId, body).pipe();
  }

  public updateCompanyMemberGroup(memberId: string, groupId: string): Observable<any> {
    const currentCompanyId = Environment.getCurrentCompany()?.id;
    return this.baseApi.companies.updateCompanyMemberGroup(currentCompanyId, memberId, { group: groupId });
  }

  public updateCompanyMemberPassword(memberId: string, password: string): Observable<any> {
    const currentCompanyId = Environment.getCurrentCompany()?.id;
    const payload = { password, applicationUrl: Environment.linkToApplicationUi() };
    return this.baseApi.companies.updateCompanyMemberPassword(currentCompanyId, memberId, payload);
  }

  /*
   * private helpers
   * */

  private normalizeMemberData(user): User {
    return {
      ...user,
      accessControlProfile: PermissionHelper.getUserAccessControlProfile(user.accessControlRoles),
      normalizedAccessControlRoles: PermissionHelper.normalizeAccessControlsFromApi(user.accessControlRoles)
    };
  }

  private normalizeCompanyToApi(data: any): CompanyUpdatePayload {
    return {
      website: data.website,
      streetAddress: data.streetAddress,
      city: TypeCheck.isObject(data.city) ? data.city.name : data.city,
      state: TypeCheck.isObject(data.state) ? data.state.name : data.state,
      country: TypeCheck.isObject(data.country) ? data.country.name : data.country,
      zipCode: data.zipCode,
      logoUrl: data.logoUrl
    };
  }
}
