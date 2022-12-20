import { Component, OnInit, Input } from '@angular/core';
import { CrmLocationEntity } from '@app/services/app-layer/entities/crm';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { FormGroupHelper } from '@app/services/helpers/utils/form-group-helper';
import { ObjectUtil } from '@app/services/helpers/utils/object-util';
import { CrmStateService } from '@views/main/crm/crm/crm-state.service';
import { CrmComponentService } from '../../../crm.component.service';

@Component({
  selector: 'app-crm-inbound-info',
  templateUrl: './crm-inbound-info.component.html',
  styleUrls: ['../common/crm-inbound-outbound-info.component.scss']
})
export class CrmInboundInfoComponent implements OnInit {
  private _crmLocation: CrmLocationEntity;
  @Input() set crmLocation(value) {
    this._crmLocation = value;
    if (value) this.setFormData();
    else this.resetFormData();
  }
  get crmLocation(): CrmLocationEntity {
    return this._crmLocation;
  }

  public receivingHours = new FormControl('', Validators.maxLength(1000));
  public receivingNotes = new FormControl('', Validators.maxLength(1000));
  public form = new FormGroup({
    receivingHours: this.receivingHours,
    receivingNotes: this.receivingNotes
  });

  public disabledMode = true;

  constructor(private crmService: CrmComponentService, private crmStateService: CrmStateService) {}

  ngOnInit() {
    this.setFormData();
  }

  onEditClick() {
    this.disabledMode = false;
  }

  done() {
    if (this.form.invalid) return FormGroupHelper.markTouchedAndDirty(this.form);

    if (ObjectUtil.isEmptyObject(FormGroupHelper.getDirtyValues(this.form))) {
      this.disabledMode = true;
      return;
    }

    const payload = FormGroupHelper.getDirtyValues(this.form);

    this.crmService
      .updateLocation(this.crmLocation, payload)
      .pipe()
      .subscribe(data => {
        this.crmStateService.updateActiveLocation(data);
        this.disabledMode = true;
        FormGroupHelper.markUntouchedAndPristine(this.form);
      });
  }

  setFormData() {
    this.receivingHours.setValue(this.crmLocation.receivingHours);
    this.receivingNotes.setValue(this.crmLocation.receivingNotes);
  }

  resetFormData() {
    this.receivingHours.setValue(null);
    this.receivingNotes.setValue(null);
  }
}
