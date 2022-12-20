import { Injectable } from '@angular/core';
import crc16 from 'crc/crc16';
import { Environment } from '../app-layer.environment';
import { ObjectUtil } from '@app/services/helpers/utils/object-util';
import { UserService } from '@services/app-layer/user/user.service';
import { TypeCheck } from '@services/helpers/utils/type-check';

@Injectable({
  providedIn: 'root'
})
export class BookmarkService {
  constructor(private userService: UserService) {}

  public get(viewKey: string): Array<any> {
    const userPreferences = Environment.getCurrentUser().normalizedPreferences || null;
    if (!userPreferences) return [];
    const userViewKeyPreferences = userPreferences.bookmarks
      ? JSON.parse(JSON.stringify(userPreferences.bookmarks[viewKey] || {}))
      : {};
    return Object.keys(userViewKeyPreferences).map(key => userViewKeyPreferences[key]);
  }
  public getActiveKey(viewKey: string): string {
    const bookmarks = this.get(viewKey);
    const activeBookmark = bookmarks.find(item => TypeCheck.isString(item));
    return activeBookmark ? activeBookmark : '';
  }

  public getSessionState(viewKey: string, viewState = null, defaultState = null) {
    const data = this.getLastSessionState(viewKey, viewState);

    if (!data && defaultState) {
      return defaultState;
    }

    if (defaultState?.filters && data?.filters) {
      Object.keys(data.filters).forEach(key => {
        if (!(key in defaultState.filters)) {
          delete data.filters[key];
        }
      });
    }
    // To fill the missing properties of old viewState with default new properties.
    return { ...defaultState, ...data };
  }

  public getLastSessionState(viewKey: string, assignTo: any = null): any {
    const key = this.bookmarkLastStateKey(viewKey);
    const data = this.get(viewKey).find(item => item.key === key);
    let viewState = JSON.parse(JSON.stringify(data ? data.viewState : {}));

    delete viewState.grid?.focusedRowKey;

    if (assignTo) {
      viewState = ObjectUtil.deepAssign(assignTo, viewState);
    }
    this.updateLastRunDate(viewKey, viewState);
    return viewState;
  }

  public updateLastRunDate(viewKey, viewState): void {
    const foundInBookmarks = this.get(viewKey)
      .filter(item => TypeCheck.isObject(item) && !item.key.includes('lastState'))
      .find(item => ObjectUtil.isDeepEquals(item.viewState, viewState));
    if (foundInBookmarks) {
      foundInBookmarks.lastRunAt = new Date();
      this.userService.updateUserPreferences(foundInBookmarks.key, foundInBookmarks).subscribe();
    }
  }

  public async save(name: string, viewKey: string, viewState: any) {
    const key = this.bookmarkStorageKey(viewKey);
    await this.userService
      .updateUserPreferences(key, {
        key: key,
        name: name,
        viewState: viewState,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastRunAt: new Date(),
        version: Environment.currentVersion
      })
      .toPromise();
    await this.saveSessionLastState(viewKey, viewState);
    await this.sendActivateRequest(name, viewKey);
  }

  public async onActivate(name: string, viewKey: string, isReset?: boolean) {
    if (isReset) {
      await this.userService.updateUserPreferences(this.bookmarkActiveKey(viewKey), null).toPromise();
      return;
    }

    const found = await this.sendActivateRequest(name, viewKey);
    if (found) {
      found.lastRunAt = new Date();
      await this.userService.updateUserPreferences(found.key, found).toPromise();
    }
  }

  private async sendActivateRequest(name, viewKey) {
    const key = this.bookmarkActiveKey(viewKey);
    const data = this.get(viewKey);
    const found = data.find(x => x.name === name);

    if (!found) {
      return null;
    }

    if (found.key !== this.getActiveKey(viewKey)) {
      await this.userService.updateUserPreferences(key, found.key).toPromise();
      return found;
    }
  }

  public async saveSessionLastState(viewKey: string, viewState: any) {
    const key = this.bookmarkLastStateKey(viewKey);
    await this.userService.updateUserPreferences(key, { key, viewState }, true).toPromise();
  }

  public async delete(name: string, viewKey: string) {
    const viewBookmarks = this.get(viewKey);
    const found = viewBookmarks.find(x => x.name === name);
    if (found) {
      await this.userService.updateUserPreferences(found.key, null).toPromise();
    }
  }

  private bookmarkStorageKey(viewKey: string) {
    const crcKey = crc16(`bookmark-${viewKey}-${new Date().getTime()}`).toString(16);
    return `bookmarks-${viewKey}-${crcKey}`;
  }
  private bookmarkActiveKey(viewKey: string) {
    return `bookmarks-${viewKey}-activeKey`;
  }
  public bookmarkLastStateKey(viewKey: string) {
    return `bookmarks-${viewKey}-lastState`;
  }
}
