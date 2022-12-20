import { NgModule } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { AddressFormModule } from '@components/common/forms/address-form/address-form.module';
import { SelectWithSearchModule } from '@components/common/inputs/select-with-search/select-with-search.module';
import { ModalBaseModule } from '@components/common/modals/modal-base/modal-base.module';
import { TableActionsModule } from '@components/common/table-actions/table-actions.module';
import { TableBaseModule } from '@components/common/table-base/table-base.module';
import { AutocompleteModule } from '@directives/autocomplete/autocomplete.module';

import { FacilityFormComponent } from './facility-form.component';
import { CommonModule } from '@angular/common';
import { ImageUploadModule } from '@directives/image-upload/image-upload.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DxMapModule } from 'devextreme-angular';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { NullOnEmptyModule } from '@directives/null-on-empty/null-on-empty.module';
import { MatTabsModule } from '@angular/material/tabs';
import { ShipToComponent } from '@components/common/forms/facility-details/ship-to/ship-to.component';
import { ShipFromComponent } from '@components/common/forms/facility-details/ship-from/ship-from.component';
import { ButtonModule } from '@components/common/buttons/button/button.module';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { PipesModule } from '@pipes/pipes.module';
import { DisableControlModule } from '@directives/disable-control/disable-control.module';
import { FacilityPersonnelComponent } from '@components/common/forms/facility-details/facility-personnel/facility-personnel.component';
import { AddTransportMethodModalComponent } from '@components/common/forms/facility-details/add-transport-method-modal/add-transport-method-modal.component';
import { AddPersonnelModalComponent } from '@components/common/forms/facility-details/add-personnel-modal/add-personnel-modal.component';
import { MatDialogModule } from '@angular/material/dialog';

@NgModule({
  imports: [
    CommonModule,
    ImageUploadModule,
    ReactiveFormsModule,
    DxMapModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    NullOnEmptyModule,
    MatTabsModule,
    ButtonModule,
    MatCheckboxModule,
    FormsModule,
    PipesModule,
    DisableControlModule,
    TableBaseModule,
    MatIconModule,
    MatDialogModule,
    ModalBaseModule,
    TableActionsModule,
    SelectWithSearchModule,
    AddressFormModule,
    AutocompleteModule
  ],
  exports: [FacilityFormComponent, ShipToComponent, ShipFromComponent],
  declarations: [
    FacilityFormComponent,
    ShipToComponent,
    ShipFromComponent,
    FacilityPersonnelComponent,
    AddTransportMethodModalComponent,
    AddPersonnelModalComponent
  ]
})
export class FacilityFormModule {}
