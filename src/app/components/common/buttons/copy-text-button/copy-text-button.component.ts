import { Clipboard } from '@angular/cdk/clipboard';
import { ChangeDetectionStrategy, Component, HostBinding, Input, OnInit } from '@angular/core';
import { NotificationHelperService } from '@services/helpers/notification-helper/notification-helper.service';
import { TransformHelper } from '@services/helpers/utils/transform-helper';
import { TypeCheck } from '@services/helpers/utils/type-check';

@Component({
  selector: 'app-copy-text-button',
  styleUrls: ['./copy-text-button.component.scss'],
  templateUrl: 'copy-text-button.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CopyTextButtonComponent implements OnInit {
  @Input() set text(value: string | number) {
    this._text = value?.toString() || '';
  }
  get text(): string {
    return this._text;
  }
  @Input() hexText: string;
  @Input() valueToCopy: string;
  @Input() successMessage = 'Copied to clipboard';
  @HostBinding('class.copy-text-button') private readonly show = true;
  label: string | number;
  isFullText = false;
  private _text = '';

  constructor(private clipboard: Clipboard, private notificationService: NotificationHelperService) {}

  ngOnInit() {
    this.isFullText = !!this.hexText;

    if (this.hexText) {
      this.label = TransformHelper.getShortHexGuid(this.hexText);
    } else {
      this.label = this.text;
    }
  }

  onCopyToClipboard(event) {
    event.stopPropagation();

    if (!this.valueToCopy || !TypeCheck.isString(this.valueToCopy)) {
      return;
    }

    this.clipboard.copy(this.valueToCopy);
    this.notificationService.showSuccess(this.successMessage);
  }
}
