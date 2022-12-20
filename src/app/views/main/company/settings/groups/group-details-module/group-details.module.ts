import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { PipesModule } from '@pipes/pipes.module';
import { GroupDetailsComponent } from '@views/main/company/settings/groups/group-details-module/group-details/group-details.component';
import { MatExpansionModule } from '@angular/material/expansion';
import { ImageUploadModule } from '@directives/image-upload/image-upload.module';
import { ReactiveFormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { AccountingInfoComponent } from '@views/main/company/settings/groups/group-details-module/group-details/accounting-info/accounting-info.component';
import { RouterModule } from '@angular/router';
import { groupRoutes } from '@views/main/company/settings/groups/group-details-module/group-details.routing';
import { NullOnEmptyModule } from '@directives/null-on-empty/null-on-empty.module';
import { NgxMaskModule } from 'ngx-mask';
import { ButtonModule } from '@components/common/buttons/button/button.module';
import { SelectWithSearchModule } from '@components/common/inputs/select-with-search/select-with-search.module';
import { DialogModalModule } from '@components/common/modals/dialog-modal/dialog-modal.module';
import { TreeSelectorModule } from '@components/common/inputs/tree-selector/tree-selector.module';

@NgModule({
  imports: [
    CommonModule,
    MatIconModule,
    MatInputModule,
    MatExpansionModule,
    ImageUploadModule,
    ReactiveFormsModule,
    MatSelectModule,
    RouterModule.forChild(groupRoutes),
    NullOnEmptyModule,
    NgxMaskModule,
    ButtonModule,
    SelectWithSearchModule,
    DialogModalModule,
    PipesModule,
    MatButtonModule,
    TreeSelectorModule
  ],
  declarations: [GroupDetailsComponent, AccountingInfoComponent],
  exports: [GroupDetailsComponent]
})
export class GroupDetailsModule {}
