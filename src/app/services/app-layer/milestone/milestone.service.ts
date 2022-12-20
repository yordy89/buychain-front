import { Injectable } from '@angular/core';
import { Observable, of, ReplaySubject } from 'rxjs';
import { catchError, finalize, first, map } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { environment as config } from '@env/environment';
import { NotificationHelperService } from '@services/helpers/notification-helper/notification-helper.service';

export interface Attachment {
  checksum: string;
  company: string;
  createdAt: Date;
  updatedAt: Date;
  id: string;
  key: string;
  name: string;
  sizeKb: number;
  user: string;
}

@Injectable({ providedIn: 'root' })
export class MilestoneService {
  private documentsUrl = config.baseDocumentsUrl();

  private fetchingStatus$: ReplaySubject<boolean> = new ReplaySubject<boolean>(1);

  constructor(private notificationHelperService: NotificationHelperService, private http: HttpClient) {}

  /*
   * Fetch Status Controls
   */
  public isFetching(): Observable<boolean> {
    return this.fetchingStatus$.asObservable();
  }
  public fetchStart(): void {
    this.fetchingStatus$.next(true);
  }
  public fetchEnd(): void {
    this.fetchingStatus$.next(false);
  }

  public uploadDocument(file: File, prefix: string): Observable<Attachment> {
    if (
      !file.name.endsWith('jpg') &&
      !file.name.endsWith('png') &&
      !file.name.endsWith('jpeg') &&
      !file.name.endsWith('gif') &&
      !file.name.endsWith('pdf')
    ) {
      file = null;
      this.notificationHelperService.showValidation('Please make sure the file type is PNG, JPG, JPEG, GIF or PDF.');
      return of(null);
    }

    if (file.name.length > 100) {
      this.notificationHelperService.showValidation('The file name cannot exceed 100 characters.');
      return of(null);
    }

    this.fetchStart();
    const formData: FormData = new FormData();
    formData.append('name', file.name);
    formData.append('prefix', prefix);
    formData.append('document', file);

    return this.http.post(this.documentsUrl + '/documents', formData).pipe(
      first(),
      map(data => data as Attachment),
      catchError(({ error }) => {
        if (error?.status === 403) {
          this.notificationHelperService.showValidation('The company library has reached to the maximum size.');
        }
        throw error;
      }),
      finalize(() => this.fetchEnd())
    );
  }
  public getDocumentUrl(theKey: string): Observable<string> {
    this.fetchStart();

    return this.http.get(this.documentsUrl + '/documents/url', { params: { key: theKey } }).pipe(
      first(),
      map(data => data.toString()),
      finalize(() => this.fetchEnd())
    );
  }

  public getFileAsBlob(url: string) {
    return this.http.get(url, { responseType: 'blob', observe: 'response' }).pipe(map(response => response.body));
  }
}
