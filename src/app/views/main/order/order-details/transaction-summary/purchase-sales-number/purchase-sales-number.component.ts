import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { NotificationHelperService } from '@services/helpers/notification-helper/notification-helper.service';

@Component({
  selector: 'app-purchase-sales-number',
  templateUrl: './purchase-sales-number.component.html',
  styleUrls: ['./purchase-sales-number.component.scss']
})
export class PurchaseSalesNumberComponent {
  @Input() editable = true;
  @Input() label = '';
  @Input() value = '';
  @Input() saveAction: (value: string) => Observable<any>;
  @Output() valueChanged = new EventEmitter();
  public valueControl = new FormControl('', [Validators.maxLength(100)]);
  public mode: 'view' | 'edit' = 'view';

  constructor(private notificationHelperService: NotificationHelperService) {}

  onEditClick() {
    this.valueControl.setValue(this.value);
    this.mode = 'edit';
  }

  onSaveClick() {
    if (this.valueControl.invalid) {
      return this.valueControl.value.length > 100
        ? this.notificationHelperService.showValidation('Number must be less then 100 long.')
        : this.valueControl.markAsDirty();
    }

    this.valueChanged.emit(this.valueControl.value);
    if (this.saveAction) {
      this.saveAction(this.valueControl.value).subscribe(() => {
        this.mode = 'view';
      });
    } else {
      this.mode = 'view';
    }
  }

  onCancelClick() {
    this.mode = 'view';
  }
}
