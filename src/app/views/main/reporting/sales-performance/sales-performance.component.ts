import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TransactionEntity } from '@services/app-layer/entities/transaction';
import { CrmService } from '@services/app-layer/crm/crm.service';
import { GridHelperService } from '@services/helpers/grid-helper/grid-helper.service';
import { TransformHelper } from '@services/helpers/utils/transform-helper';
import { ReportingService } from '@views/main/reporting/reporting.service';
import { subMonths } from 'date-fns';
import { combineLatest, Subject } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import {
  SalesFiguresOfMeritEnum,
  SalesTimeSeriesEnum,
  TransactionStateEnum
} from '@services/app-layer/app-layer.enums';
import { SalesPerformanceService } from '@services/app-layer/sales-performance/sales-performance.service';
import { DxDataGridComponent } from 'devextreme-angular';
import { ObjectUtil } from '@services/helpers/utils/object-util';
import { BookmarkService } from '@services/app-layer/bookmark/bookmark.service';
import { SearchService } from '@services/app-layer/search/search.service';
import { MemberEntity } from '@services/app-layer/entities/member';
import { CrmContactEntity } from '@services/app-layer/entities/crm';
import { SalesPerformanceChartEntity } from '@services/app-layer/entities/sales-performance-chart';
import { FilterBuilderHelper } from '@services/helpers/utils/filter-builder-helper';
import { FacilityEntity, TransportMethodType } from '@services/app-layer/entities/facility';

enum ChartTypesEnum {
  bar = 'Bar',
  line = 'Line',
  area = 'Area'
}

const date = subMonths(new Date(), 1);
const dateTypeFields = ['quoteDate', 'reviewDate', 'confirmedDate', 'inTransitDate', 'completeDate'];

class ViewState {
  public advancedFilter = ['quoteDate', '>=', date];
  public state = TransactionStateEnum.Confirmed;
  public series = SalesTimeSeriesEnum.Daily;
  public chartDetails = {
    type: 'bar',
    figureOfMerit: 'numberOfTransactions'
  };
  public grid = null;
  public easyAccess = false;
}

@Component({
  selector: 'app-sales-performance',
  templateUrl: './sales-performance.component.html',
  styleUrls: ['../common/reports.common.scss', './sales-performance.component.scss']
})
export class SalesPerformanceComponent implements OnInit, OnDestroy {
  @ViewChild('txsPerformanceGrid', { static: false }) txsPerformanceGrid: DxDataGridComponent;
  companyMembers: MemberEntity[] = [];
  companyFacilities: FacilityEntity[] = [];

  private transactionsCompleteList: TransactionEntity[] = [];
  public normalizedChartData: SalesPerformanceChartEntity[];

  public companyCustomers: CrmContactEntity[];

  public visualRange: any = {};

  public transactionStates = ObjectUtil.enumToKeyValueArray(TransactionStateEnum)
    .map(({ value }) => ({ displayValue: TransformHelper.stringUnderscoreToSpaceTitleCase(value), value: value }))
    .filter(s => !(s.value === TransactionStateEnum.Canceled || s.value === TransactionStateEnum.ChangePending));
  public transportMethods = ObjectUtil.enumToKeyValueArray(TransportMethodType).map(({ value }) => ({
    displayValue: TransformHelper.stringUnderscoreToSpaceTitleCase(value),
    value: value
  }));
  public chartTypes = ObjectUtil.enumToKeyValueArray(ChartTypesEnum);
  public figuresOfMerit = ObjectUtil.enumToKeyValueArray(SalesFiguresOfMeritEnum);
  public timeSeries = ObjectUtil.enumToArray(SalesTimeSeriesEnum);
  public filterFields: any;

  public viewKey = 'salesPerformance';
  public viewState: ViewState;
  public defaultState = new ViewState();

  public loaded = false;
  public rangeSelectorVisible = false;

  private destroy$ = new Subject<void>();

