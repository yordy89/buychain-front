import { Component, OnDestroy, OnInit } from '@angular/core';
import { UserService } from '@services/app-layer/user/user.service';
import { takeUntil } from 'rxjs/operators';
import { BehaviorSubject, Subject } from 'rxjs';
import { FormGroup } from '@angular/forms';
import { FormGroupHelper } from '@services/helpers/utils/form-group-helper';
import { NotificationHelperService } from '@services/helpers/notification-helper/notification-helper.service';
import { ObjectUtil } from '@services/helpers/utils/object-util';
import { User } from '@services/app-layer/entities/user';

@Component({
  selector: 'app-details',
  templateUrl: './details.component.html',
  styleUrls: ['./details.component.scss']
})
export class DetailsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  public initialData$: BehaviorSubject<User> = new BehaviorSubject<User>(null);
  public user: User;
  public form: FormGroup;
  public readonlyMode$: BehaviorSubject<boolean> = new BehaviorSubject(true);

  constructor(private userService: UserService, private notificationHelperService: NotificationHelperService) {}

  ngOnInit() {
    this.createFormGroup();

    this.userService
      .getUser()
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.user = user;
        this.initialData$.next(this.user);
      });
  }

  public edit(): void {
    this.setReadOnlyStatus(false);
  }
  public cancel(): void {
    this.setReadOnlyStatus(true);
  }

  public updateUserProfile(): void {
    if (this.form.invalid) return FormGroupHelper.markTouchedAndDirty(this.form);

    const payload = FormGroupHelper.getDirtyValues(this.form.controls.profile);
    if (ObjectUtil.isEmptyObject(payload)) return this.setReadOnlyStatus(true);
    Object.keys(payload).forEach(key => (payload[key] = payload[key] || null));
    this.userService
      .updateUserPartial(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.user = { ...this.user, ...user };
        this.initialData$.next(this.user);
        this.setReadOnlyStatus(true);
        this.notificationHelperService.showSuccess('Profile data was successfully updated');
      });
  }

  public ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.unsubscribe();
  }

  /*
   * private helpers
   * */

  public setReadOnlyStatus(value: boolean): void {
    this.readonlyMode$.next(value);
  }

  private createFormGroup(): void {
    this.form = new FormGroup({});
  }
}
