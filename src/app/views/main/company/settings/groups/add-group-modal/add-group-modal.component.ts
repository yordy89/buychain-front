import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { GroupsService } from '@services/app-layer/groups/groups.service';
import { MemberEntity } from '@services/app-layer/entities/member';
import { CompaniesService } from '@services/app-layer/companies/companies.service';
import { Environment } from '@services/app-layer/app-layer.environment';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { GroupEntity } from '@services/app-layer/entities/group';
import { ImageResourceType } from '@services/app-layer/media/media.service';
import { FormGroupHelper } from '@services/helpers/utils/form-group-helper';
import { ObjectUtil } from '@services/helpers/utils/object-util';
import { NotificationHelperService } from '@services/helpers/notification-helper/notification-helper.service';

@Component({
  selector: 'app-add-group-modal',
  templateUrl: './add-group-modal.component.html',
  styleUrls: ['./add-group-modal.component.scss']
})
export class AddGroupModalComponent implements OnInit {
  public ImageResourceType = ImageResourceType;
  public companyMembers: MemberEntity[];

  public formGroup: FormGroup;
  public name: FormControl;
  public description: FormControl;
  public manager: FormControl;
  public accountingContact: FormControl;
  public parent: FormControl;
  public imageUrl: FormControl;

  constructor(
    private groupsService: GroupsService,
    private companiesService: CompaniesService,
    private notificationHelperService: NotificationHelperService,
    private dialogRef: MatDialogRef<AddGroupModalComponent>,
    @Inject(MAT_DIALOG_DATA) public groupsList: GroupEntity[]
  ) {}

  ngOnInit(): void {
    this.createFormControls();
    this.createForm();

    this.loadCompanyMembers().subscribe(() => {
      this.setFormInitialValues();
    });
  }

  public close(data?: GroupEntity): void {
    this.dialogRef.close(data);
  }

  public createGroup(): void {
    if (this.formGroup.invalid) {
      FormGroupHelper.markTouchedAndDirty(this.formGroup);
      return;
    }
    if (this.name.value?.trim()?.toLowerCase() === 'global') {
      return this.notificationHelperService.showValidation('You are not allowed to create a group with name Global');
    }
    const payload = ObjectUtil.deleteEmptyProperties(FormGroupHelper.getDirtyValues(this.formGroup));
    this.groupsService.createGroup(payload).subscribe(data => this.close(data));
  }

  /*
   * private helpers
   * */

  private loadCompanyMembers(): Observable<any> {
    return this.companiesService.getCompanyCompleteMembers().pipe(map(members => (this.companyMembers = members)));
  }

  private createFormControls(): void {
    this.name = new FormControl('', [Validators.required, Validators.maxLength(30)]);
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

  private setFormInitialValues(): void {
    this.manager.setValue(Environment.getCurrentUser().id || null, { emitEvent: false });
    this.accountingContact.setValue(
      Environment.getCurrentCompany()?.accountingPractices?.defaultBillToContact || null,
      { emitEvent: false }
    );
  }
}
