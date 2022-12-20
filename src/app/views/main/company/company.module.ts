import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { RouterModule } from '@angular/router';
import { AddressFormModule } from '@components/common/forms/address-form/address-form.module';
import { TableActionsModule } from '@components/common/table-actions/table-actions.module';
import { EditDefaultAccountsModalComponent } from '@views/main/company/settings/finance/edit-default-accounts-modal/edit-default-accounts-modal.component';
import { SettingsComponent } from '@views/main/company/settings/settings.component';
import { companyRoutes } from '@views/main/company/company.routing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RateTablesComponent } from '@views/main/company/settings/rate-tables/rate-tables.component';
import { AddRateTableModalComponent } from '@views/main/company/settings/rate-tables/add-rate-table-modal/add-rate-table-modal.component';
import { FacilitiesComponent } from './settings/facilities/facilities.component';
import { AddFacilityModalComponent } from '@views/main/company/settings/facilities/add-facility-modal/add-facility-modal.component';
import { ManageUsersComponent } from '@views/main/company/settings/manage-users/manage-users.component';
import { EditCompanyDataModalComponent } from '@views/main/company/settings/company/edit-company-data-modal/edit-company-data-modal.component';
import { LabelManagementComponent } from './settings/label-management/label-management.component';
import { AddLabelModalComponent } from './settings/label-management/add-label-modal/add-label-modal.component';
import { LabelsTableComponent } from './settings/label-management/labels-table/labels-table.component';
import { CompanyComponent } from './settings/company/company.component';
import { EditAccountingPracticesModalComponent } from './settings/finance/edit-accounting-practices-modal/edit-accounting-practices-modal.component';
import { EditSalesPracticesModalComponent } from './settings/company/edit-sales-practices-modal/edit-sales-practices-modal.component';
import { EditPrivacySettingsModalComponent } from './settings/company/edit-privacy-settings-modal/edit-privacy-settings-modal.component';
import { FinanceComponent } from './settings/finance/finance.component';
import { EditDefaultBillingSettingsModalComponent } from './settings/finance/edit-default-billing-settings-modal/edit-default-billing-settings-modal.component';
import { GroupsComponent } from './settings/groups/groups.component';
import { AddGroupModalComponent } from './settings/groups/add-group-modal/add-group-modal.component';
import { NgxMaskModule } from 'ngx-mask';
import { MatDialogModule } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { NullOnEmptyModule } from '@directives/null-on-empty/null-on-empty.module';
import { ImageUploadModule } from '@directives/image-upload/image-upload.module';
import { MatMenuModule } from '@angular/material/menu';
import { ColorPickerModule } from 'ngx-color-picker';
import { MatTabsModule } from '@angular/material/tabs';
import { PipesModule } from '@pipes/pipes.module';
import { TableBaseModule } from '@components/common/table-base/table-base.module';
import { ButtonModule } from '@components/common/buttons/button/button.module';
import { TooltipInfoIconModule } from '@components/common/tooltip-info-icon/tooltip-info-icon.module';
import { CompanyFormModule } from '@components/common/forms/company-form/company-form.module';
import { DialogModalModule } from '@components/common/modals/dialog-modal/dialog-modal.module';
import { ModalBaseModule } from '@components/common/modals/modal-base/modal-base.module';
import { LetterLogoModule } from '@components/common/letter-logo/letter-logo/letter-logo.module';
import { DxTreeListModule } from 'devextreme-angular';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { TreeSelectorModule } from '@components/common/inputs/tree-selector/tree-selector.module';

@NgModule({
  imports: [
    RouterModule.forChild(companyRoutes),
    NgxMaskModule.forRoot(),
    MatExpansionModule,
    MatIconModule,
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDialogModule,
    MatCheckboxModule,
    FormsModule,
    MatInputModule,
    NullOnEmptyModule,
    ImageUploadModule,
    MatMenuModule,
    ColorPickerModule,
    MatTabsModule,
    PipesModule,
    TableBaseModule,
    ButtonModule,
    TooltipInfoIconModule,
    CompanyFormModule,
    DialogModalModule,
    ModalBaseModule,
    TableActionsModule,
    AddressFormModule,
    MatButtonModule,
    LetterLogoModule,
    DxTreeListModule,
    MatSlideToggleModule,
    TreeSelectorModule
  ],
  declarations: [
    SettingsComponent,
    EditCompanyDataModalComponent,
    ManageUsersComponent,
    RateTablesComponent,
    AddRateTableModalComponent,
    FacilitiesComponent,
    AddFacilityModalComponent,
    LabelManagementComponent,
    AddLabelModalComponent,
    LabelsTableComponent,
    CompanyComponent,
    EditAccountingPracticesModalComponent,
    EditSalesPracticesModalComponent,
    EditPrivacySettingsModalComponent,
    FinanceComponent,
    EditDefaultBillingSettingsModalComponent,
    GroupsComponent,
    AddGroupModalComponent,
    EditDefaultAccountsModalComponent
  ],
  exports: []
})
export class CompanyModule {}
