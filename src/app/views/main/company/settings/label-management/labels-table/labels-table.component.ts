import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { TableAction } from '@app/models';
import { Environment } from '@services/app-layer/app-layer.environment';
import { ObjectUtil } from '@services/helpers/utils/object-util';
import { AddLabelModalComponent } from '@views/main/company/settings/label-management/add-label-modal/add-label-modal.component';
import { UserService } from '@app/services/app-layer/user/user.service';
import { Subject } from 'rxjs';
import { first, mergeMap, takeUntil } from 'rxjs/operators';
import { AccessControlScope } from '@services/app-layer/permission/permission.interface';
import { LabelEntity } from '@app/services/app-layer/entities/label';
import { LabelGroupName, LabelSet } from '@app/services/app-layer/app-layer.enums';
import { LabelsService } from '@app/services/app-layer/labels/labels.service';

enum Actions {
  EDIT,
  DELETE
}

@Component({
  selector: 'app-labels-table',
  templateUrl: './labels-table.component.html',
  styleUrls: ['./labels-table.component.scss']
})
export class LabelsTableComponent implements OnInit, OnDestroy {
  @Input() labelsHeader: string;
  @Input() labelsData: LabelEntity[];
  @Input() labelGroup: LabelGroupName;
  @Input() labelSet: LabelSet;
  permissions = { canCreate: false };
  actions: TableAction[] = [];

  private destroy$ = new Subject<void>();

  constructor(private userService: UserService, private dialog: MatDialog, private labelsService: LabelsService) {}

  ngOnInit() {
    this.initPermissions();
    this.initTableActions();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  public removeLabel(label: LabelEntity): void {
    this.labelsService
      .deleteLabel(label.id)
      .pipe(
        mergeMap(() => this.labelsService.getCompanyLabels().pipe(first())),
        takeUntil(this.destroy$)
      )
      .subscribe(labelGroups => {
        const clonedLabelGroups = ObjectUtil.getDeepCopy(labelGroups);
        const newLabelGroups = {
          ...clonedLabelGroups,
          [this.labelGroup]: clonedLabelGroups[this.labelGroup].filter(item => item.id !== label.id)
        };
        this.labelsService.setCompanyLabels(newLabelGroups);
      });
  }

  public editLabel(label: LabelEntity): void {
    this.dialog.open(AddLabelModalComponent, {
      width: '648px',
      disableClose: true,
      data: { label: label, group: this.labelGroup }
    });
  }

  public addLabel(): void {
    this.dialog.open(AddLabelModalComponent, {
      width: '648px',
      disableClose: true,
      data: { group: this.labelGroup, labelSet: this.labelSet }
    });
  }

  onTableAction(value: Actions, item: LabelEntity) {
    switch (value) {
      case Actions.EDIT:
        this.editLabel(item);
        break;

      case Actions.DELETE:
        this.removeLabel(item);
        break;
    }
  }

  private initTableActions() {
    this.actions = [
      {
        label: 'Edit',
        icon: 'edit',
        value: Actions.EDIT
      },
      {
        label: 'Delete',
        icon: 'delete',
        color: 'warn',
        value: Actions.DELETE,
        prompt: {
          title: 'Confirm please!',
          text: 'Are you sure you want to delete the Label?'
        }
      }
    ];
  }

  private initPermissions() {
    const user = Environment.getCurrentUser();
    const labelPermissions = user.normalizedAccessControlRoles.LABEL.labelSection.sectionGroup;
    this.permissions.canCreate = labelPermissions.create.value === AccessControlScope.Company;
  }
}
