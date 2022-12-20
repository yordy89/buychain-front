import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

export enum DialogType {
  Alert = 'alert',
  Confirm = 'confirm'
}

@Component({
  selector: 'app-confirm-signup-modal',
  templateUrl: './dialog-modal.component.html'
})
export class DialogModalComponent implements OnInit {
  public DialogType = DialogType;
  public type: DialogType;
  public title: string;
  public content: string;

  constructor(private dialogRef: MatDialogRef<DialogModalComponent>, @Inject(MAT_DIALOG_DATA) public data: any) {}

  ngOnInit() {
    this.loadDefaults(this.data);
  }

  public done(): void {
    this.dialogRef.close();
  }
  public reject(): void {
    this.dialogRef.close(false);
  }
  public confirm(): void {
    this.dialogRef.close(true);
  }

  /**
   * Private Helpers
   */
  private loadDefaults(data) {
    this.type = data.type || DialogType.Alert;
    this.content = data.content || 'The action is complete!';
    this.title = this.getTitle(data.title);
  }

  private getTitle(title) {
    if (title) {
      return title;
    }

    if (this.type === DialogType.Confirm) {
      return 'Confirm please!';
    }

    return 'Congratulations!';
  }
}
