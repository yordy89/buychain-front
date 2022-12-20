import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {
  InventoryManagementSystemEnum,
  FiscalYearStartEnum,
  RevenueRecognitionMethodEnum,
  AutoInvoiceGenerationEnum,
  TooltipTextEnum
} from '@app/services/app-layer/app-layer.enums';
import { AccountsService } from '@services/app-layer/accounts/accounts.service';
import { AccountEntity } from '@services/app-layer/entities/account';
import { EditDefaultAccountsModalComponent } from '@views/main/company/settings/finance/edit-default-accounts-modal/edit-default-accounts-modal.component';
import { FinanceService } from '@views/main/company/settings/finance/finance.service';
import { Subject } from 'rxjs';
import { map, first, takeUntil } from 'rxjs/operators';
import { Environment } from '@app/services/app-layer/app-layer.environment';
import { AccessControlScope } from '@app/services/app-layer/permission/permission.interface';
import { EditAccountingPracticesModalComponent } from './edit-accounting-practices-modal/edit-accounting-practices-modal.component';
import { CompaniesService } from '@app/services/app-layer/companies/companies.service';
import {
  CompanyAccountingPracticesDefaultAccounts,
  CompanyDetails
} from '@app/services/data-layer/http-api/base-api/swagger-gen';
import { EditDefaultBillingSettingsModalComponent } from './edit-default-billing-settings-modal/edit-default-billing-settings-modal.component';
import { MemberEntity } from '@app/services/app-layer/entities/member';
import { FacilityEntity } from '@app/services/app-layer/entities/facility';
import { FacilitiesService } from '@app/services/app-layer/facilities/facilities.service';

@Component({
  selector: 'app-finance',
  templateUrl: './finance.component.html',
  styleUrls: ['./finance.component.scss']
})
export class FinanceComponent implements OnInit, OnDestroy {
  public company: CompanyDetails;
  public inventoryMgmtSystem: string;
  public fiscalYearStart: string;
  public revenueRecognitionMethod: string;
  public autoInvoiceGeneration: string;
  public defaultAccountsState: CompanyAccountingPracticesDefaultAccounts;
  public canUpdateAccountingPractices = false;
  public canReadAccounts = false;
  public defaultBillToContact: MemberEntity;
  public defaultBillToLocation: FacilityEntity;

  readonly tooltipTextEnum = TooltipTextEnum;

  public features = Environment.getCompanyFeatures();

  accounts: AccountEntity[] = [];
  accountsKeyTypeList: { key: string; type: string; tooltip: string; account?: AccountEntity }[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    private companiesService: CompaniesService,
    private facilitiesService: FacilitiesService,
    private dialog: MatDialog,
    private financeService: FinanceService,
    private accountsService: AccountsService
  ) {}

  ngOnInit() {
    this.initUserPermission();
    this.initUserCompany().subscribe(() => {
      if (this.canReadAccounts) {
        this.accountsKeyTypeList = this.financeService.accountsKeyTypeList;
        this.loadAccountsState();
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  public editAccountingPractices(): void {
    this.dialog
      .open(EditAccountingPracticesModalComponent, {
        width: '648px',
        disableClose: true,
        data: this.company
      })
      .afterClosed()
      .subscribe(company => {
        if (company) this.setCompany(company);
      });
  }

  public editBillingSettings() {
    this.dialog
      .open(EditDefaultBillingSettingsModalComponent, {
        width: '450px',
        disableClose: true,
        data: this.company
      })
      .afterClosed()
      .subscribe(company => {
        if (company) this.setCompany(company);
      });
  }

  private mapAccountsKeyTypeList(accounts: AccountEntity[]) {
    this.accountsKeyTypeList = this.accountsKeyTypeList.map(accountKeyType => {
      const defaultAccountId = this.defaultAccountsState[accountKeyType.key];
      const account = accounts.find(item => item.id === defaultAccountId);
      return {
        ...accountKeyType,
        account: account || accountKeyType.account
      };
    });
  }

  editDefaultAccounts() {
    this.dialog
      .open(EditDefaultAccountsModalComponent, {
        width: '648px',
        disableClose: true,
        data: {
          company: this.company,
          accounts: this.accounts
        }
      })
      .afterClosed()
      .subscribe(defaultAccounts => {
        if (defaultAccounts) {
          this.defaultAccountsState = defaultAccounts;
          this.mapAccountsKeyTypeList(this.accounts);
          this.company.accountingPractices.defaultAccounts = defaultAccounts;
        }
      });
  }

  private loadAccountsState() {
    this.accountsService
      .getAccounts(1000, 0)
      .pipe(takeUntil(this.destroy$))
      .subscribe(accounts => {
        this.mapAccountsKeyTypeList(accounts);
        this.accounts = accounts.filter(item => !item.system && !item.archived);
      });
  }

  private initUserPermission() {
    const accessControlRole =
      Environment.getCurrentUser().normalizedAccessControlRoles.COMPANY.companySection.sectionGroup;
    const accountPermissions =
      Environment.getCurrentUser().normalizedAccessControlRoles?.ACCOUNT?.accountSection?.sectionGroup;
    this.canUpdateAccountingPractices =
      accessControlRole.updateAccountingPractices.value === AccessControlScope.Company;
    this.canReadAccounts =
      Environment.getCompanyFeatures().accounting && accountPermissions?.read.value === AccessControlScope.Company;
  }

  private initUserCompany() {
    return this.companiesService.getUserCompany().pipe(
      first(),
      map((company: CompanyDetails) => this.setCompany(company))
    );
  }

  private setCompany(company: CompanyDetails): void {
    this.company = company;
    const accountingPractices = this.company.accountingPractices;
    accountingPractices.defaultBillToContact ? this.loadDefaultBillToContact() : (this.defaultBillToContact = null);
    accountingPractices.defaultBillToLocation ? this.loadDefaultBillToLocation() : (this.defaultBillToLocation = null);

    this.inventoryMgmtSystem = InventoryManagementSystemEnum[accountingPractices.inventoryMgmtSystem];
    this.fiscalYearStart = FiscalYearStartEnum[accountingPractices.fiscalYearStart];
    this.revenueRecognitionMethod = RevenueRecognitionMethodEnum[accountingPractices.revenueRecognitionMethod];
    this.autoInvoiceGeneration = AutoInvoiceGenerationEnum[accountingPractices.autoInvoicingMethod];
    this.defaultAccountsState = accountingPractices.defaultAccounts;
  }

  private loadDefaultBillToContact() {
    if (this.defaultBillToContact?.id === this.company.accountingPractices.defaultBillToContact) return;
    this.companiesService.getCompanyCompleteMembers().subscribe(members => {
      this.defaultBillToContact = members.find(x => x.id === this.company.accountingPractices.defaultBillToContact);
    });
  }

  private loadDefaultBillToLocation() {
    if (this.defaultBillToLocation?.id === this.company.accountingPractices.defaultBillToLocation) return;
    this.facilitiesService
      .getCompanyFacility(this.company.id, this.company.accountingPractices.defaultBillToLocation)
      .subscribe(facility => {
        this.defaultBillToLocation = facility;
      });
  }

  displayAccountValue(account: AccountEntity, displayKey: string) {
    if (account) {
      return account.archived ? 'n/a' : account[displayKey];
    }
    return null;
  }
}
