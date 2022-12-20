import { NgModule } from '@angular/core';
import { AutocompleteModule } from '@directives/autocomplete/autocomplete.module';
import { ProfileFormComponent } from './profile-form.component';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ImageUploadModule } from '@directives/image-upload/image-upload.module';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { NullOnEmptyModule } from '@directives/null-on-empty/null-on-empty.module';
import { NgxMaskModule } from 'ngx-mask';
import { MatSelectModule } from '@angular/material/select';
import { PipesModule } from '@pipes/pipes.module';
import { ButtonModule } from '@components/common/buttons/button/button.module';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ChangePasswordModalComponent } from '@components/common/forms/profile-form/change-password-modal/change-password-modal.component';
import { ModalBaseModule } from '@components/common/modals/modal-base/modal-base.module';
import { TreeSelectorModule } from '@components/common/inputs/tree-selector/tree-selector.module';

@NgModule({
  imports: [
    ReactiveFormsModule,
    CommonModule,
    ImageUploadModule,
    MatFormFieldModule,
    MatInputModule,
    NullOnEmptyModule,
    NgxMaskModule.forRoot(),
    MatSelectModule,
    PipesModule,
    ButtonModule,
    MatCheckboxModule,
    MatTooltipModule,
    ModalBaseModule,
    AutocompleteModule,
    TreeSelectorModule
  ],
  exports: [ProfileFormComponent],
  declarations: [ProfileFormComponent, ChangePasswordModalComponent],
  providers: []
})
export class ProfileFormModule {}
