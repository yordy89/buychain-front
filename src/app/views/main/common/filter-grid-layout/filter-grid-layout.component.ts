import { BreakpointObserver } from '@angular/cdk/layout';
import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  Input,
  ChangeDetectorRef,
  HostBinding,
  Output,
  EventEmitter,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  ContentChild
} from '@angular/core';
import { DxDataGridComponent } from 'devextreme-angular';
import { Subject } from 'rxjs';
import { switchMap, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-filter-grid-layout',
  templateUrl: './filter-grid-layout.component.html',
  styleUrls: ['./filter-grid-layout.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FilterGridLayoutComponent implements OnInit, OnDestroy, OnChanges {
  @Input() header = '';
  @Input() filterPanelMode: 'alwaysVisible' | 'autoHide' = 'autoHide';
  @Input() autoHideMaxWidth = 1366;
  @Input() closeFilterOnSubmit = true;
  @Input() isFilterPanelOpened = true;
  @Input() filtersCount = 0;
  @Input() showSidebar = true;
  @Output() resetChange = new EventEmitter<void>();
  @ContentChild(DxDataGridComponent)
  set grid(grid: DxDataGridComponent) {
    if (!this.grid) {
      this._grid = grid;
    }
  }
  get grid() {
    return this._grid;
  }

  @HostBinding('class.filter-grid-layout') readonly show = true;

  private destroy$ = new Subject<void>();
  private runReevaluateSubj = new Subject<void>();
  private _grid: DxDataGridComponent;

  constructor(private cd: ChangeDetectorRef, private breakpointObserver: BreakpointObserver) {}

  ngOnInit(): void {
    this.handleFilterState();
  }

  ngOnChanges({ autoHideMaxWidth, filterPanelMode }: SimpleChanges) {
    if (autoHideMaxWidth && autoHideMaxWidth.currentValue) {
      this.runReevaluateSubj.next();
    }

    if (filterPanelMode && filterPanelMode.currentValue) {
      this.runReevaluateSubj.next();
    }
  }

  onOpenChanged() {
    this.grid?.instance.updateDimensions();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleFilterPanel() {
    this.isFilterPanelOpened = !this.isFilterPanelOpened;
    this.cd.detectChanges();
  }

  onReset() {
    this.resetChange.emit();
  }

  private handleFilterState() {
    this.runReevaluateSubj
      .asObservable()
      .pipe(
        switchMap(() => this.breakpointObserver.observe(this.getMediaParam())),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.reevaluateFilterState();
      });

    this.runReevaluateSubj.next();
  }

  private getMediaParam() {
    return `(min-width: ${this.autoHideMaxWidth + 1}px)`;
  }

  private reevaluateFilterState() {
    const newState = this.calcFilterAutoHideState();
    this.setFilterState(newState);
  }

  private setFilterState(isOpened: boolean) {
    if (this.isFilterPanelOpened !== isOpened) {
      this.isFilterPanelOpened = isOpened;
      this.cd.markForCheck();
    }
  }

  private calcFilterAutoHideState(): boolean {
    if (this.filterPanelMode === 'alwaysVisible') {
      return true;
    }
    return this.breakpointObserver.isMatched(this.getMediaParam());
  }
}
