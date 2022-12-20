import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SessionStorageService {

  constructor() { }

  public get(key: string) {
    return sessionStorage.getItem(key);
  }

  public set(key: string, data: any) {
    sessionStorage.setItem(key, JSON.stringify(data));
  }

  public remove(key) {
    sessionStorage.removeItem(key);
  }
}
