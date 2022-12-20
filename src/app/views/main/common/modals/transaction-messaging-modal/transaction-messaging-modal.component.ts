import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { first } from 'rxjs/operators';
import { NotificationHelperService } from '@services/helpers/notification-helper/notification-helper.service';
import { TransactionsService } from '@services/app-layer/transactions/transactions.service';
import { MessageType } from '@services/app-layer/app-layer.enums';
import { Subject } from 'rxjs';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { JournalItemEntity, TransactionEntity } from '@services/app-layer/entities/transaction';
import { Environment } from '@services/app-layer/app-layer.environment';
import { AccessControlScope } from '@services/app-layer/permission/permission.interface';

@Component({
  selector: 'app-transaction-messaging-modal',
  templateUrl: './transaction-messaging-modal.component.html',
  styleUrls: ['./transaction-messaging-modal.component.scss']
})
export class TransactionMessagingModalComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  public messageForm: FormGroup;
  public newMessage: FormControl;
  public currentUser: any;
  public MessageType = MessageType;

  public canAddMessage = false;

  public messages: JournalItemEntity[];

  constructor(
    @Inject(MAT_DIALOG_DATA) public transaction: TransactionEntity,
    private dialogRef: MatDialogRef<TransactionMessagingModalComponent>,
    private notificationHelperService: NotificationHelperService,
    private transactionsService: TransactionsService
  ) {}

  ngOnInit() {
    this.setCurrentUser();
    this.setUserPermissions();
    this.createFormControls();
    this.createForm();
    this.setTransactionalJournal();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.unsubscribe();
  }

  public close(): void {
    this.dialogRef.close();
  }

  public submitComment(): void {
    if (this.newMessage.value === '') {
      return this.notificationHelperService.showValidation('Please write something in comment box before submitting');
    }
    if (this.newMessage.invalid && this.newMessage.value.length > 1000) {
      return this.notificationHelperService.showValidation('Message must be less then 1000 characters long');
    }
    this.transactionsService
      .addTransactionalJournal(this.transaction.id, this.messageForm.value)
      .pipe(first())
      .subscribe(messageItem => {
        this.messages.push(new JournalItemEntity().init({ ...messageItem, user: this.currentUser }));
        this.transaction.transactionJournal.push(
          new JournalItemEntity().init({ ...messageItem, user: this.currentUser })
        );
        this.newMessage.setValue('', { emitEvent: false });
      });
  }
  /*
   * private helpers
   * */

  private createFormControls(): void {
    this.newMessage = new FormControl('', [Validators.maxLength(1000)]);
    if (!this.canAddMessage) this.newMessage.disable({ emitEvent: false });
  }

  private createForm(): void {
    this.messageForm = new FormGroup({
      message: this.newMessage
    });
  }

  private setCurrentUser(): void {
    const user = Environment.getCurrentUser();
    this.currentUser = {
      firstName: user.firstName,
      lastName: user.lastName,
      id: user.id,
      profilePictureUrl: user.profilePictureUrl
    };
  }

  private setTransactionalJournal(): void {
    this.transactionsService
      .getTransactionalJournal(this.transaction.id)
      .pipe(first())
      .subscribe(journal => {
        this.transaction.transactionJournal = journal;
        this.messages = this.transaction.transactionJournal.filter(item => item.type === MessageType.messaging);
        if (!this.transaction.transactionalJournalAllRead.some(id => id === this.currentUser.id)) {
          this.transaction.transactionalJournalAllRead.push(this.currentUser.id);
        }
      });
  }

  private setUserPermissions(): void {
    const currentUser = Environment.getCurrentUser();
    const transactionPermissions = currentUser.normalizedAccessControlRoles.TRANSACTION.transactionSection.sectionGroup;

    this.canAddMessage =
      transactionPermissions.updateJournal.value === AccessControlScope.Company ||
      (transactionPermissions.updateJournal.value === AccessControlScope.Owner && this.transaction.isResourceOwner);
  }
}
