import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-export-modal',
  templateUrl: './export-modal.component.html'
})
export class ExportModalComponent {
  public entityTypes = ['Accounts', 'Locations', 'Contacts'];
  public selectedType: string;

  constructor(private dialogRef: MatDialogRef<ExportModalComponent>) {}

  onExport() {
    this.dialogRef.close(this.selectedType);
  }

  onClose() {
    this.dialogRef.close();
  }
}
