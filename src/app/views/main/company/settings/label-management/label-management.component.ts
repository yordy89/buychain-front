import { Component, OnDestroy, OnInit } from '@angular/core';
import { takeUntil } from 'rxjs/operators';
import { UserService } from '@app/services/app-layer/user/user.service';
import { Subject } from 'rxjs';
import { AccessControlScope } from '@services/app-layer/permission/permission.interface';
import { User } from '@app/services/app-layer/entities/user';
import { LabelGroups } from '@app/services/app-layer/entities/label';
import { LabelSet, LabelGroupName } from '@app/services/app-layer/app-layer.enums';
import { LabelsService } from '@app/services/app-layer/labels/labels.service';
import { Environment } from '@services/app-layer/app-layer.environment';

@Component({
  selector: 'app-label-management',
  templateUrl: './label-management.component.html',
  styleUrls: ['./label-management.component.scss']
})
export class LabelManagementComponent implements OnInit, OnDestroy {
  public currentUser: User;
  public labelData: LabelGroups;
  public LabelGroupName = LabelGroupName;
  public labelPermissions: any;
  public AccessControlScope = AccessControlScope;
  public LabelSet = LabelSet;

  private destroy$ = new Subject<void>();

  constructor(private userService: UserService, private labelsService: LabelsService) {}

  ngOnInit() {
    this.currentUser = Environment.getCurrentUser();
    this.labelPermissions = this.currentUser.normalizedAccessControlRoles.LABEL.labelSection.sectionGroup;
    if (this.labelPermissions.read.value === AccessControlScope.Company) {
      this.labelsService
        .getCompanyLabels()
        .pipe(takeUntil(this.destroy$))
        .subscribe(data => {
          this.labelData = data;
        });
    }
  }

  public ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.unsubscribe();
  }
}
