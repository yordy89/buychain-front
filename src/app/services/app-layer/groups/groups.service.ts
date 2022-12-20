import { Injectable } from '@angular/core';
import { BaseApiService } from '@services/data-layer/http-api/base-api/base-api.service';
import { Observable, throwError } from 'rxjs';
import { catchError, first, map } from 'rxjs/operators';
import { AccountingInfoEntity, GroupEntity } from '@services/app-layer/entities/group';
import { NotificationHelperService } from '@services/helpers/notification-helper/notification-helper.service';

@Injectable({
  providedIn: 'root'
})
export class GroupsService {
  constructor(private notificationHelperService: NotificationHelperService, private baseApi: BaseApiService) {}

  public getCompanyGroups(): Observable<GroupEntity[]> {
    return this.baseApi.groups.getGroups().pipe(
      first(),
      map(groups => groups.map(g => new GroupEntity().init(g)))
    );
  }

  public getGroupById(id: string): Observable<GroupEntity> {
    return this.baseApi.groups.getGroup(id).pipe(
      first(),
      map(group => (group ? new GroupEntity().init(group) : null))
    );
  }

  public createGroup(payload: any): Observable<GroupEntity> {
    return this.baseApi.groups.addGroup(payload).pipe(
      first(),
      catchError(error => this.handleErrorResponse(error)),
      map(groupData => new GroupEntity().init(groupData))
    );
  }

  public updateGroup(group: GroupEntity, payload): Observable<GroupEntity> {
    return this.baseApi.groups.updateGroup(group.id, payload).pipe(
      first(),
      catchError(error => this.handleErrorResponse(error)),
      map(data => new GroupEntity().init(data))
    );
  }

  public deleteGroup(groupId): Observable<any> {
    return this.baseApi.groups.deleteGroup(groupId).pipe(first());
  }

  public updateGroupAccountingInfo(group: GroupEntity, payload): Observable<any> {
    return this.baseApi.groups.updateGroupAccountingInfo(group.id, payload).pipe(
      first(),
      map(data => new AccountingInfoEntity().init(data))
    );
  }

  private handleErrorResponse({ error }) {
    if (error.status === 400 && (error.message === 'ID must be unique' || error.message === 'Duplicate entry.')) {
      this.notificationHelperService.showValidation(
        'The specified name is already in use, either in an active or an archived group. Please specify a different name.'
      );
    }
    return throwError(() => error);
  }
}
