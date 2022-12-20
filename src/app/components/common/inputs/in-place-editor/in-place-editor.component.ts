import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { Observable } from 'rxjs';
import { FormControl, Validators } from '@angular/forms';

@Component({
  selector: 'app-in-place-editor',
  templateUrl: './in-place-editor.component.html',
  styleUrls: ['./in-place-editor.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InPlaceEditorComponent {
  @Input() editable = true;
  @Input() label = '';
  @Input() value: string | Date;
  @Input() saveAction: (value: string | Date) => Observable<any>;
  @Input() editorType: 'text' | 'date' = 'text';
  @Input() minValue: any;
  @Input() maxLength: number;
  @Input() required = false;
  @Output() valueChanged = new EventEmitter();
  public valueControl = new FormControl<Date | string>('');
  public mode: 'view' | 'edit' = 'view';

  onEditClick() {
    this.valueControl.setValue(this.value);
    if (this.maxLength) this.valueControl.setValidators([Validators.maxLength(this.maxLength)]);
    this.mode = 'edit';
  }

  onSaveClick() {
    if (this.valueControl.invalid) return;

    this.valueChanged.emit(this.valueControl.value);
    if (this.saveAction) {
      const sanitized =
        typeof this.valueControl.value === 'string' ? this.valueControl.value.trim() : this.valueControl.value;
      this.saveAction(sanitized).subscribe(() => {
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
