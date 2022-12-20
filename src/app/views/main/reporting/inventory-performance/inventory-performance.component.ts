import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SearchService } from '@services/app-layer/search/search.service';
import { GridHelperService } from '@services/helpers/grid-helper/grid-helper.service';
import { TransformHelper } from '@services/helpers/utils/transform-helper';
import { ReportingService } from '@views/main/reporting/reporting.service';
import { subMonths } from 'date-fns';
import { DxDataGridComponent } from 'devextreme-angular';
import {
  InventoryTimeSeriesEnum,
  ProductStateEnum,
  InventoryFiguresOfMeritEnum,
  ProductLotPermissionEnum
} from '@services/app-layer/app-layer.enums';
import { ObjectUtil } from '@services/helpers/utils/object-util';
import { BookmarkService } from '@services/app-layer/bookmark/bookmark.service';
import { InventoryPerformanceService } from '@services/app-layer/inventory-performance/inventory-performance.service';
import { InventoryPerformanceChartEntity } from '@services/app-layer/entities/inventory-performance-chart';
import { FilterBuilderHelper } from '@services/helpers/utils/filter-builder-helper';
import { MemberEntity } from '@services/app-layer/entities/member';
import { FacilityEntity } from '@services/app-layer/entities/facility';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';

enum ChartTypesEnum {
  bar = 'Bar',
  line = 'Line',
  area = 'Area'
}

const date = subMonths(new Date(), 1);
const dateTypeFields = ['shipWeekEstimate', 'purchaseDate', 'landedDate', 'custodyDate', 'soldDate'];

class ViewState {
  public advancedFilter = ['purchaseDate', '>=', date];
  public series = InventoryTimeSeriesEnum.DailyPurchased;
  public chartDetails = {
    type: 'bar',
    figureOfMerit: 'sumOfUnits'
  };
  public grid = null;
  public easyAccess = false;
}

@Component({
  selector: 'app-inventory-performance',
  templateUrl: './inventory-performance.component.html',
  styleUrls: ['../common/reports.common.scss', './inventory-performance.component.scss']
})
export class InventoryPerformanceComponent implements OnInit {
  @ViewChild('grid', { static: false }) grid: DxDataGridComponent;
  companyMembers: MemberEntity[] = [];
  companyFacilities: FacilityEntity[] = [];

  public productLotStates = ObjectUtil.enumToKeyValueArray(ProductStateEnum).map(({ key, value }) => ({
    displayValue: TransformHelper.stringUnderscoreToSpaceTitleCase(value),
    value: key
  }));
  public productLotPermissions = ObjectUtil.enumToKeyValueArray(ProductLotPermissionEnum).map(({ key, value }) => ({
    displayValue: TransformHelper.stringUnderscoreToSpaceTitleCase(value),
    value: key
  }));
  public chartTypes = ObjectUtil.enumToKeyValueArray(ChartTypesEnum);
  public figuresOfMerit = ObjectUtil.enumToKeyValueArray(InventoryFiguresOfMeritEnum);
  public timeSeries = ObjectUtil.enumToArray(InventoryTimeSeriesEnum);

  public viewKey = 'inventoryPerformance';
  public viewState: ViewState;
  public defaultState = new ViewState();

  public productsCompleteList: any[];

  public normalizedInventoryChartData: InventoryPerformanceChartEntity[] = [];
  public visualRange: any = {};

  public filterFields: any;

  constructor(
    private bookmarkService: BookmarkService,
    public inventoryPerformanceService: InventoryPerformanceService,
    private searchService: SearchService,
    private gridHelperService: GridHelperService,
    private reportingService: ReportingService,
    private route: ActivatedRoute,
    private router: Router,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.companyMembers = this.reportingService.companyMembers;
    this.companyFacilities = this.reportingService.companyFacilities;
    this.saveGridState = this.saveGridState.bind(this);
    this.loadGridState = this.loadGridState.bind(this);
    this.filterFields = this.inventoryPerformanceService.filterFields;
    this.setFilterFields(); // fills selectionOptions of filter fields
    this.initViewState();

    if (this.route.snapshot.queryParamMap.get('load') === 'true') {
      this.generateInventoryReport();
      this.router.navigate([], { queryParams: null });
    }
  }

