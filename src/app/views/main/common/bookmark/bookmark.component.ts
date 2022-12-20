import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { BookmarkService } from '@services/app-layer/bookmark/bookmark.service';
import { NotificationHelperService } from '@services/helpers/notification-helper/notification-helper.service';
import { ObjectUtil } from '@services/helpers/utils/object-util';
import { TypeCheck } from '@services/helpers/utils/type-check';
import { EditBookmarksModalComponent } from '@views/main/common/bookmark/edit-bookmarks-modal/edit-bookmarks-modal.component';
import { Subject } from 'rxjs';
import { debounceTime, map, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-bookmark',
  templateUrl: './bookmark.component.html',
  styleUrls: ['./bookmark.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BookmarkComponent implements OnInit, OnDestroy, OnChanges {
  @Input() viewKey: string;
  @Input() currentState: any = {};
  @Input() defaultState: any = {};
  @Input() saveDisabled = false;
  @Output() stateChanged = new EventEmitter<any>();

  public savedBookmarks: Array<any>;
  public selected: any;
  public lastSessionState: any;

  public isStateChanged = false;

  public activeKey = '';
  public activeState: any = {};

  menuOpened = false;

  public get isAnyActive() {
    return !!this.activeKey;
  }

  public get isActiveModified() {
    return this.isAnyActive && this.isStateChanged;
  }

  private runDetectChanges = new Subject<void>();
  private lastStateSubject$ = new Subject();
  private sessionLastUnsavedState: any = {};
  private destroy$ = new Subject<void>();

  constructor(
    private notificationHelperService: NotificationHelperService,
    private bookmarkService: BookmarkService,
    private dialog: MatDialog,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.handleDetectChanges();
    this.loadBookmarks();
    this.loadLastSession();

    this.lastStateSubject$
      .pipe(
        debounceTime(5000),
        map(() => this.saveSessionLastState())
      )
      .subscribe();
  }

  ngOnDestroy() {
    this.saveSessionLastState();
    this.destroy$.next();
    this.destroy$.unsubscribe();
  }

  ngOnChanges({ currentState }: SimpleChanges) {
    if (currentState && currentState.currentValue) {
      this.runDetectChanges.next();
    }
  }

  public detectCurrentStateChange() {
    this.activeState = this.savedBookmarks.find(x => x.key === this.activeKey);
    const stateInUse = ObjectUtil.deleteEmptyProperties(
      this.activeState ? this.activeState.viewState : this.defaultState
    );
    const currentState = this.inventoryBookmarkWorkaround(ObjectUtil.deleteEmptyProperties(this.currentState));
    this.isStateChanged = !ObjectUtil.isDeepEquals(stateInUse, currentState);

    const lastUnsavedSessionState = ObjectUtil.deleteEmptyProperties(this.sessionLastUnsavedState);

    const isLastSessionSaved = ObjectUtil.isDeepEquals(currentState, lastUnsavedSessionState);
    if (!isLastSessionSaved) {
      this.sessionLastUnsavedState = ObjectUtil.getDeepCopy(currentState);
      this.lastStateSubject$.next(currentState);
    }
  }

  public onActivate(selected) {
    this.selected = selected;
    this.bookmarkService.onActivate(selected.name, this.viewKey).then(() => this.loadBookmarks());
    const viewState = { ...this.defaultState, ...selected.viewState }; // To fill the missing properties of old bookmarks
    this.stateChanged.emit(viewState);
  }

  public openEditBookmarksModal(): void {
    this.dialog
      .open(EditBookmarksModalComponent, {
        width: '648px',
        disableClose: true,
        data: {
          currentState: this.inventoryBookmarkWorkaround(this.currentState),
          viewKey: this.viewKey,
          savedBookmarks: this.savedBookmarks,
          saveDisabled: this.saveDisabled,
          activeKey: this.activeKey
        }
      })
      .afterClosed()
      .subscribe(bookmark => {
        if (bookmark) this.onActivate(bookmark);
        this.loadBookmarks();
      });
  }

  public resetToDefault() {
    if (this.activeKey) {
      this.bookmarkService.onActivate('', this.viewKey, true).then(() => this.loadBookmarks());
    }
    this.stateChanged.emit(ObjectUtil.getDeepCopy(this.defaultState));
    this.runDetectChanges.next();
  }

  public loadBookmarks() {
    this.savedBookmarks = this.bookmarkService
      .get(this.viewKey)
      .filter(b => TypeCheck.isObject(b) && b.key !== this.bookmarkService.bookmarkLastStateKey(this.viewKey));
    this.activeKey = this.bookmarkService.getActiveKey(this.viewKey);
    this.runDetectChanges.next();
  }

  public loadLastSession() {
    this.lastSessionState = this.bookmarkService.getLastSessionState(this.viewKey);
    this.sessionLastUnsavedState = this.lastSessionState;
    this.runDetectChanges.next();
  }

  private saveSessionLastState() {
    const state = this.inventoryBookmarkWorkaround(this.currentState);
    this.bookmarkService.saveSessionLastState(this.viewKey, state);
    this.lastSessionState = ObjectUtil.getDeepCopy(state);
    this.sessionLastUnsavedState = ObjectUtil.getDeepCopy(state);
    this.runDetectChanges.next();
  }

  private handleDetectChanges() {
    this.runDetectChanges
      .asObservable()
      .pipe(debounceTime(100), takeUntil(this.destroy$))
      .subscribe(() => {
        this.detectCurrentStateChange();
        this.cd.markForCheck();
      });
  }

  inventoryBookmarkWorkaround(viewState: any): any {
    if (this.viewKey !== 'inventory') return viewState;

    // filters out inventory grid not visible columns to decrease the size of payload;
    const state = ObjectUtil.getDeepCopy(viewState);
    if (state.grid?.columns) state.grid.columns = state.grid.columns.filter(c => c.visible);
    return state;
  }
}
