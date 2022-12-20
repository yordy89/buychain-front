import { Component, OnInit, Input } from '@angular/core';
import { CrmLocationEntity } from '@app/services/app-layer/entities/crm';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { CrmStateService } from '@views/main/crm/crm/crm-state.service';
import { CrmComponentService } from '../../../crm.component.service';
import { FormGroupHelper } from '@app/services/helpers/utils/form-group-helper';
import { ObjectUtil } from '@app/services/helpers/utils/object-util';

@Component({
  selector: 'app-crm-outbound-info',
  templateUrl: './crm-outbound-info.component.html',
  styleUrls: ['../common/crm-inbound-outbound-info.component.scss']
})
export class CrmOutboundInfoComponent implements OnInit {
  private _crmLocation: CrmLocationEntity;
  @Input() set crmLocation(value) {
    this._crmLocation = value;
    if (value) this.setFormData();
    else this.resetFormData();
  }
  get crmLocation(): CrmLocationEntity {
    return this._crmLocation;
  }

  public loadingHours = new FormControl('', Validators.maxLength(1000));
  public loadingNotes = new FormControl('', Validators.maxLength(1000));
  public form = new FormGroup({
    loadingHours: this.loadingHours,
    loadingNotes: this.loadingNotes
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
    this.loadingHours.setValue(this.crmLocation.loadingHours);
    this.loadingNotes.setValue(this.crmLocation.loadingNotes);
  }

  resetFormData() {
    this.loadingHours.setValue('');
    this.loadingNotes.setValue('');
  }
}
