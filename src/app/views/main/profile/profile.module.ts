import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { buyerRoutes } from '@views/main/profile/profile.routing';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AutocompleteModule } from '@directives/autocomplete/autocomplete.module';
import { ImageUploadModule } from '@directives/image-upload/image-upload.module';
import { DetailsComponent } from '@views/main/profile/details/details.component';
import { ButtonModule } from '@components/common/buttons/button/button.module';
import { LookAndFeelComponent } from '@views/main/profile/details/look-and-feel/look-and-feel.component';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { ColorSwatchesModule } from 'ngx-color/swatches';
import { ProfileFormModule } from '@components/common/forms/profile-form/profile-form.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(buyerRoutes),
    MatAutocompleteModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatTabsModule,
    MatCheckboxModule,
    MatExpansionModule,
    MatTooltipModule,
    MatButtonModule,
    AutocompleteModule,
    MatSnackBarModule,
    MatDialogModule,
    ImageUploadModule,
    MatMenuModule,
    ButtonModule,
    MatSlideToggleModule,
    ColorSwatchesModule,
    ProfileFormModule
  ],
  declarations: [DetailsComponent, LookAndFeelComponent]
})
export class ProfileModule {}
