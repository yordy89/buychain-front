import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export enum DataSourceEnum {
  MOCK = 'MOCK',
  REAL = 'REAL'
}

@Injectable({
  providedIn: 'root'
})
export class DashboardStateService {
  dataSource: DataSourceEnum = DataSourceEnum.REAL;
  dataSource$: Observable<DataSourceEnum>;

  private dataSourceSubj = new BehaviorSubject(this.dataSource);

  constructor() {
    this.dataSource$ = this.dataSourceSubj.asObservable();
  }

  setDataSource(source: DataSourceEnum) {
    this.dataSource = source;
    this.dataSourceSubj.next(source);
  }
}
