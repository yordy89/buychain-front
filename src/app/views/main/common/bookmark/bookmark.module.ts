import { NgModule } from '@angular/core';

import { BookmarkComponent } from './bookmark.component';
import { EditBookmarksModalComponent } from '@views/main/common/bookmark/edit-bookmarks-modal/edit-bookmarks-modal.component';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatInputModule } from '@angular/material/input';
import { ButtonModule } from '@components/common/buttons/button/button.module';
import { IconButtonModule } from '@components/common/buttons/icon-button/icon-button.module';
import { ModalBaseModule } from '@components/common/modals/modal-base/modal-base.module';
import { PipesModule } from '@pipes/pipes.module';

@NgModule({
  imports: [
    MatMenuModule,
    MatIconModule,
    CommonModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    MatTooltipModule,
    FormsModule,
    MatInputModule,
    ButtonModule,
    IconButtonModule,
    ModalBaseModule,
    PipesModule
  ],
  exports: [BookmarkComponent],
  declarations: [BookmarkComponent, EditBookmarksModalComponent]
})
export class BookmarkModule {}
