import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { FormGroupHelper } from '@services/helpers/utils/form-group-helper';
import { first } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { ObjectUtil } from '@services/helpers/utils/object-util';
import { HexColorValidator } from '@validators/hexColor.validator/hexColor.validator';
import { NotificationHelperService } from '@services/helpers/notification-helper/notification-helper.service';
import { LabelsService } from '@app/services/app-layer/labels/labels.service';
import { LabelEntity } from '@app/services/app-layer/entities/label';
import { LabelGroupName, LabelSet } from '@app/services/app-layer/app-layer.enums';

const colorsList = [
  '#32a46e',
  '#86caf6',
  '#3e6158',
  '#3f7a89',
  '#96c582',
  '#b7d5c4',
  '#bcd6e7',
  '#7c90c1',
  '#9d8594',
  '#dad0d8',
  '#4b4fce',
  '#4e0a77',
  '#a367b5',
  '#ee3e6d',
  '#d63d62',
  '#c6a670',
  '#f46600',
  '#cf0500',
  '#efabbd',
  '#8e0622',
  '#f0b89a',
  '#f0ca68',
  '#62382f',
  '#c97545',
  '#c1800b'
];

@Component({
  selector: 'app-add-label-modal',
  templateUrl: './add-label-modal.component.html',
  styleUrls: ['./add-label-modal.component.scss']
})
export class AddLabelModalComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  public form: FormGroup;
  public name: FormControl;
  public description: FormControl;
  public color: FormControl;

  public labelColor: string;

  public defaultColorsList = colorsList;
  constructor(
    private labelsService: LabelsService,
    private notificationHelperService: NotificationHelperService,
    private dialogRef: MatDialogRef<AddLabelModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { label: LabelEntity; group: LabelGroupName; labelSet: LabelSet }
  ) {}

  ngOnInit() {
    this.createFormControls();
    this.createForm();
    if (this.data.label) this.setInitialData(this.data.label);
  }
  public ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.unsubscribe();
  }

  public close(): void {
    this.dialogRef.close();
  }

  public addUpdateLabel(): void {
    if (this.data.label) {
      // update
      if (ObjectUtil.isEmptyObject(FormGroupHelper.getDirtyValues(this.form))) return this.close();
      if (this.form.invalid) return FormGroupHelper.markTouchedAndDirty(this.form);
      this.labelsService
        .updateLabel(this.data.label.id, FormGroupHelper.getDirtyValues(this.form))
        .pipe(first())
        .subscribe(data => {
          this.data.label = data;
          this.labelsService
            .getCompanyLabels()
            .pipe(first())
            .subscribe(labelGroups => {
              const index = labelGroups[this.data.group].findIndex(item => item.id === this.data.label.id);
              labelGroups[this.data.group][index] = this.data.label;
              this.labelsService.setCompanyLabels(labelGroups);
              this.close();
            });
        });
    } else {
      // add
      if (this.form.invalid || !this.color.value) {
        if (!this.color.value) this.notificationHelperService.showValidation('Please choose a color');
        return FormGroupHelper.markTouchedAndDirty(this.form);
      }
      this.labelsService
        .addLabel({ ...this.form.getRawValue(), labelSet: this.data.labelSet })
        .pipe(first())
        .subscribe(data => {
          this.data.label = data;
          this.labelsService
            .getCompanyLabels()
            .pipe(first())
            .subscribe(labelGroups => {
              labelGroups[this.data.group].push(data);
              this.labelsService.setCompanyLabels(labelGroups);
              this.close();
            });
        });
    }
  }

  public selectedColor(): void {
    this.color.setValue(this.labelColor);
    FormGroupHelper.markControlTouchedAndDirty(this.color);
  }

  public selectColorInMenu(color): void {
    this.labelColor = color;
  }

  /*
   * private helpers
   * */

  private createFormControls(): void {
    this.name = new FormControl('', [Validators.required, Validators.maxLength(20)]);
    this.description = new FormControl('', [Validators.required, Validators.maxLength(256)]);
    this.color = new FormControl({ value: '', disabled: true }, [Validators.required, HexColorValidator()]);
  }
  private createForm(): void {
    this.form = new FormGroup({
      name: this.name,
      description: this.description,
      color: this.color
    });
  }
  private setInitialData(initialData: LabelEntity): void {
    this.name.setValue(initialData.name);
    this.description.setValue(initialData.description);
    this.color.setValue(initialData.color);

    this.labelColor = initialData.color;
  }
}
