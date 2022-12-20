import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { TableAction } from '@app/models';
import { RateTableService } from '@services/app-layer/rate-table/rate-table.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { GridHelperService } from '@services/helpers/grid-helper/grid-helper.service';
import { NotificationHelperService } from '@services/helpers/notification-helper/notification-helper.service';
import { ObjectUtil } from '@services/helpers/utils/object-util';
import { Subject } from 'rxjs';
import { first, takeUntil } from 'rxjs/operators';
import { ActivatedRoute } from '@angular/router';
import {
  CompanySettingsExpandableSection,
  NavigationHelperService
} from '@services/helpers/navigation-helper/navigation-helper.service';
import { DialogModalComponent, DialogType } from '@components/common/modals/dialog-modal/dialog-modal.component';
import { MatDialog } from '@angular/material/dialog';
import { ImportRateTableModalComponent } from './import-rate-table-modal/import-rate-table-modal.component';
import { RailCarrier, RailCarrierService } from '@services/app-layer/rail-carrier/rail-carrier.service';
import { CsvHelperService } from '@services/helpers/csv-helper/csv-helper.service';
import { DxDataGridComponent } from 'devextreme-angular';
import { AccessControlScope } from '@services/app-layer/permission/permission.interface';
import { FormGroupHelper } from '@services/helpers/utils/form-group-helper';
import { RailRestriction, TransportMethodType } from '@services/app-layer/entities/facility';
import { CountriesService } from '@services/app-layer/countries/countries.service';
import { RateTable, RateTableItem } from '@services/app-layer/entities/rate-table';
import { RateTableUom } from '@services/app-layer/app-layer.enums';
import { Environment } from '@services/app-layer/app-layer.environment';
import { AddRateTableEntryModalComponent } from '@views/main/company/settings/rate-tables/rate-table-entries-module/rate-table-entries/add-rate-table-entry-modal/add-rate-table-entry-modal.component';
import { EditRateTableEntryModalComponent } from '@views/main/company/settings/rate-tables/rate-table-entries-module/rate-table-entries/edit-rate-table-entry-modal/edit-rate-table-entry-modal.component';

enum Actions {
  EDIT,
  DELETE
}

@Component({
  selector: 'app-rate-table-entries',
  templateUrl: './rate-table-entries.component.html',
  styleUrls: ['./rate-table-entries.component.scss']
})
export class RateTableEntriesComponent implements OnInit, OnDestroy {
  @ViewChild('rateTableEntriesGrid') rateTableEntriesGrid: DxDataGridComponent;

  private readonly rateTableId: string;
  private columnsGroupIndex = {};

  public currentUser = {
    canModify: false,
    canDelete: false
  };
  public AccessControlScope = AccessControlScope;

  public form: FormGroup;
  public name: FormControl;
  public description: FormControl;
  public rateTable: RateTable;
  public rateTableEntries: RateTableItem[] = [];
  public headerDisabled = true;

  public countries = [];
  public states = [];
  public cities = [];

  // ToDo: Define TransportMethodType and RailRestriction Key to Name map table.
  public transportMethodTypes = Object.keys(TransportMethodType).map(key => TransportMethodType[key]);
  public railRestrictions = Object.keys(RailRestriction).map(key => RailRestriction[key]);
  public railCarriers: RailCarrier[] = [];
  public uomList = Object.keys(RateTableUom).map(key => RateTableUom[key]);
  actions: TableAction[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    private dialog: MatDialog,
    private route: ActivatedRoute,
    private rateTableService: RateTableService,
    private notificationHelperService: NotificationHelperService,
    private navigationHelperService: NavigationHelperService,
    private countriesService: CountriesService,
    private railCarrierService: RailCarrierService,
    private csvHelper: CsvHelperService,
    private gridHelperService: GridHelperService
  ) {
    this.rateTableId = this.route.snapshot.params.rateTableId;
  }

  ngOnInit() {
    this.createFormControls();
    this.createForm();
    this.initializePermissions();
    this.initTableActions();
    this.initializeRateTable();
    this.initializeRateTableEntries();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  public onStateChanged(rowData: any, value: any) {
    rowData.destinationCity = null;
    rowData.destinationState = value;

    const state = this.states.find(x => x.name === value);
    if (state) this.cities = state.cities;
  }

  public editEntry(rateTableEntry) {
    this.dialog
      .open(EditRateTableEntryModalComponent, {
        width: '820px',
        disableClose: true,
        data: { rateTableId: this.rateTable.id, entry: rateTableEntry }
      })
      .afterClosed()
      .subscribe(data => {
        if (data) {
          this.rateTableEntries = this.rateTableEntries.map(item => (item.id === data.id ? data : item));
        }
      });
  }

  public deleteEntry(rateTableEntry): void {
    this.rateTableService
      .deleteRateTableEntry(this.rateTableId, rateTableEntry.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.rateTableEntries = this.rateTableEntries.filter(item => item.id !== rateTableEntry.id);
      });
  }

  public onToolbarPreparing(e) {
    const toolbarItems = e.toolbarOptions.items;
    toolbarItems.forEach(element => {
      if (element.name === 'addRowButton') {
        element.visible = false;
      }
    });
    this.gridHelperService.prepareToolbarPrefixTemplate(e);
  }

  public getGroupCountText(event) {
    const count = event.value;
    if (count > 1) return `${count} Destinations`;
    else return `${count} Destination`;
  }

