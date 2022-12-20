import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { DimensionEntity } from '@services/app-layer/entities/dimension';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { CustomHttpUrlEncodingCodec } from '@services/data-layer/http-api/base-api/swagger-gen/encoder';
import { environment as config } from '@env/environment';
import { NotificationHelperService } from '@services/helpers/notification-helper/notification-helper.service';

@Injectable({
  providedIn: 'root'
})
export class DimensionsService {
  private accountingUrl = config.baseAccountingUrl();

  constructor(private notificationHelperService: NotificationHelperService, private httpClient: HttpClient) {}

  getDimensions(limit: number, offset: number): Observable<DimensionEntity[]> {
    let queryParameters = new HttpParams({ encoder: new CustomHttpUrlEncodingCodec() });
    queryParameters = queryParameters.set('limit', <any>limit);
    queryParameters = queryParameters.set('offset', <any>offset);

    return this.httpClient.get<any>(`${this.accountingUrl}/dimensions`, { params: queryParameters }).pipe(
      map(dimensions => {
        return dimensions.map(c => new DimensionEntity().init(c)).sort((a, b) => a.name.localeCompare(b.name));
      })
    );
  }

  addDimension(payload: any): Observable<DimensionEntity> {
    return this.httpClient.post<any>(`${this.accountingUrl}/dimensions`, payload).pipe(
      map(data => new DimensionEntity().init(data)),
      catchError(error => this.handleErrorResponse(error))
    );
  }

  editDimension(dimension: DimensionEntity, payload: any): Observable<any> {
    return this.httpClient.patch<any>(`${this.accountingUrl}/dimensions/${dimension.id}`, payload).pipe(
      map(data => new DimensionEntity().init(data)),
      catchError(error => this.handleErrorResponse(error))
    );
  }

  deleteDimension(dimensionId: string): Observable<any> {
    return this.httpClient.delete<any>(`${this.accountingUrl}/dimensions/${dimensionId}`);
  }

  private handleErrorResponse({ error }) {
    if (error.status === 400 && (error.message === 'ID must be unique' || error.message === 'Duplicate entry.')) {
      this.notificationHelperService.showValidation(
        'The specified name is already in use. Please specify a different name.'
      );
    }
    return throwError(() => error);
  }
}
