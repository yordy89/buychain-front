import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LocalStorageService {

  constructor() { }

  public get(key: string) {
    return localStorage.getItem(key);
  }

  public set(key: string, data: any) {
    if (typeof data === 'object' && data !== null) {
      localStorage.setItem(key, JSON.stringify(data));
    } else {
      localStorage.setItem(key, data);
    }
  }

  public remove(key) {
    localStorage.removeItem(key);
  }
}
