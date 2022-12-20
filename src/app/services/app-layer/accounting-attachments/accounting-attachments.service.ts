import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment as config } from '@env/environment';
import { Observable, ReplaySubject, map, forkJoin, of } from 'rxjs';
import { catchError, finalize, first } from 'rxjs/operators';
import { NotificationHelperService } from '@services/helpers/notification-helper/notification-helper.service';
import { TypeCheck } from '@services/helpers/utils/type-check';

export const supportedExtensions = ['jpg', 'png', 'jpeg', 'gif', 'pdf'];

export interface AccountingAttachment {
  checksum: string;
  company: string;
  createdAt?: Date;
  updatedAt?: Date;
  _createdAt: Date;
  _updatedAt: Date;
  id?: string;
  key: string;
  name: string;
  sizeKb: number;
  user: string;
}

@Injectable({
  providedIn: 'root'
})
export class AccountingAttachmentsService {
  private attachmentUrl = config.baseAccountingAttachmentsUrl();

  private fetchingStatus$: ReplaySubject<boolean> = new ReplaySubject<boolean>(1);

  constructor(private httpClient: HttpClient, private notificationHelperService: NotificationHelperService) {}

  public fetchStart(): void {
    this.fetchingStatus$.next(true);
  }
  public fetchEnd(): void {
    this.fetchingStatus$.next(false);
  }

  public uploadFile(file: File, prefix: string): Observable<AccountingAttachment> {
    if (!TypeCheck.hasSupportedExtension(file, supportedExtensions)) {
      file = null;
      const fileTypes = supportedExtensions.map(ext => ext.slice(0).toUpperCase()).join(', ');
      const message = `Please make sure the file type is one of ${fileTypes}.`;
      this.notificationHelperService.showValidation(message);
      throw new Error(message);
    }

    this.fetchStart();
    const formData: FormData = new FormData();
    formData.append('name', file.name);
    formData.append('s3KeyPrefix', prefix);
    formData.append('accountingAttachment', file);

    return this.httpClient.post(`${this.attachmentUrl}/accounting-attachments`, formData).pipe(
      first(),
      map(data => data as AccountingAttachment),
      catchError(({ error }) => {
        if (error?.status === 403) {
          this.notificationHelperService.showValidation('The company library has reached to the maximum size.');
        }
        throw error;
      }),
      finalize(() => this.fetchEnd())
    );
  }

  public uploadFiles(files: File[], prefix: string): Observable<AccountingAttachment[]> {
    if (files?.length) {
      return forkJoin(
        files.map(file => {
          if (file.size / 1024 > 2048) {
            this.notificationHelperService.showValidation('The selected file size should not exceed 2 Mb.');
            return;
          }
          return this.uploadFile(file, prefix);
        })
      );
    }

    return of([]);
  }

  public removeFile(id: string): Observable<any> {
    this.fetchStart();

    return this.httpClient.delete(`${this.attachmentUrl}/accounting-attachments/${id}`).pipe(
      first(),
      finalize(() => this.fetchEnd())
    );
  }

  public getFileUrl(fileKey: string): Observable<string> {
    this.fetchStart();

    return this.httpClient.get(`${this.attachmentUrl}/accounting-attachments/url`, { params: { key: fileKey } }).pipe(
      first(),
      map(data => data.toString()),
      finalize(() => this.fetchEnd())
    );
  }
}
