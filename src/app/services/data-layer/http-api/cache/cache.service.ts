import { Injectable } from '@angular/core';
import { CacheItem } from './cache-item';

@Injectable({
  providedIn: 'root'
})
export class CacheService {
  private storage = new Map<string, CacheItem>();
  private ttl = 120; // ToDo: read from configuration

  constructor() {
    setInterval(() => this.deleteExpired(), 1000);
  }

  public get(key) {
    if (this.storage.has(key)) {
      return this.storage.get(key).data;
    } else {
      return null;
    }
  }

  public put(key, value) {
    const cacheItem = new CacheItem(value);
    this.storage.set(key, cacheItem);
  }

  public delete(key) {
    this.storage.delete(key);
  }

  public purge() {
    this.storage.clear();
  }

  public count() {
    return this.storage.size;
  }

  public markAsExpired(key: string) {
    const item = this.storage.get(key);
    if (!item) throw Error('Item not found');

    item.createdAt = new Date(1700, 1, 1);
  }

  public getExpired() {
    const expiredKeys = [];

    this.storage.forEach((item, key) => {
      if ((new Date().getTime() - item.createdAt.getTime()) / 1000 > this.ttl) {
        expiredKeys.push(key);
      }
    });

    return expiredKeys;
  }

  public deleteExpired() {
    const expiredKeys = this.getExpired();
    expiredKeys.forEach(key => this.delete(key));
  }
}
