import { Component, Inject, OnInit } from '@angular/core';
import { MemberEntity } from '@services/app-layer/entities/member';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

interface ModalData {
  logs: any[];
  members: MemberEntity[];
  name: string;
}

@Component({
  selector: 'app-log-entries-modal',
  templateUrl: './log-entries-modal.component.html'
})
export class LogEntriesModalComponent implements OnInit {
  public header = '';

  constructor(
    private dialogRef: MatDialogRef<LogEntriesModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ModalData
  ) {}

  ngOnInit(): void {
    this.header = `${this.data.name} Log`;
  }

  close(): void {
    this.dialogRef.close();
  }
}
