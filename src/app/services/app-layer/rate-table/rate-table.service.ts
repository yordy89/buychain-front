import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { first, map, mergeMap } from 'rxjs/operators';
import { TransportMethodType } from '@app/services/app-layer/entities/facility';
import { RateTable, RateTableComplete, RateTableItem } from '../entities/rate-table';
import { BaseApiService } from '@app/services/data-layer/http-api/base-api/base-api.service';

@Injectable({
  providedIn: 'root'
})
export class RateTableService {
  constructor(private baseApi: BaseApiService) {}

  public getCompanyRateTables(): Observable<RateTable[]> {
    return this.fetchCompanyRateTablesByOffset(0);
  }

  private fetchCompanyRateTablesByOffset(offset: number): Observable<RateTable[]> {
    return this.baseApi.rateTables.getRateTables(1000, offset).pipe(
      first(),
      mergeMap(async (data: any[]) => {
        if (data.length === 1000) {
          const chunk = await this.fetchCompanyRateTablesByOffset(offset + 1000).toPromise();
          data = data.concat(chunk);
        }
        return data.map(f => new RateTable().init(f));
      })
    );
  }

  public addRateTable(rateTable: any): Observable<RateTableComplete> {
    return this.baseApi.rateTables.addRateTable(rateTable).pipe(
      first(),
      map(dto => new RateTableComplete().init(dto))
    );
  }

  public updateRateTable(rateTableId: string, body): Observable<RateTableComplete> {
    return this.baseApi.rateTables.updateRateTable(rateTableId, body).pipe(
      first(),
      map(dto => new RateTableComplete().init(dto))
    );
  }

  public cloneRateTable(rateTableId: string): Observable<RateTableComplete> {
    return this.baseApi.rateTables.addRateTableClone(rateTableId).pipe(
      first(),
      map(dto => new RateTableComplete().init(dto))
    );
  }

  public deleteRateTable(rateTableId: string): Observable<any> {
    return this.baseApi.rateTables.deleteRateTable(rateTableId).pipe(first());
  }

  /*
   * Rate Table Entries
   * */
  public getCompanyRateTableEntries(rateTableId: string): Observable<RateTableItem[]> {
    return this.fetchCompanyRateTableEntriesByOffset(rateTableId, 0);
  }

  private fetchCompanyRateTableEntriesByOffset(rateTableId: string, offset: number): Observable<RateTableItem[]> {
    return this.baseApi.rateTables.getRateTableEntries(rateTableId, 1000, offset).pipe(
      first(),
      mergeMap(async (data: any[]) => {
        if (data.length === 1000) {
          const chunk = await this.fetchCompanyRateTableEntriesByOffset(rateTableId, offset + 1000).toPromise();
          data = data.concat(chunk);
        }
        return data.map(f => new RateTableItem().init(f));
      })
    );
  }

  public addRateTableEntry(rateTableId: string, body: RateTableItem): Observable<RateTableComplete> {
    return this.baseApi.rateTables.addRateTableEntry(rateTableId, this.normalizeToAPI(body)).pipe(
      first(),
      map(dto => new RateTableComplete().init(dto))
    );
  }

  public bulkAddRateTableEntries(rateTableId: string, body): Observable<any> {
    body.entries = body.entries.map(item => this.normalizeToAPI(item));

    return this.baseApi.rateTables.addRateTableEntriesBulk(rateTableId, body).pipe(
      first(),
      map(data => data.invalidEntries)
    );
  }

  public updateRateTableEntry(rateTableId: string, entryId: string, body): Observable<RateTableItem> {
    return this.baseApi.rateTables.updateRateTableEntry(rateTableId, entryId, body).pipe(
      first(),
      map(dto => new RateTableItem().init(dto))
    );
  }

  public deleteRateTableEntry(rateTableId: string, entryId: string): Observable<void> {
    return this.baseApi.rateTables.deleteRateTableEntry(rateTableId, entryId).pipe(first());
  }

  /*
   * private helpers
   * */
  private normalizeToAPI(entry: any): any {
    return {
      destinationShortName: entry.destinationShortName,
      destinationDescription: entry.destinationDescription || undefined,
      destinationCity: entry.destinationCity,
      destinationState: entry.destinationState,
      destinationCountry: entry.destinationCountry,
      cost: entry.cost,
      transportMethod: this.normalizeTransportMethod(entry),
      capacity: entry.capacity,
      uom: entry.uom
    };
  }

  private normalizeTransportMethod(entry): any {
    return !entry.transportMethod
      ? undefined
      : entry.transportMethod.type === TransportMethodType.Rail
      ? {
          type: entry.transportMethod.type,
          carrier: entry.transportMethod.carrier,
          railRestriction: entry.transportMethod.railRestriction
        }
      : {
          type: entry.transportMethod.type
        };
  }
}
