import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { HomeComponent } from './home/home.component';
import { RouterModule } from '@angular/router';
import { homeRoutes } from '@views/home/home.routing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ImageUploadModule } from '@directives/image-upload/image-upload.module';
import { AutocompleteModule } from '@directives/autocomplete/autocomplete.module';
import { ButtonModule } from '@components/common/buttons/button/button.module';
import { CompanyFormModule } from '@components/common/forms/company-form/company-form.module';
import { CompanyJoinFormComponent } from '@views/home/home/company-join-form/company-join-form.component';
import { ProfileFormModule } from '@components/common/forms/profile-form/profile-form.module';

@NgModule({
  imports: [
    CommonModule,
    MatFormFieldModule,
    RouterModule.forChild(homeRoutes),
    FormsModule,
    ReactiveFormsModule,
    ImageUploadModule,
    MatExpansionModule,
    AutocompleteModule,
    ButtonModule,
    CompanyFormModule,
    ProfileFormModule
  ],
  declarations: [HomeComponent, CompanyJoinFormComponent]
})
export class HomeModule {}
