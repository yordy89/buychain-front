import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { FormGroupHelper } from '@services/helpers/utils/form-group-helper';
import { RailCarrier, RailCarrierService } from '@app/services/app-layer/rail-carrier/rail-carrier.service';
import { TransportMethodType, RailRestriction, TransportMethodEntity } from '@app/services/app-layer/entities/facility';

@Component({
  selector: 'app-add-transport-method-modal',
  templateUrl: './add-transport-method-modal.component.html'
})
export class AddTransportMethodModalComponent implements OnInit {
  public form: FormGroup;
  public railCarrier: FormControl;
  public carriersList: RailCarrier[];

  constructor(
    private dialogRef: MatDialogRef<AddTransportMethodModalComponent>,
    public railCarrierService: RailCarrierService,
    @Inject(MAT_DIALOG_DATA) public transportMethods: TransportMethodEntity[]
  ) {}

  ngOnInit() {
    this.createFormControls();
    this.createForm();
    this.setRailCarriers();
  }

  public close(): void {
    this.dialogRef.close();
  }

  public addRailCarrier(): void {
    if (this.form.invalid) return FormGroupHelper.markTouchedAndDirty(this.form);

    this.dialogRef.close({
      carrier: this.railCarrier.value.abbreviation,
      type: TransportMethodType.Rail,
      railRestriction: RailRestriction.Open // TODO discuss with Alex
    });
  }

  /*
   * Private Methods
   * */
  private createFormControls(): void {
    this.railCarrier = new FormControl('', [Validators.required]);
  }
  private createForm(): void {
    this.form = new FormGroup({
      railCarrier: this.railCarrier
    });
  }

  private setRailCarriers(): void {
    this.carriersList = this.railCarrierService
      .getRailCarriers()
      .filter(c => !this.transportMethods.some(t => t.carrier === c.abbreviation));
    this.carriersList.forEach(c => (c['nameWithAbbreviation'] = `${c.abbreviation} - ${c.name}`));
  }
}
