import { TestBed, getTestBed } from '@angular/core/testing';
import { CacheService } from './cache.service';

describe('CacheService', () => {
  let injector: TestBed;
  let service: CacheService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CacheService],
    });

    injector = getTestBed();
    service = injector.get(CacheService);
  });


  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should be empty', () => {
    const count = service.count();

    expect(count).toEqual(0);
  });

  it('should return null', () => {
    const data = service.get('non-existing-key');

    expect(data).toBeNull();
  });

  it('should store an item', () => {
    const key = 'key1';
    const value = { prop1: 'testItem', prop2: 1 };

    service.put(key, value);

    const count = service.count();

    expect(count).toEqual(1);
  });

  it('should return stored item by key', () => {
    const key = 'key1';
    const dataToCached = { prop1: 'testItem', prop2: 1 };
    service.put(key, dataToCached);

    const storedData = service.get(key);

    expect(storedData).toEqual(dataToCached);
  });

  it('should purge storage', () => {
    const key1 = 'key1';
    const data1 = { prop1: 'testItem1', prop2: 1 };
    service.put(key1, data1);

    const key2 = 'key1';
    const data2 = { prop1: 'testItem2', prop2: 2 };
    service.put(key2, data2);

    service.purge();

    const count = service.count();

    expect(count).toEqual(0);
  });

  it('should remove the item', () => {
    const key1 = 'key1';
    const data1 = { prop1: 'testItem1', prop2: 1 };
    service.put(key1, data1);

    service.delete(key1);

    const count = service.count();

    expect(count).toEqual(0);
  });

  it('should expire', () => {
    const key1 = 'key1';
    const data1 = { prop1: 'testItem1', prop2: 1 };
    service.put(key1, data1);

    service.markAsExpired(key1);
    const expired = service.getExpired();

    expect(expired.length).toEqual(1);
  });

  it('should delete expired', () => {
    const key1 = 'key1';
    const data1 = { prop1: 'testItem1', prop2: 1 };
    service.put(key1, data1);
    service.markAsExpired(key1);

    service.deleteExpired();
    const expired = service.getExpired();

    expect(expired.length).toEqual(0);
  });
});
