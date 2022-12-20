import { NgModule } from '@angular/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ShowOnEnvsDirectiveModule } from '@directives/show/show-on-dev.directive';
import { EditMemberComponent } from '@views/main/company/settings/manage-users/edit-member-module/edit-member/edit-member.component';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { MatExpansionModule } from '@angular/material/expansion';
import { RouterModule } from '@angular/router';
import { memberRoutes } from '@views/main/company/settings/manage-users/edit-member-module/edit-member.routing';
import { ButtonModule } from '@components/common/buttons/button/button.module';
import { AccessControlComponent } from '@views/main/company/settings/manage-users/edit-member-module/edit-member/access-control/access-control.component';
import { MatTabsModule } from '@angular/material/tabs';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatRadioModule } from '@angular/material/radio';
import { PipesModule } from '@pipes/pipes.module';
import { AccessControlSectionComponent } from '@views/main/company/settings/manage-users/edit-member-module/edit-member/access-control/access-control-section/access-control-section.component';
import { ProfileFormModule } from '@components/common/forms/profile-form/profile-form.module';

@NgModule({
  imports: [
    MatIconModule,
    CommonModule,
    MatExpansionModule,
    RouterModule.forChild(memberRoutes),
    ButtonModule,
    MatTabsModule,
    ReactiveFormsModule,
    MatRadioModule,
    PipesModule,
    FormsModule,
    ProfileFormModule,
    MatCheckboxModule,
    ShowOnEnvsDirectiveModule
  ],
  declarations: [EditMemberComponent, AccessControlComponent, AccessControlSectionComponent],
  exports: [EditMemberComponent]
})
export class EditMemberModule {}
