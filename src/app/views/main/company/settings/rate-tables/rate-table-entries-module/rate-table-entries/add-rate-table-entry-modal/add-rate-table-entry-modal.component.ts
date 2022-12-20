import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { FormGroupHelper } from '@services/helpers/utils/form-group-helper';
import { first, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { RailRestriction, TransportMethodType } from '@services/app-layer/entities/facility';
import { CountriesService } from '@services/app-layer/countries/countries.service';
import { RailCarrier, RailCarrierService } from '@services/app-layer/rail-carrier/rail-carrier.service';
import { RateTableService } from '@services/app-layer/rate-table/rate-table.service';
import { RateTableItem } from '@services/app-layer/entities/rate-table';
import { NotificationHelperService } from '@services/helpers/notification-helper/notification-helper.service';
import { Environment } from '@services/app-layer/app-layer.environment';

@Component({
  selector: 'app-add-rate-table-entry-modal',
  templateUrl: './add-rate-table-entry-modal.component.html'
})
export class AddRateTableEntryModalComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  public countriesList: any[];
  public statesList: any[];
  public citiesList: any[];
  public uomList = ['BOARD_FEET', 'SQUARE_FEET', 'LINEAR_FEET'];
  public transportMethodTypes = Object.keys(TransportMethodType).map(key => TransportMethodType[key]);
  public railRestrictions = Object.keys(RailRestriction).map(key => RailRestriction[key]);
  public railCarriers: RailCarrier[] = [];
  public TransportMethodType = TransportMethodType;

  public form: FormGroup;
  public capacity: FormControl;
  public cost: FormControl;
  public destinationShortName: FormControl;
  public destinationDescription: FormControl;
  public destinationCity: FormControl;
  public destinationState: FormControl;
  public destinationCountry: FormControl;
  public uom: FormControl;
  public transportMethod: FormGroup;
  public type: FormControl;
  public carrier: FormControl;
  public railRestriction: FormControl;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { rateTableId: string; entries: RateTableItem[] },
    private rateTableService: RateTableService,
    private countriesService: CountriesService,
    private railCarrierService: RailCarrierService,
    private dialogRef: MatDialogRef<AddRateTableEntryModalComponent>,
    private notificationHelperService: NotificationHelperService
  ) {}

  ngOnInit(): void {
    this.setCountriesList();
    this.setRailCarrierList();
    this.createFormControls();
    this.createForm();
    this.handleTransportTypeChange();
    this.handleCountryChange();
    this.handleStateChange();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.unsubscribe();
  }

  close(): void {
    this.dialogRef.close();
  }

  addNewRateTableEntry(): void {
    if (this.form.value.capacity === 0) {
      return this.notificationHelperService.showValidation('Please provide a positive number for capacity');
    }
    if (this.form.invalid) return FormGroupHelper.markTouchedAndDirty(this.form);
    if (this.data.entries.find(entry => entry.destinationShortName === this.destinationShortName.value)) {
      return this.notificationHelperService.showValidation(
        'There already exists an entry with the provided location name. Please specify another.'
      );
    }
    this.rateTableService
      .addRateTableEntry(this.data.rateTableId, this.form.value)
      .pipe(first())
      .subscribe(data => this.dialogRef.close(data));
  }

  /*
   * Private helpers
   * */

  private createFormControls(): void {
    this.capacity = new FormControl('', [
      Validators.required,
      Validators.min(0),
      Validators.max(Environment.maxSafeNumber)
    ]);
    this.cost = new FormControl('', [
      Validators.required,
      Validators.min(0),
      Validators.max(Environment.maxSafeNumber)
    ]);
    this.destinationShortName = new FormControl('', [Validators.required, Validators.maxLength(35)]);
    this.destinationDescription = new FormControl('', [Validators.maxLength(100)]);
    this.destinationCity = new FormControl({ value: '', disabled: true }, [
      Validators.required,
      Validators.maxLength(20)
    ]);
    this.destinationState = new FormControl({ value: '', disabled: true }, [
      Validators.required,
      Validators.maxLength(30)
    ]);
    this.destinationCountry = new FormControl('', [Validators.required, Validators.maxLength(30)]);
    this.uom = new FormControl('', [Validators.required]);
    this.type = new FormControl('', [Validators.required]);
    this.carrier = new FormControl({ value: '', disabled: true });
    this.railRestriction = new FormControl({ value: '', disabled: true });
  }
  private createForm(): void {
    this.transportMethod = new FormGroup({
      type: this.type,
      carrier: this.carrier,
      railRestriction: this.railRestriction
    });
    this.form = new FormGroup({
      capacity: this.capacity,
      cost: this.cost,
      destinationShortName: this.destinationShortName,
      destinationDescription: this.destinationDescription,
      destinationCity: this.destinationCity,
      destinationState: this.destinationState,
      destinationCountry: this.destinationCountry,
      uom: this.uom,
      transportMethod: this.transportMethod
    });
  }

  private handleTransportTypeChange(): void {
    this.type.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(value => {
      value === TransportMethodType.Rail ? this.enableRailControls() : this.disableRailControls();
    });
  }

  private enableRailControls(): void {
    this.carrier.enable({ emitEvent: false });
    this.railRestriction.enable({ emitEvent: false });
    this.carrier.setValidators([Validators.required]);
    this.railRestriction.setValidators([Validators.required]);
  }

  private disableRailControls(): void {
    this.carrier.disable({ emitEvent: false });
    this.railRestriction.disable({ emitEvent: false });
    this.carrier.reset();
    this.carrier.clearValidators();
    this.railRestriction.reset();
    this.railRestriction.clearValidators();
  }

  private setCountriesList(): void {
    this.countriesList = this.countriesService.getCountries();
  }
  private handleCountryChange(): void {
    this.destinationCountry.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(value => {
      if (!value) return;
      const selectedCountry = this.countriesList.find(item => item.name === value);
      this.destinationState.reset('', { emitEvent: false });
      this.destinationCity.reset('', { emitEvent: false });
      this.destinationState.enable({ emitEvent: false });
      this.destinationCity.disable({ emitEvent: false });
      this.statesList = selectedCountry.states;
    });
  }
  private handleStateChange(): void {
    this.destinationState.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(value => {
      if (!value) return;
      const selectedCountry = this.countriesList.find(item => item.name === this.destinationCountry.value);
      const selectedState = selectedCountry.states.find(item => item.name === value);
      this.destinationCity.reset('', { emitEvent: false });
      this.destinationCity.enable({ emitEvent: false });
      this.citiesList = selectedState.cities;
    });
  }
  private setRailCarrierList(): void {
    this.railCarriers = this.railCarrierService.getRailCarriers();
  }
}