  generateInventoryReport() {
    this.loadProductLotsByFilter().subscribe(() => this.generateNormalizedData());
  }

  onExporting(e) {
    this.gridHelperService.exportToExcel(e, 'InventoryPerformance');
  }

  public onTimePeriodChanged() {
    this.generateNormalizedData();
    this.cd.detectChanges();
  }

  private loadProductLotsByFilter(): Observable<any> {
    const payload = this.inventoryPerformanceService.normalizeProductLotSearchPayload(
      this.viewState.advancedFilter,
      dateTypeFields
    );
    return this.searchService.fetchInventoryProducts(payload).pipe(tap(data => (this.productsCompleteList = data)));
  }

  private generateNormalizedData(): void {
    if (!this.productsCompleteList?.length) {
      this.normalizedInventoryChartData = [];
      return;
    }
    this.normalizedInventoryChartData = this.inventoryPerformanceService.generateNormalizedData(
      this.productsCompleteList,
      this.viewState.series
    );
    if (
      !this.inventoryPerformanceService.uniquePriceSystem &&
      this.viewState.chartDetails.figureOfMerit === 'sumOfMeasure'
    ) {
      this.viewState.chartDetails.figureOfMerit = 'sumOfUnits';
    }
  }

  customizeLabel(arg) {
    return arg.value ? Math.round(arg.value * 100) / 100 : '';
  }

  public onToolbarPreparing(e) {
    this.gridHelperService.prepareToolbarCollapseExpand(e, () => this.grid);
  }

  public onViewStateChanged(viewState: ViewState) {
    const state = viewState;
    FilterBuilderHelper.fixAdvancedFilterDateTypes(state.advancedFilter, dateTypeFields);
    FilterBuilderHelper.bookmarkFilterBuilderMigration(state.advancedFilter);
    this.viewState = ObjectUtil.deleteEmptyProperties(state);
    // TODO purchase date from early bookmarks was saved somehow
    if (!this.timeSeries.some(x => x === this.viewState.series)) this.viewState.series = this.timeSeries[0];
    this.generateInventoryReport();
    this.setGridState();
  }
  public setGridState() {
    if (this.grid) this.grid.instance.state(this.viewState.grid);
  }
  public loadGridState() {
    return this.viewState.grid;
  }
  public saveGridState(gridState) {
    const gridStoringState = ObjectUtil.getDeepCopy(gridState);
    gridStoringState.selectedRowKeys = [];
    this.viewState = { ...this.viewState, grid: gridStoringState };
  }

  private setFilterFields(): void {
    this.filterFields.forEach(field => {
      switch (field.dataField) {
        case 'state':
          field.lookup.dataSource = this.productLotStates;
          break;
        case 'permission':
          field.lookup.dataSource = this.productLotPermissions;
          break;
        case 'owner':
          field.lookup.dataSource = this.companyMembers;
          break;
        case 'shipFrom':
          field.lookup.dataSource = this.companyFacilities;
          break;
      }
    });
  }

  public initViewState() {
    const state =
      this.bookmarkService.getLastSessionState(this.viewKey, new ViewState()) ||
      ObjectUtil.getDeepCopy(this.defaultState);
    // TODO purchase date from early bookmarks was saved somehow
    if (!this.timeSeries.some(x => x === state.series)) state.series = this.timeSeries[0];
    FilterBuilderHelper.bookmarkFilterBuilderMigration(state.advancedFilter);
    this.viewState = ObjectUtil.deleteEmptyProperties(state);
    FilterBuilderHelper.fixAdvancedFilterDateTypes(this.viewState.advancedFilter, dateTypeFields);
  }
}
