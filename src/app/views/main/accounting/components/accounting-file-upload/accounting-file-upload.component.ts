import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
  AccountingAttachment,
  AccountingAttachmentsService,
  supportedExtensions
} from '@services/app-layer/accounting-attachments/accounting-attachments.service';
import { first } from 'rxjs/operators';
import { NotificationHelperService } from '@services/helpers/notification-helper/notification-helper.service';
import { TypeCheck } from '@services/helpers/utils/type-check';

@Component({
  selector: 'app-accounting-file-upload',
  templateUrl: './accounting-file-upload.component.html',
  styleUrls: ['./accounting-file-upload.component.scss']
})
export class AccountingFileUploadComponent {
  @Input() buttonText = 'choose file';
  @Input() labelText = 'to upload';
  @Input() accept: string;
  @Input() multiple = true;
  @Input() maxFileSize = 2000000;
  @Input() isEditable = true;
  @Input() attachments!: Array<any>;
  @Output() attachmentsChange = new EventEmitter<Array<any>>();
  @Output() removeAttachment = new EventEmitter<AccountingAttachment>();

  constructor(
    private accountingAttachmentsService: AccountingAttachmentsService,
    private notificationHelperService: NotificationHelperService
  ) {}

  private isValidFile = (file: File) =>
    TypeCheck.hasSupportedExtension(file, supportedExtensions) && file.size / 1024 < 2048 && file.name.length <= 100;

  onAddFile(event) {
    const validNewAttachments: File[] = event.value.filter(this.isValidFile);

    if (validNewAttachments.length < event.value.length) {
      const limit = this.maxFileSize / 1000000;
      const fileTypes = supportedExtensions.map(ext => ext.slice(0).toUpperCase()).join(', ');
      const message = `The maximum supported file size is ${limit} MB, the supported file types are ${fileTypes}, and the file name can't exceed 100 characters.`;
      this.notificationHelperService.showValidation(message);
    }

    this.attachments = this.attachments.concat(validNewAttachments);

    this.attachmentsChange.emit(this.attachments);
  }

  onRemove(index) {
    const attachmentToRemove = this.attachments[index];
    if (attachmentToRemove?.key) {
      this.removeAttachment.emit(attachmentToRemove);
    } else {
      this.attachments?.splice(index, 1);
      this.attachmentsChange.emit(this.attachments);
    }
  }

  onDownload(attachment) {
    if (attachment?.key) {
      this.accountingAttachmentsService
        .getFileUrl(attachment.key)
        .pipe(first())
        .subscribe(url => {
          window.open(url, '_blank');
        });
    } else {
      const blob = new Blob([attachment], { type: attachment.type });
      window.open(window.URL.createObjectURL(blob));
    }
  }
}
