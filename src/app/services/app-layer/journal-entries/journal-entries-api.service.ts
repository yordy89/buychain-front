import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AccountingJournalStateEnum } from '@services/app-layer/app-layer.enums';
import { JournalEntryEntity } from '@services/app-layer/entities/journal-entries';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment as config } from '@env/environment';
import { AccountingAttachment } from '@services/app-layer/accounting-attachments/accounting-attachments.service';

@Injectable({
  providedIn: 'root'
})
export class JournalEntriesApiService {
  private accountingUrl = config.baseAccountingUrl();

  constructor(private httpClient: HttpClient) {}

  getJournalEntry(entryId: string): Observable<JournalEntryEntity> {
    return this.httpClient
      .get(`${this.accountingUrl}/journal-entries/${entryId}`)
      .pipe(map(data => new JournalEntryEntity().init(data)));
  }

  addJournalEntry(payload): Observable<JournalEntryEntity> {
    return this.httpClient
      .post(`${this.accountingUrl}/journal-entries`, payload)
      .pipe(map(data => new JournalEntryEntity().init(data)));
  }

  editJournalEntry(id: string, payload): Observable<JournalEntryEntity> {
    return this.httpClient
      .patch(`${this.accountingUrl}/journal-entries/${id}`, payload)
      .pipe(map(data => new JournalEntryEntity().init(data)));
  }

  editJournalEntryLines(id: string, payload): Observable<JournalEntryEntity> {
    return this.httpClient
      .put(`${this.accountingUrl}/journal-entries/${id}/lines`, payload)
      .pipe(map(data => new JournalEntryEntity().init(data)));
  }

  deleteJournalEntry(entryId: string): Observable<any> {
    return this.httpClient.delete<any>(`${this.accountingUrl}/journal-entries/${entryId}`);
  }

  approveJournalEntry(id: string): Observable<JournalEntryEntity> {
    return this.httpClient
      .put(`${this.accountingUrl}/journal-entries/${id}/state`, { state: AccountingJournalStateEnum.APPROVED })
      .pipe(map(data => new JournalEntryEntity().init(data)));
  }

  addJournalEntryAttachments(
    entryId: string,
    payload: { attachments: AccountingAttachment[] }
  ): Observable<JournalEntryEntity> {
    return this.httpClient
      .post(`${this.accountingUrl}/journal-entries/${entryId}/attachments`, payload)
      .pipe(map(data => new JournalEntryEntity().init(data)));
  }

  deleteJournalEntryAttachment(entryId: string, attachmentId: string): Observable<any> {
    return this.httpClient.delete<any>(`${this.accountingUrl}/journal-entries/${entryId}/attachments/${attachmentId}`);
  }
}
