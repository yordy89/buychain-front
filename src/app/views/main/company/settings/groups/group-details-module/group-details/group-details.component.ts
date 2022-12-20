import { Component, OnDestroy, OnInit } from '@angular/core';
import { GroupEntity } from '@services/app-layer/entities/group';
import { combineLatest, EMPTY, Observable, Subject } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { NotificationHelperService } from '@services/helpers/notification-helper/notification-helper.service';
import {
  CompanySettingsExpandableSection,
  NavigationHelperService
} from '@services/helpers/navigation-helper/navigation-helper.service';
import { FormGroupHelper } from '@services/helpers/utils/form-group-helper';
import { ObjectUtil } from '@services/helpers/utils/object-util';
import { AccessControlScope } from '@services/app-layer/permission/permission.interface';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { GroupsService } from '@services/app-layer/groups/groups.service';
import { catchError, first, map, takeUntil } from 'rxjs/operators';
import { DialogModalComponent, DialogType } from '@components/common/modals/dialog-modal/dialog-modal.component';
import { MatDialog } from '@angular/material/dialog';
import { ImageResourceType } from '@services/app-layer/media/media.service';
import { MemberEntity } from '@services/app-layer/entities/member';
import { Environment } from '@services/app-layer/app-layer.environment';
import { CompaniesService } from '@services/app-layer/companies/companies.service';

@Component({
  selector: 'app-group-details',
  templateUrl: './group-details.component.html',
  styleUrls: ['./group-details.component.scss']
})
export class GroupDetailsComponent implements OnInit, OnDestroy {
  public loaded = false;
  public ImageResourceType = ImageResourceType;
  public isEditMode = false;

  public companyMembers: MemberEntity[];
  public groupsList: GroupEntity[];

  public parentGroup: GroupEntity;
  public accountingContactDetails: MemberEntity;
  public managerDetails: MemberEntity;

  public userPermissions = {
    canUpdate: false,
    canDelete: false
  };

  public formGroup: FormGroup;
  public name: FormControl;
  public description: FormControl;
  public manager: FormControl;
  public accountingContact: FormControl;
  public parent: FormControl;
  public imageUrl: FormControl;
  public groupDetails: GroupEntity;

  public accountingDisabled = true;

  private destroy$ = new Subject<void>();

  constructor(
    private groupsService: GroupsService,
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private companiesService: CompaniesService,
    private notificationHelperService: NotificationHelperService,
    private navigationHelperService: NavigationHelperService
  ) {}