  public deleteRateTable(): void {
    this.dialog
      .open(DialogModalComponent, {
        width: '450px',
        disableClose: true,
        data: {
          type: DialogType.Confirm,
          content: 'Are you sure you want to delete the rate table?'
        }
      })
      .afterClosed()
      .subscribe(data => {
        if (data) {
          this.rateTableService
            .deleteRateTable(this.rateTableId)
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => {
              this.notificationHelperService.showSuccess('Rate table successfully deleted');
              this.backToCompanySettings();
            });
        }
      });
  }

  public addEntry(): void {
    this.dialog
      .open(AddRateTableEntryModalComponent, {
        width: '820px',
        disableClose: true,
        data: { rateTableId: this.rateTableId, entries: this.rateTableEntries }
      })
      .afterClosed()
      .pipe(first())
      .subscribe(entryData => {
        if (!entryData) return;
        this.rateTableEntries.push(entryData);
      });
  }

  public showImportModal() {
    this.dialog
      .open(ImportRateTableModalComponent, {
        width: '820px',
        disableClose: true,
        data: { route: this.route }
      })
      .afterClosed()
      .pipe(first())
      .subscribe(data => {
        if (!data) return;
        this.rateTableService
          .getCompanyRateTableEntries(this.rateTableId)
          .pipe(takeUntil(this.destroy$))
          .subscribe((rateTableEntries: Array<RateTableItem>) => (this.rateTableEntries = rateTableEntries));
      });
  }

  public async export() {
    const exportModel = this.rateTableEntries.map(entry => ({
      destinationShortName: entry.destinationShortName,
      destinationCountry: entry.destinationCountry,
      destinationState: entry.destinationState,
      destinationCity: entry.destinationCity,
      transportMethodType: entry.transportMethod.type,
      uom: entry.uom,
      capacity: entry.capacity,
      railCarrier: entry.transportMethod.carrier,
      railRestriction: entry.transportMethod.railRestriction,
      cost: entry.cost,
      destinationDescription: entry.destinationDescription
    }));

    const csvString = await this.csvHelper.serializeToCSV(exportModel, false);
    const normalizedRateTableName = this.rateTable.name.toLowerCase().split(' ').join('-');
    const fileName = `${normalizedRateTableName}.csv`;
    this.csvHelper.saveAsFile(csvString, fileName);
  }

  public backToCompanySettings(): void {
    this.navigationHelperService.navigateCompanySettings(CompanySettingsExpandableSection.RateTables);
  }

  public switchToHeaderEditMode() {
    this.headerDisabled = false;
  }

  public async saveHeaderChanges() {
    if (this.form.invalid) {
      return;
    }

    const payload = FormGroupHelper.getDirtyValues(this.form);

    if (ObjectUtil.isEmptyObject(payload)) {
      this.headerDisabled = true;
      return;
    }

    try {
      const result = await this.rateTableService.updateRateTable(this.rateTableId, payload).toPromise();

      this.setRateTable(result);

      this.headerDisabled = true;
    } catch (error) {
      const message = error.error ? error.error.message : error.message;
      this.notificationHelperService.showValidation(message);
    }
  }

  public cancelHeaderEditing() {
    this.resetForm();
    this.headerDisabled = true;
  }

  onTableAction(value: Actions, item: RateTableItem) {
    switch (value) {
      case Actions.EDIT:
        this.editEntry(item);
        break;

      case Actions.DELETE:
        this.deleteEntry(item);
        break;
    }
  }

  /*
   * Private Helpers
   */

  private initializeRateTableEntries(): void {
    this.rateTableService
      .getCompanyRateTableEntries(this.rateTableId)
      .pipe(takeUntil(this.destroy$))
      .subscribe(rateTableEntries => (this.rateTableEntries = rateTableEntries));
  }

  private initializeRateTable(): void {
    this.rateTableService
      .getCompanyRateTables()
      .pipe(takeUntil(this.destroy$))
      .subscribe(rateTables => {
        // TODO why we do not have get rate table by id?
        const rateTable = rateTables.find(x => x.id === this.rateTableId);
        if (rateTable) this.setRateTable(rateTable);
      });
  }

  private setRateTable(rateTable: any): void {
    this.rateTable = rateTable;
    this.resetForm();
  }

  private createFormControls(): void {
    this.name = new FormControl('', [Validators.required, Validators.maxLength(30)]);
    this.description = new FormControl('', [Validators.required, Validators.maxLength(100)]);
  }

  private createForm(): void {
    this.form = new FormGroup({
      name: this.name,
      description: this.description
    });
  }

  private resetForm(): void {
    this.name.setValue(this.rateTable.name);
    this.description.setValue(this.rateTable.description);
  }

  private initializePermissions() {
    const user = Environment.getCurrentUser();
    this.currentUser.canModify =
      user.normalizedAccessControlRoles.RATE_TABLE.rateTableSection.sectionGroup.update.value ===
      AccessControlScope.Company;
    this.currentUser.canDelete =
      user.normalizedAccessControlRoles.RATE_TABLE.rateTableSection.sectionGroup.delete.value ===
      AccessControlScope.Company;
  }

  private initTableActions() {
    this.actions = [
      {
        label: 'Edit',
        icon: 'edit',
        value: Actions.EDIT,
        isHidden: !this.currentUser.canModify
      },
      {
        label: 'Delete',
        icon: 'delete',
        color: 'warn',
        value: Actions.DELETE,
        prompt: {
          title: 'Confirm please!',
          text: 'Are you sure you want to delete the entry?'
        },
        isHidden: !this.currentUser.canDelete
      }
    ];
  }
}
