import { Injectable } from '@angular/core';
import { Observable, ReplaySubject } from 'rxjs';
import { first, map, switchMap, tap } from 'rxjs/operators';
import { BaseApiService } from '@app/services/data-layer/http-api/base-api/base-api.service';
import { LabelSet } from '../app-layer.enums';
import { LabelGroups, LabelEntity } from '../entities/label';

@Injectable({
  providedIn: 'root'
})
export class LabelsService {
  labels$: ReplaySubject<LabelGroups>;

  constructor(private baseApi: BaseApiService) {}

  public getCompanyLabels(): Observable<LabelGroups> {
    if (!this.labels$) {
      return this.fetchCompanyLabels();
    }

    return this.labels$.asObservable();
  }

  public fetchCompanyLabels(): Observable<LabelGroups> {
    this.labels$ = this.labels$ || new ReplaySubject<LabelGroups>(1);
    const limit = 1000; // we limited the user to create 100 labels for each (6) section. (total 600 labels is max)
    const offset = 0;
    return this.baseApi.labels.getLabels(limit, offset).pipe(
      first(),
      map((data: LabelEntity[]) => {
        return {
          accountIndustryTags: data.filter(label => label.labelSet === LabelSet.AccountIndustryType),
          accountCategoryTags: data.filter(label => label.labelSet === LabelSet.AccountCategoryTag),
          accountTags: data.filter(label => label.labelSet === LabelSet.AccountTag),
          locationTags: data.filter(label => label.labelSet === LabelSet.LocationTag),
          contactRoleTags: data.filter(label => label.labelSet === LabelSet.ContactRoleTag),
          contactTags: data.filter(label => label.labelSet === LabelSet.ContactTag)
        };
      }),
      tap(data => this.setCompanyLabels(data)),
      switchMap(() => this.labels$.asObservable())
    );
  }

  public setCompanyLabels(data: LabelGroups): void {
    this.labels$.next(data);
  }

  public addLabel(labelData: any): Observable<LabelEntity> {
    return this.baseApi.labels.addLabel(labelData).pipe(
      first(),
      map(data => new LabelEntity().init(data))
    );
  }

  public updateLabel(labelId: string, labelData: any): Observable<LabelEntity> {
    return this.baseApi.labels.updateLabel(labelId, labelData).pipe(
      first(),
      map(data => new LabelEntity().init(data))
    );
  }

  public deleteLabel(labelId: string): Observable<void> {
    return this.baseApi.labels.deleteLabel(labelId).pipe(first());
  }
}
