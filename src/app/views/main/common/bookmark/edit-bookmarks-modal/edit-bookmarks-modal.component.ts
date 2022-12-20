import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NotificationHelperService } from '@services/helpers/notification-helper/notification-helper.service';
import { BookmarkService } from '@services/app-layer/bookmark/bookmark.service';
import { FormControl, Validators } from '@angular/forms';
import { TypeCheck } from '@services/helpers/utils/type-check';

@Component({
  selector: 'app-edit-bookmarks-modal',
  templateUrl: './edit-bookmarks-modal.component.html',
  styleUrls: ['./edit-bookmarks-modal.component.scss']
})
export class EditBookmarksModalComponent {
  public nameFormControl = new FormControl('', [Validators.required, Validators.maxLength(30)]);

  public get isNameExist() {
    return this.data.savedBookmarks?.some(x => x.name === this.nameFormControl.value);
  }

  constructor(
    private notificationHelperService: NotificationHelperService,
    private bookmarkService: BookmarkService,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      currentState: any;
      savedBookmarks: any;
      viewKey: any;
      saveDisabled: boolean;
      activeKey: any;
    },
    private dialogRef: MatDialogRef<EditBookmarksModalComponent>
  ) {}

  public onSave(event?: Event) {
    if (event) event.preventDefault();
    if (!this.isNameExist && this.data.savedBookmarks.length === 15) {
      return this.notificationHelperService.showValidation(
        'You cannot have more then 15 bookmarks. Please override or delete other bookmarks'
      );
    }
    const name = this.nameFormControl.value;
    this.bookmarkService.save(name, this.data.viewKey, this.data.currentState).then(() => {
      this.loadBookmarks();
    });
  }

  public onDeleteClick(bookmark) {
    this.bookmarkService.delete(bookmark.name, this.data.viewKey).then(() => {
      this.loadBookmarks();
    });
  }

  public loadBookmarks() {
    this.data.savedBookmarks = this.bookmarkService
      .get(this.data.viewKey)
      .filter(b => TypeCheck.isObject(b) && b.key !== this.bookmarkService.bookmarkLastStateKey(this.data.viewKey));
    this.data.activeKey = this.bookmarkService.getActiveKey(this.data.viewKey);
  }

  public activateBookmark(bookmark): void {
    this.close(bookmark);
  }

  public close(bookmark?: any): void {
    this.dialogRef.close(bookmark);
  }
}
