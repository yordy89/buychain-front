import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CsvHelperService } from '@app/services/helpers/csv-helper/csv-helper.service';
import { CountriesService } from '@app/services/app-layer/countries/countries.service';
import { CrmService } from '@app/services/app-layer/crm/crm.service';
import { NotificationHelperService } from '@app/services/helpers/notification-helper/notification-helper.service';
import { CrmStateService } from '@views/main/crm/crm/crm-state.service';
import { ObjectUtil } from '@services/helpers/utils/object-util';

class AccountImportModel {
  name: string;
  website: string;
  logoUrl: string;
  streetAddress: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  constructor(args: any) {
    Object.assign(this, args);
  }
}

class LocationImportModel {
  _accountId: string;

  shortName: string;
  streetAddress: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  careOf: string;
  geolocation: { longitude: number; latitude: number };

  constructor(args: any) {
    this.shortName = args.shortName;
    this.streetAddress = args.streetAddress;
    this.city = args.city;
    this.state = args.state;
    this.country = args.country;
    this.zipCode = args.zipCode;
    this.careOf = args.careOf;
    if (args.longitude && args.latitude) {
      this.geolocation = { longitude: args.longitude, latitude: args.latitude };
    }

    this._accountId = args.accountId;
  }
}

class ContactImportModel {
  _accountId: string;

  username: string;
  firstName: string;
  lastName: string;
  callingCode: string;
  workPhone: string;

  constructor(args: any) {
    this.username = args.email;
    this.firstName = args.firstName;
    this.lastName = args.lastName;
    this.callingCode = args.callingCode;
    if (this.callingCode && this.callingCode.charAt(0) !== '+') this.callingCode = '+'.concat(this.callingCode);
    this.workPhone = args.workPhone;

    this._accountId = args.accountId;
  }
}

class Progress {
  errors = 0;
  success = 0;
}

@Component({
  templateUrl: './import-modal.component.html'
})
export class ImportModalComponent {
  public accounts = [];
  public entityTypes = ['Accounts', 'Locations', 'Contacts'];
  public selectedType: string;
  public selectedFile: any;

  constructor(
    private dialogRef: MatDialogRef<ImportModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: [],
    private csvHelper: CsvHelperService,
    private countryService: CountriesService,
    private crmService: CrmService,
    private notificationService: NotificationHelperService,
    private crmStateService: CrmStateService
  ) {
    this.accounts = data;
  }

  onClose() {
    this.dialogRef.close();
  }

  onFileChange(file) {
    this.selectedFile = file;
  }

  async onImport() {
    if (!this.selectedFile) return;

    try {
      const data = await this.csvHelper.readFromFileAsync(this.selectedFile, true, true);

      // ToDo: read max count from config
      if (data && data.length > 1000) {
        throw new Error('Entries count is too long. Max 10000');
      }

      const progress = new Progress();

      switch (this.selectedType) {
        case 'Accounts':
          await this.importAccounts(data, progress);
          break;
        case 'Locations':
          await this.importLocations(data, progress);
          break;
        case 'Contacts':
          await this.importContacts(data, progress);
          break;
        default:
          break;
      }

      this.notificationService.showSuccess(
        `${progress.success} CRM entities successfully imported. ${progress.errors} errors found.`
      );
      this.dialogRef.close(true);
    } catch (error) {
      const message = error.error ? error.error.message : error.message;
      console.log(error);
      this.notificationService.showValidation(message);
      this.dialogRef.close();
    }
  }

  private async importAccounts(data: any, progress: Progress) {
    const entries = data
      .map(dataRow => ObjectUtil.deleteEmptyProperties(new AccountImportModel(dataRow)))
      .map(entry => this.normalize(entry))
      .filter(entry => {
        const isValid = this.validateAccounts(entry);
        if (!isValid) progress.errors++;
        return isValid;
      });

    for (const entry of entries) {
      try {
        const account = await this.crmService.createAccount(entry).toPromise();
        this.crmStateService.addAccount(account);
        progress.success++;
      } catch (error) {
        progress.errors++;
        console.log(error);
      }
    }
  }

  private async importContacts(data: any, progress: Progress) {
    const entries = data
      .map(dataRow => this.trySetAccountIdByName(dataRow))
      .map(dataRow => ObjectUtil.deleteEmptyProperties(new ContactImportModel(dataRow)))
      .map(entry => this.normalize(entry))
      .filter(entry => {
        const isValid = this.validateContacts(entry);
        if (!isValid) progress.errors++;
        return isValid;
      });

    for (const entry of entries) {
      try {
        const accountId = entry._accountId;
        delete entry._accountId;
        const contact = await this.crmService.createContact(accountId, entry).toPromise();
        this.crmStateService.addContact(contact);
        progress.success++;
      } catch (error) {
        progress.errors++;
        console.log(error);
      }
    }
  }

  private async importLocations(data: any, progress: Progress) {
    const entries = data
      .map(dataRow => this.trySetAccountIdByName(dataRow))
      .map(dataRow => ObjectUtil.deleteEmptyProperties(new LocationImportModel(dataRow)))
      .map(entry => this.normalize(entry))
      .filter(entry => {
        const isValid = this.validateLocation(entry);
        if (!isValid) progress.errors++;
        return isValid;
      });

    for (const entry of entries) {
      try {
        const accountId = entry._accountId;
        delete entry._accountId;
        const location = await this.crmService.createLocation(accountId, entry).toPromise();
        this.crmStateService.addLocation(location);
        progress.success++;
      } catch (error) {
        progress.errors++;
        console.log(error);
      }
    }
  }

  private normalize(entity: AccountImportModel) {
    if (entity.country) entity.country = this.toTitleCase(entity.country);
    if (entity.state) entity.state = this.toTitleCase(entity.state);
    if (entity.city) entity.city = this.toTitleCase(entity.city);

    return entity;
  }

  private validateAccounts(entity: AccountImportModel): boolean {
    return !!entity.name;
  }

  private validateContacts(entity: ContactImportModel) {
    return entity.firstName && entity.lastName && entity._accountId;
  }

  private validateLocation(entity: LocationImportModel) {
    return entity.shortName && entity._accountId;
  }

  private trySetAccountIdByName(dataRow) {
    const found = this.accounts.find(x => x.name === dataRow.accountName);
    if (found) {
      dataRow.accountId = found.id;
    }
    return dataRow;
  }

  private toTitleCase(text): string {
    return text
      .trim()
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}
