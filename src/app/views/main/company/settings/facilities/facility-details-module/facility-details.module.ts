import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FacilityDetailsComponent } from '@views/main/company/settings/facilities/facility-details-module/facility-details/facility-details.component';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { facilityRoutes } from '@views/main/company/settings/facilities/facility-details-module/facility-details.routing';
import { ButtonModule } from '@components/common/buttons/button/button.module';
import { FacilityFormModule } from '@components/common/forms/facility-details/facility-form-module';
import { DialogModalModule } from '@components/common/modals/dialog-modal/dialog-modal.module';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { NullOnEmptyModule } from '@directives/null-on-empty/null-on-empty.module';
import { PipesModule } from '@pipes/pipes.module';

@NgModule({
  imports: [
    ReactiveFormsModule,
    CommonModule,
    RouterModule.forChild(facilityRoutes),
    ButtonModule,
    FacilityFormModule,
    DialogModalModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    NullOnEmptyModule,
    PipesModule
  ],
  declarations: [FacilityDetailsComponent],
  exports: [FacilityDetailsComponent]
})
export class FacilityDetailsModule {}
