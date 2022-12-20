import { Component, EventEmitter, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Environment } from '@services/app-layer/app-layer.environment';
import { BookmarkService } from '@services/app-layer/bookmark/bookmark.service';
import { UserService } from '@services/app-layer/user/user.service';
import { MatMenuTrigger } from '@angular/material/menu';
import { ObjectUtil } from '@services/helpers/utils/object-util';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

enum ReportTypeEnum {
  SalesPerformance = 'Sales Performance',
  InventoryPerformance = 'Inventory Performance',
  InventoryAudit = 'Inventory Audit'
}

@Component({
  selector: 'app-my-reports',
  templateUrl: './my-reports.component.html',
  styleUrls: ['./my-reports.component.scss']
})
export class MyReportsComponent implements OnInit, OnDestroy {
  @ViewChild('menuTrigger') menuTrigger: MatMenuTrigger;

  @Output() bookmarkSelected = new EventEmitter<any>();

  public ReportTypeEnum = ObjectUtil.enumToArray(ReportTypeEnum);
  public selectedType = null;
  public selectedBookmark = null;
  public bookmarkSelectionEntries = [];

  public salesPerformanceBookmarks: any[] = [];
  public inventoryPerformanceBookmarks: any[] = [];
  public inventoryAuditBookmarks: any[] = [];
  public easyAccessBookmarksList: any[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    private userService: UserService,
    private bookmarkService: BookmarkService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.initializeBookmarks();
    this.getEasyAccessBookmarksList();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.unsubscribe();
  }

  public initializeBookmarks(): void {
    const bookmarks = Environment.getCurrentUser().normalizedPreferences.bookmarks;
    if (!bookmarks) return;
    bookmarks.salesPerformance = bookmarks.salesPerformance || {};
    this.salesPerformanceBookmarks = Object.keys(bookmarks.salesPerformance)
      .filter(key => key !== 'lastState' && key !== 'activeKey')
      .map(key => bookmarks.salesPerformance[key]);
    bookmarks.inventoryPerformance = bookmarks.inventoryPerformance || {};
    this.inventoryPerformanceBookmarks = Object.keys(bookmarks.inventoryPerformance)
      .filter(key => key !== 'lastState' && key !== 'activeKey')
      .map(key => bookmarks.inventoryPerformance[key]);
    bookmarks.inventoryAudit = bookmarks.inventoryAudit || {};
    this.inventoryAuditBookmarks = Object.keys(bookmarks.inventoryAudit)
      .filter(key => key !== 'lastState' && key !== 'activeKey')
      .map(key => bookmarks.inventoryAudit[key]);
  }

  public getEasyAccessBookmarksList(): void {
    this.easyAccessBookmarksList = [
      ...this.salesPerformanceBookmarks
        .filter(item => item.viewState.easyAccess)
        .map(item => ({
          description: item.name,
          type: 'Sales Performance',
          lastRunDate: `${new Date(item.lastRunAt).getMonth()}/${new Date(item.lastRunAt).getDate()}/${new Date(
            item.lastRunAt
          ).getFullYear()}`,
          lastRunTime: `${new Date(item.lastRunAt).toTimeString().split(' ')[0]}`,
          value: item
        })),
      ...this.inventoryPerformanceBookmarks
        .filter(item => item.viewState.easyAccess)
        .map(item => ({
          description: item.name,
          type: 'Inventory Performance',
          lastRunDate: `${new Date(item.lastRunAt).getMonth()}/${new Date(item.lastRunAt).getDate()}/${new Date(
            item.lastRunAt
          ).getFullYear()}`,
          lastRunTime: `${new Date(item.lastRunAt).toTimeString().split(' ')[0]}`,
          value: item
        })),
      ...this.inventoryAuditBookmarks
        .filter(item => item.viewState.easyAccess)
        .map(item => ({
          description: item.name,
          type: 'Inventory Audit',
          lastRunDate: `${new Date(item.lastRunAt).getMonth()}/${new Date(item.lastRunAt).getDate()}/${new Date(
            item.lastRunAt
          ).getFullYear()}`,
          lastRunTime: `${new Date(item.lastRunAt).toTimeString().split(' ')[0]}`,
          value: item
        }))
    ];
  }

  public onReportTypeSelection(): void {
    switch (this.selectedType) {
      case ReportTypeEnum.SalesPerformance:
        this.bookmarkSelectionEntries = this.salesPerformanceBookmarks.filter(item => !item.viewState.easyAccess);
        break;
      case ReportTypeEnum.InventoryPerformance:
        this.bookmarkSelectionEntries = this.inventoryPerformanceBookmarks.filter(item => !item.viewState.easyAccess);
        break;
      case ReportTypeEnum.InventoryAudit:
        this.bookmarkSelectionEntries = this.inventoryAuditBookmarks.filter(item => !item.viewState.easyAccess);
        break;
      default:
        this.bookmarkSelectionEntries = [];
        this.selectedBookmark = null;
    }
  }

  public onBookmarkSelection(): void {
    this.selectedBookmark.viewState.easyAccess = true;
    this.userService
      .updateUserPreferences(this.selectedBookmark.key, this.selectedBookmark)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.getEasyAccessBookmarksList();
        this.selectedType = null;
        this.selectedBookmark = null;
        this.menuTrigger.closeMenu();
      });
  }

  async onEasyAccessBookmarkRun(bookmark) {
    await this.bookmarkService.onActivate(bookmark.name, this.getBookmarkViewKey(bookmark.key));
    await this.bookmarkService.saveSessionLastState(this.getBookmarkViewKey(bookmark.key), bookmark.viewState);
    this.navigateToTab(bookmark);
  }

  navigateToTab(bookmark): void {
    switch (this.getBookmarkViewKey(bookmark.key)) {
      case 'salesPerformance':
        this.navigate('../sales-performance');
        break;
      case 'inventoryPerformance':
        this.navigate('../inventory-performance');
        break;
      case 'inventoryAudit':
        this.navigate('../inventory-audit');
        break;
    }
  }

  private navigate(command: string) {
    this.router.navigate([command], {
      relativeTo: this.route,
      queryParams: {
        load: true
      }
    });
  }

  getBookmarkViewKey(bookmarkKey: string): string {
    const viewKey = bookmarkKey.substring(bookmarkKey.indexOf('-') + 1);
    return viewKey.substring(0, viewKey.indexOf('-'));
  }

  public onEasyAccessBookmarkDelete(bookmark): void {
    bookmark.viewState.easyAccess = false;
    this.userService
      .updateUserPreferences(bookmark.key, bookmark)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.getEasyAccessBookmarksList());
  }
}