  ngOnInit(): void {
    this.accountingDisabled = !Environment.getCurrentCompany().features.accounting;
    this.setPermissions();
    this.createFormControls();
    this.createForm();
    this.loadInitialData();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  public edit(): void {
    this.isEditMode = true;
  }
  public cancel(): void {
    this.isEditMode = false;
    this.setInitialData();
    FormGroupHelper.markUntouchedAndPristine(this.formGroup);
  }

  public updateGroup(): void {
    if (this.formGroup.invalid) return FormGroupHelper.markTouchedAndDirty(this.formGroup);

    const changes = FormGroupHelper.getChangedValues(this.formGroup.value, this.groupDetails);
    if (!this.groupDetails.parent && !changes.parent) delete changes.parent;
    if (changes.description !== this.groupDetails.description) changes.description = this.description.value || null;

    if (ObjectUtil.isEmptyObject(changes)) {
      this.isEditMode = false;
      return;
    }
    this.groupsService
      .updateGroup(this.groupDetails, changes)
      .pipe(
        catchError(error => {
          if (error.status === 409) {
            this.notificationHelperService.showValidation(
              'The parent You selected is not appropriate for this group. It creates a loop of parents.'
            );
          }
          throw error;
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(resp => {
        this.groupDetails = resp;
        this.setGroupExtendedProperties();
        FormGroupHelper.markUntouchedAndPristine(this.formGroup);
        this.notificationHelperService.showSuccess('Group data was successfully updated');
        this.isEditMode = false;
      });
  }

  public deleteGroup(): void {
    this.dialog
      .open(DialogModalComponent, {
        width: '450px',
        disableClose: true,
        data: {
          type: DialogType.Confirm,
          content: 'Are you sure you want to archive the group?'
        }
      })
      .afterClosed()
      .subscribe((isConfirmed: boolean) => {
        if (isConfirmed) {
          this.groupsService
            .deleteGroup(this.groupDetails.id)
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => {
              this.notificationHelperService.showSuccess('Group successfully archived');
              this.backToCompanySettings();
            });
        }
      });
  }

  public backToCompanySettings(): void {
    this.navigationHelperService.navigateCompanySettings(CompanySettingsExpandableSection.Groups);
  }

  public getParentTreeGroups(): GroupEntity[] {
    if (!this.groupDetails?.parentTree?.length || !this.groupsList) return [];
    return this.groupDetails.parentTree.map(id => this.groupsList.find(item => item.id === id));
  }

  public setAccountingInfo(accountingInfo): void {
    this.groupDetails = new GroupEntity().init({ ...this.groupDetails, accountingInfo });
  }

  /*
   * private helpers
   * */

  private loadInitialData(): void {
    combineLatest([this.loadGroupData(), this.loadGroupsList(), this.loadCompanyMembers()])
      .pipe(
        takeUntil(this.destroy$),
        catchError(err => {
          if (err.status === 404) this.notificationHelperService.showValidation('The group was not found.');
          this.backToCompanySettings();
          throw EMPTY;
        })
      )
      .subscribe(([groupData, groupsList, companyMembers]) => {
        this.groupDetails = groupData;
        if (!this.groupDetails) return this.backToCompanySettings();
        this.groupsList = groupsList.filter(
          group => group.id !== this.groupDetails.id && !group.parentTree.some(id => id === this.groupDetails.id)
        );
        this.companyMembers = companyMembers;
        this.setGroupExtendedProperties();
        this.setInitialData();
        this.loaded = true;
      });
  }

  private loadGroupData(): Observable<GroupEntity> {
    const groupId = this.route.snapshot.params.groupId;
    return this.groupsService.getGroupById(groupId).pipe(first());
  }
  private loadGroupsList(): Observable<GroupEntity[]> {
    return this.groupsService.getCompanyGroups().pipe(map(groupsList => groupsList.filter(item => !item.archived)));
  }
  private loadCompanyMembers(): Observable<MemberEntity[]> {
    return this.companiesService.getCompanyCompleteMembers().pipe(first());
  }

  public setPermissions(): void {
    const currentUser = Environment.getCurrentUser();
    const groupPermissions = currentUser.normalizedAccessControlRoles.GROUP.groupSection.sectionGroup;
    this.userPermissions.canUpdate = groupPermissions.update.value === AccessControlScope.Company;
    this.userPermissions.canDelete = groupPermissions.delete.value === AccessControlScope.Company;
  }

  private createFormControls(): void {
    this.name = new FormControl({ value: '', disabled: true }, [Validators.required, Validators.maxLength(30)]);
    this.description = new FormControl('', [Validators.maxLength(100)]);
    this.parent = new FormControl('');
    this.manager = new FormControl('');
    this.accountingContact = new FormControl('');
    this.imageUrl = new FormControl('');
  }

  private createForm(): void {
    this.formGroup = new FormGroup({
      name: this.name,
      description: this.description,
      manager: this.manager,
      accountingContact: this.accountingContact,
      parent: this.parent,
      imageUrl: this.imageUrl
    });
  }

  private setInitialData(): void {
    this.name.setValue(this.groupDetails.name);
    this.description.setValue(this.groupDetails.description);
    this.parent.setValue(this.groupDetails.parent || null);
    this.manager.setValue(this.groupDetails.manager);
    this.accountingContact.setValue(this.groupDetails.accountingContact);
    this.imageUrl.setValue(this.groupDetails.imageUrl);
  }

  private setGroupExtendedProperties(): void {
    this.parentGroup = this.groupsList.find(g => g.id === this.groupDetails.parent);
    this.accountingContactDetails = this.companyMembers.find(m => m.id === this.groupDetails.accountingContact);
    this.managerDetails = this.companyMembers.find(m => m.id === this.groupDetails.manager);
  }
}