  constructor(
    private crmService: CrmService,
    public salesPerformanceService: SalesPerformanceService,
    private searchService: SearchService,
    private bookmarkService: BookmarkService,
    private gridHelperService: GridHelperService,
    private reportingService: ReportingService,
    private router: Router,
    private route: ActivatedRoute,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.companyMembers = this.reportingService.companyMembers;
    this.companyFacilities = this.reportingService.companyFacilities;
    this.saveGridState = this.saveGridState.bind(this);
    this.loadGridState = this.loadGridState.bind(this);
    this.filterFields = this.salesPerformanceService.filterFields;
    this.initViewState();
    this.loadFilterFields();

    if (this.route.snapshot.queryParamMap.get('load') === 'true') {
      this.filterTransactions();
      this.router.navigate([], { queryParams: null });
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  public initializeRangeSelector(): void {
    // range selector size issue
    this.rangeSelectorVisible = true;
    this.cd.detectChanges();
  }

  onExporting(e) {
    this.gridHelperService.exportToExcel(e, 'SalesPerformance');
  }

  public onStateChanged(e) {
    this.viewState.state = e.value;
    this.visualRange = {};
    this.generateNormalizedData(
      this.salesPerformanceService.filterTransactionsByState(this.transactionsCompleteList, this.viewState.state)
    );
  }

  // TODO customize archived facility styles

  filterTransactions() {
    this.normalizedChartData = [];
    this.loadTxsAndNormalizeForChart();
  }

  public onTimePeriodChanged() {
    if (this.isUserBasedData) this.viewState.chartDetails.type = 'bar';
    this.visualRange = {};
    this.generateNormalizedData(
      this.salesPerformanceService.filterTransactionsByState(this.transactionsCompleteList, this.viewState.state)
    );
  }

  customizeLabel(arg) {
    return arg.value ? Math.round(arg.value * 100) / 100 : '';
  }

  public onToolbarPreparing(e) {
    this.gridHelperService.prepareToolbarCollapseExpand(e, () => this.txsPerformanceGrid);
  }

  public onViewStateChanged(viewState: ViewState) {
    this.viewState = viewState;
    FilterBuilderHelper.fixAdvancedFilterDateTypes(this.viewState.advancedFilter, dateTypeFields);
    this.loadTxsAndNormalizeForChart();
    this.setGridState();
  }
  public setGridState() {
    if (this.txsPerformanceGrid) this.txsPerformanceGrid.instance.state(this.viewState.grid);
  }
  public loadGridState() {
    return this.viewState.grid;
  }
  public saveGridState(gridState) {
    const gridStoringState = ObjectUtil.getDeepCopy(gridState);
    gridStoringState.selectedRowKeys = [];
    this.viewState = { ...this.viewState, grid: gridStoringState };
  }

  get isUserBasedData(): boolean {
    return this.salesPerformanceService.userBasedSeries.includes(this.viewState.series);
  }

  get seriesCaption(): string {
    if (!this.isUserBasedData) return 'Time';
    return this.salesPerformanceService.isCustomerSeries(this.viewState.series) ? 'Customer' : 'User';
  }

  /*
   * private helpers
   * */

  private loadTxsAndNormalizeForChart(): void {
    this.loadTransactionsByFilter().then(() => {
      this.generateNormalizedData(
        this.salesPerformanceService.filterTransactionsByState(this.transactionsCompleteList, this.viewState.state)
      );
    });
  }

  private async loadTransactionsByFilter() {
    const payload = this.salesPerformanceService.normalizeTransactionSearchPayload(
      this.viewState.advancedFilter,
      dateTypeFields
    );
    this.transactionsCompleteList = await this.searchService
      .fetchTransactionData(payload)
      .pipe(map(transactions => transactions.map(t => new TransactionEntity().init(t))))
      .toPromise();
  }

  private generateNormalizedData(txs) {
    let users;
    if (this.isUserBasedData) {
      users = this.salesPerformanceService.isCustomerSeries(this.viewState.series)
        ? this.companyCustomers
        : this.companyMembers;
    }
    this.normalizedChartData = this.salesPerformanceService.generateNormalizedData(
      txs,
      this.viewState.state,
      this.viewState.series,
      users
    );
    if (!this.salesPerformanceService.uniquePriceSystem && this.viewState.chartDetails.figureOfMerit === 'volume') {
      this.viewState.chartDetails.figureOfMerit = 'numberOfTransactions';
    }
  }

  private loadFilterFields() {
    combineLatest([this.crmService.getAccounts(), this.crmService.getContacts(), this.crmService.getLocations()])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([accounts, contacts, locations]) => {
        this.companyCustomers = contacts;
        this.filterFields.forEach(field => {
          switch (field.dataField) {
            case 'state':
              field.lookup.dataSource = this.transactionStates;
              break;
            case 'customerCrm':
              field.lookup.dataSource = accounts;
              break;
            case 'shipToCrm':
              field.lookup.dataSource = locations;
              break;
            case 'buyerCrm':
              field.lookup.dataSource = this.companyCustomers;
              break;
            case 'sellerOnline':
              field.lookup.dataSource = this.companyMembers;
              break;
            case 'shipFromOnline':
              field.lookup.dataSource = this.companyFacilities;
              break;
            case 'transportMethodType':
              field.lookup.dataSource = this.transportMethods;
              break;
          }
        });
        this.loaded = true;
      });
  }

  public initViewState() {
    this.viewState =
      this.bookmarkService.getLastSessionState(this.viewKey, new ViewState()) ||
      ObjectUtil.getDeepCopy(this.defaultState);
    FilterBuilderHelper.fixAdvancedFilterDateTypes(this.viewState.advancedFilter, dateTypeFields);
  }
}
