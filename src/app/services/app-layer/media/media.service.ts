import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, ReplaySubject } from 'rxjs';
import { finalize, first, map } from 'rxjs/operators';
import { environment as config } from '@env/environment';

export enum ImageResourceType {
  Profile = 'Profile Picture',
  Logo = 'Logo'
}

@Injectable({ providedIn: 'root' })
export class MediaService {
  private mediaUrl = config.baseMediaUrl();
  private fetchingStatus$: ReplaySubject<boolean> = new ReplaySubject<boolean>(1);

  constructor(private http: HttpClient) {}

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

  public uploadProfilePicture(file: File): Observable<any> {
    this.fetchStart();
    const formData: FormData = new FormData();
    formData.append('profilePicture', file);

    return this.http.put(this.mediaUrl + '/images/profile-picture', formData).pipe(
      first(),
      map(data => data),
      finalize(() => this.fetchEnd())
    );
  }

  public uploadLogo(file: File): Observable<any> {
    this.fetchStart();
    const formData: FormData = new FormData();
    formData.append('logo', file);

    return this.http.post(this.mediaUrl + '/images/logo', formData).pipe(
      first(),
      map(data => data),
      finalize(() => this.fetchEnd())
    );
  }
}
