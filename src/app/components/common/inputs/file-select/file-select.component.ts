import { Component, Output, Input, EventEmitter } from '@angular/core';
import { NotificationHelperService } from '@services/helpers/notification-helper/notification-helper.service';
import { TypeCheck } from '@services/helpers/utils/type-check';

@Component({
  selector: 'app-file-select',
  templateUrl: './file-select.component.html',
  styleUrls: ['./file-select.component.scss']
})
export class FileSelectComponent {
  @Input() buttonText = 'Select File';
  @Input() hintText = '';
  @Input() icon: string;
  @Input() accept: string;
  @Output() changed = new EventEmitter<File>();

  public selectedFile: File = null;

  constructor(private notificationService: NotificationHelperService) {}

  public onFileSelected(eventArgs) {
    const files = eventArgs.target.files;
    const file = files.length ? files[0] : null;

    const supportedExtensions =
      this.accept.split(',').map(item => {
        let val = item.trim();

        if (val.startsWith('.')) {
          val = val.slice(1);
        }

        return val;
      }) || [];

    if (supportedExtensions?.length && !TypeCheck.hasSupportedExtension(file, supportedExtensions)) {
      eventArgs.target.value = '';
      const fileTypes = supportedExtensions.map(ext => ext.toUpperCase()).join(', ');
      const message = `Please make sure the file type is ${fileTypes}.`;
      return this.notificationService.showValidation(message);
    }

    this.selectedFile = file;

    this.changed.emit(this.selectedFile);

    // reset input value to trigger change event even after same file selected again
    eventArgs.target.value = '';
  }

  public onFileRemove() {
    this.selectedFile = null;
    this.changed.emit(null);
  }
}
