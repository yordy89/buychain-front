import { Component, OnInit, Inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { first } from 'rxjs/operators';
import { TransportMethodType, RailRestriction } from '@services/app-layer/entities/facility';
import { CsvHelperService } from '@services/helpers/csv-helper/csv-helper.service';
import { RateTableService } from '@services/app-layer/rate-table/rate-table.service';
import { NotificationHelperService } from '@services/helpers/notification-helper/notification-helper.service';
import { CountriesService } from '@services/app-layer/countries/countries.service';
import { RateTableUom } from '@services/app-layer/app-layer.enums';

class TransportMethodImportModel {
  type: TransportMethodType;
  carrier?: string;
  railRestriction?: RailRestriction;

  constructor(type, carrier, railRestriction) {
    this.type = type;
    this.carrier = carrier;
    this.railRestriction = railRestriction;
  }
}

class RateTableImportModel {
  index: number;
  errorFieldName: string;
  errorMessage: string;

  destinationShortName: string;
  destinationCountry: string;
  destinationState: string;
  destinationCity: string;
  transportMethod: TransportMethodImportModel;
  capacity: number;
  uom: RateTableUom;
  cost: number;
  destinationDescription: string;

  constructor(args, index) {
    this.index = index;
    this.destinationShortName = args[0];
    this.destinationCountry = args[1];
    this.destinationState = args[2];
    this.destinationCity = args[3];
    this.uom = args[5];
    this.capacity = args[6];
    this.transportMethod = new TransportMethodImportModel(args[4], args[7], args[8]);
    this.cost = +args[9];
    this.destinationDescription = args[10];
  }

  public setError(fieldName: string, message: string): void {
    this.errorFieldName = fieldName;
    this.errorMessage = message;
  }

  public isValid(): boolean {
    return !this.errorMessage;
  }

  public hasError(): boolean {
    return !!this.errorMessage;
  }
}

@Component({
  selector: 'app-import-rate-table-modal',
  templateUrl: './import-rate-table-modal.component.html',
  styleUrls: ['./import-rate-table-modal.component.scss']
})
export class ImportRateTableModalComponent implements OnInit {
  private rateTableId: string;

  private countries = [];
  // ToDo: Define TransportMethodType and RailRestriction Key to Name map table.
  private transportMethodTypes = Object.keys(TransportMethodType).map(key => TransportMethodType[key]);
  private railRestrictions = Object.keys(RailRestriction).map(key => RailRestriction[key]);
  private rateTableUomEnum = Object.keys(RateTableUom).map(key => RateTableUom[key]);

  // ToDo: Read from configuration.
  private chunkLimit = 100;

  public stateList = [
    { state: 'selection', headerText: 'Import Entries', nextIndex: 1 },
    { state: 'validation', headerText: 'Validating Entries', nextIndex: 2 },
    { state: 'results', headerText: 'Entries Results', nextIndex: 0 }
  ];
  public currentState = this.stateList[0];

  public successCount = 0;
  public totalCount = 0;
  public errorCount = 0;
  public progress = 0;

  public selectedFile: File = null;
  public replace = false;

  public entries: Array<RateTableImportModel> = [];

  constructor(
    @Inject(MAT_DIALOG_DATA) data: { route: ActivatedRoute },
    private dialogRef: MatDialogRef<ImportRateTableModalComponent>,
    private csvHelperService: CsvHelperService,
    private rateTableService: RateTableService,
    private countriesService: CountriesService,
    private notificationService: NotificationHelperService
  ) {
    this.rateTableId = data.route.snapshot.params.rateTableId;
  }

  ngOnInit() {
    this.initializeCountries();
  }

  public async import() {
    this.moveToNextState();

    try {
      const dataArray = await this.csvHelperService.readFromFileAsync(this.selectedFile, false, true);

      // ToDo: read max count from config
      if (dataArray && dataArray.length > 10000) {
        throw new Error('Entries count is too long. Max 10000');
      }

      this.entries = dataArray
        .map((dataRow, index) => new RateTableImportModel(dataRow, index))
        .map(entry => this.normalize(entry))
        .map(entry => this.validate(entry));

      const validEntries = this.entries.filter(x => x.isValid());

      let append = !this.replace;

      const pendingEntries = validEntries.map(x => x);
      while (pendingEntries.length) {
        const chunk = pendingEntries.splice(0, this.chunkLimit);
        const failedEntries = await this.tryBulkInsert(append, chunk);

        this.setErrorsOnFailedEntries(failedEntries);

        this.updateProgress(validEntries.length - pendingEntries.length, validEntries.length);

        // always append consecutive chunks
        append = true;
      }

      this.totalCount = this.entries.length;
      this.errorCount = this.entries.filter(x => x.hasError()).length;
      this.successCount = this.totalCount - this.errorCount;
    } catch (error) {
      const message = error.error ? error.error.message : error.message;
      this.notificationService.showValidation(message);
      this.close();
    }

    this.moveToNextState();
  }

  public getInvalidEntries() {
    return this.entries.filter(x => x.hasError());
  }

  public onFileChange(file: File): void {
    this.selectedFile = file;
  }

  public close(): void {
    if (this.currentState.state === 'results') this.dialogRef.close('success');
    else this.dialogRef.close();
  }

  /*
   * private
   */
  private async tryBulkInsert(append: boolean, entries: RateTableImportModel[]) {
    const payload = {
      append: append,
      entries: entries
    };

    return await this.rateTableService.bulkAddRateTableEntries(this.rateTableId, payload).pipe(first()).toPromise();
  }

  private setErrorsOnFailedEntries(failedEntries) {
    failedEntries.forEach(failed => {
      const message = failed.message;
      const key = failed.item.destinationShortName;
      const entry = this.entries.find(x => x.destinationShortName === key);
      entry.setError(null, message);
    });
  }

  private moveToNextState(): void {
    this.currentState = this.stateList[this.currentState.nextIndex];
  }

  private toTitleCase(text): string {
    return text
      .trim()
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private normalize(entry) {
    entry.destinationShortName = this.toTitleCase(entry.destinationShortName);

    entry.destinationCountry = this.tryMapCountryAbbreviationToName(entry.destinationCountry);
    entry.destinationCountry = this.toTitleCase(entry.destinationCountry);

    if (entry.destinationState && entry.destinationState.length === 2) {
      entry.destinationState = this.tryMapStateAbbreviationToName(
        entry.destinationCountry,
        entry.destinationState.trim()
      );
    } else entry.destinationState = this.toTitleCase(entry.destinationState);

    entry.destinationCity = this.toTitleCase(entry.destinationCity);

    entry.transportMethod.type = entry.transportMethod.type.trim().toUpperCase();

    if (entry.transportMethod.carrier)
      entry.transportMethod.carrier = entry.transportMethod.carrier.trim().toUpperCase();

    if (entry.transportMethod.railRestriction)
      entry.transportMethod.railRestriction = entry.transportMethod.railRestriction.trim().toUpperCase();

    return entry;
  }

  // ToDo: Refactor after review
  private validate(entry: RateTableImportModel): RateTableImportModel {
    if (!entry.destinationShortName) {
      entry.setError('destinationShortName', 'DestinationShortName is required.');
    } else if (entry.destinationShortName.length > 35) {
      // ToDo: read max count from config
      entry.setError('destinationShortName', 'DestinationShortName is too long. Max 35');
    }

    if (entry.destinationDescription && entry.destinationDescription.length > 100) {
      // ToDo: read max count from config
      entry.setError('destinationDescription', 'Destination Notes is too long. Max 100');
    }

    if (!entry.destinationCountry) {
      entry.setError('destinationCountry', 'Country is required.');
    } else if (entry.destinationCountry.length > 30) {
      // ToDo: read max count from config
      entry.setError('destinationCountry', 'Country is too long. Max 30.');
    }

    if (!entry.destinationState) {
      entry.setError('destinationState', 'State is required.');
    } else if (entry.destinationState.length > 30) {
      // ToDo: read max count from config
      entry.setError('destinationState', 'State is too long. Max 30.');
    }

    if (!entry.destinationCity) {
      entry.setError('destinationCity', 'City is required.');
    } else if (entry.destinationCity.length > 20) {
      // ToDo: read max count from config
      entry.setError('destinationCity', 'City is too long. Max 20.');
    }

    this.validateTransportMethod(entry);

    if (!this.rateTableUomEnum.some(x => x === entry.uom)) {
      entry.setError(
        'uom',
        'UoM is unknown. Allowed values are [BOARD_FEET, LINEAR_FEET, SQUARE_FEET, CUBIC_FEET, WEIGHT_LBS, COUNT].'
      );
    }

    if (entry.capacity < 0) {
      entry.setError('capacity', 'Capacity must be positive number.');
    }

    if (entry.cost < 0) {
      entry.setError('cost', 'Cost must be positive number.');
    }

    return entry;
  }

  private validateTransportMethod(entry) {
    if (!this.transportMethodTypes.some(x => x === entry.transportMethod.type)) {
      entry.setError(
        'transportMethod.type',
        "TrasportMethodTypes is unknown. Allowed values are ['RAIL', 'TRUCK', 'HEAVY_TRUCK', 'SHIP_FREE_ON_BOARD', 'SHIP_CARGO']."
      );
    } else if (entry.transportMethod.type === 'RAIL') {
      if (!entry.transportMethod.carrier) {
        entry.setError('transportMethod.carrier', "'RAIL' transport type requires Carrier.");
      }

      if (!entry.transportMethod.railRestriction) {
        entry.setError('transportMethod.railRestriction', 'RAIL transport type requires Rail Restriction.');
      } else if (!this.railRestrictions.some(x => x === entry.transportMethod.railRestriction)) {
        entry.setError(
          'transportMethod.railRestriction',
          "Rail Restriction is unknown. Allowed values are ['OPEN', 'CLOSED']."
        );
      }
    }
  }

  private initializeCountries() {
    this.countries = this.countriesService.getCountries();
  }

  private tryMapCountryAbbreviationToName(countryInput: string) {
    const country = this.countries.find(x => x.nameAbbreviations && x.nameAbbreviations.some(a => a === countryInput));
    if (country) return country.name;
    return countryInput;
  }

  private tryMapStateAbbreviationToName(countryName: string, stateInput: string) {
    const country = this.countries.find(x => x.countryName === countryName);
    if (country) {
      const state = country.states.find(x => x.abbreviation === stateInput.toUpperCase());
      if (state) return state.name;
    }
    return stateInput;
  }

  private updateProgress(completed: number, target: number) {
    this.progress = Math.round((completed / target) * 100);
  }
}
