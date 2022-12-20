import { Component, OnInit, ChangeDetectionStrategy, ViewChild, OnDestroy, Inject, LOCALE_ID } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DxChartComponent } from 'devextreme-angular';
import { HistoricalPrice } from '@services/app-layer/entities/historical-price';
import { HistoricalPriceService } from '@services/app-layer/historical-price/historical-price.service';
import { formatCurrency } from '@angular/common';
import { CountriesService } from '@services/app-layer/countries/countries.service';
import { Country } from '@services/app-layer/entities/country';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { InventorySearchEntity } from '@services/app-layer/entities/inventory-search';

@Component({
  selector: 'app-historical-price-modal',
  templateUrl: './historical-price-modal.component.html',
  styleUrls: ['./historical-price-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HistoricalPriceModalComponent implements OnInit, OnDestroy {
  @ViewChild(DxChartComponent) chart: DxChartComponent;
  private destroy$ = new Subject<void>();

  public selectedProductLot: InventorySearchEntity;
  public askPricePerUnit: number;
  public avgCostBasisPerUom: number;
  public historicalPrices: HistoricalPrice[] = [];
  public visualRange: any = {};
  public countries = [];
  public regions = ['Northeast', 'Southeast', 'Midwest', 'Southwest', 'West'];
  public states = [];
  public selectedCountry: Country;

  private filtersChanged$ = new Subject();

  constructor(
    @Inject(MAT_DIALOG_DATA) data: InventorySearchEntity,
    @Inject(LOCALE_ID) private localeId: string,
    private dialogRef: MatDialogRef<HistoricalPriceModalComponent>,
    private historicalPriceService: HistoricalPriceService,
    private countriesService: CountriesService
  ) {
    this.customizeCandleStickTooltip = this.customizeCandleStickTooltip.bind(this);
    this.customizeRangeBarTooltip = this.customizeRangeBarTooltip.bind(this);

    this.selectedProductLot = data;
    this.askPricePerUnit = this.selectedProductLot.askPricePerUnit || 0;
    this.avgCostBasisPerUom = this.selectedProductLot.avgCostBasisPerUom || 0;

    this.countries = this.countriesService.getCountries();
    this.selectedCountry = this.countries[0];
    this.states = this.selectedCountry.states;
  }

  ngOnInit(): void {
    this.getHistoricalPrice();
    this.filtersChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => setTimeout(this.getHistoricalPrice.bind(this), 1));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
  }

  public onClose(): void {
    this.dialogRef.close();
  }

  public customizeRangeBarTooltip(arg) {
    const low = formatCurrency(arg.rangeValue1, this.localeId, '$');
    const high = formatCurrency(arg.rangeValue2, this.localeId, '$');

    return {
      text: `Low: ${low}<br/>High: ${high}<br/>`
    };
  }

  public customizeCandleStickTooltip(arg) {
    const low = formatCurrency(arg.openValue, this.localeId, '$');
    const high = formatCurrency(arg.closeValue, this.localeId, '$');
    const countryLow = formatCurrency(arg.lowValue, this.localeId, '$');
    const countryHigh = formatCurrency(arg.highValue, this.localeId, '$');

    return {
      text: `Low: ${low}<br/>High: ${high}<br/>Country Low: ${countryLow}<br/>Country High: ${countryHigh}<br/>`
    };
  }

  public onFilterChange(args) {
    this.filtersChanged$.next(args);
  }

  private getHistoricalPrice() {
    this.historicalPrices = this.historicalPriceService.getHistoricalPrice(this.selectedProductLot);
  }
}
