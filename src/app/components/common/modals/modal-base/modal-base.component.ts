import { Component, Output, Input, EventEmitter, HostBinding } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-modal-base',
  templateUrl: './modal-base.component.html',
  styleUrls: ['./modal-base.component.scss']
})
export class ModalBaseComponent {
  @Input() header = '';
  @Input() subHeader = '';
  @Output() closed = new EventEmitter();
  @HostBinding('class.modal-base') readonly hostClass = true;

  constructor(private dialogRef: MatDialogRef<any>) {}

  close() {
    this.dialogRef.close();
    this.closed.emit();
  }
}
