import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { Observable, of, Subject } from 'rxjs';
import { finalize, first, map, mergeMap, takeUntil, tap } from 'rxjs/operators';
import { FormControl } from '@angular/forms';
import { InventorySearchHelperService } from '@views/main/common/inventory/inventory-search/inventory-search.helper.service';
import { SearchService } from '@services/app-layer/search/search.service';
import { TransactionEntity } from '@services/app-layer/entities/transaction';
import { InventoryStreamlineHelperService } from '@views/main/common/inventory/inventory-streamline/inventory-streamline.helper.service';

export enum PageType {
  Inventory,
  Orders,
  Streamline
}

@Component({
  selector: 'app-load-all-units',
  templateUrl: './load-all-units.component.html',
  styleUrls: ['./load-all-units.component.scss']
})
export class LoadAllUnitsComponent implements OnInit, OnDestroy {
  @Input() unitsIds: string[];
  @Input() totalCount: number; // Streamline case
  @Input() offset: number;
  @Input() limit: number;
  @Input() type: PageType;
  @Input() viewState: any;
  @Input() fixedFilters: any;
  @Input() shipToLocationControl: FormControl;
  @Output() completeData = new EventEmitter<any>();
  @Output() setIsLoadingAll = new EventEmitter<any>();

  PageType = PageType;

  loadedUnits: any[] = [];
  loadedChunksCount = 0;
  isLoading = false;
  completed = false;

  allChunksCount = 0;

  private destroy$ = new Subject<void>();

  constructor(
    private inventorySearchHelperService: InventorySearchHelperService,
    private inventoryStreamlineHelperService: InventoryStreamlineHelperService,
    private searchService: SearchService
  ) {}

  ngOnInit(): void {
    this.allChunksCount = Math.ceil(this.totalUnitsCount / this.limit);
  }

  ngOnDestroy(): void {
    this.setIsLoadingAll.emit(false);
    this.destroy$.next();
    this.destroy$.unsubscribe();
  }

  public loadAllRemaining(): void {
    const requests = this.getRequestsArray();
    this.isLoading = true;
    this.setIsLoadingAll.emit(true);
    this.getMergedRequest(requests, [])
      .pipe(
        first(),
        finalize(() => {
          this.setIsLoadingAll.emit(false);
          this.isLoading = false;
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(responses => {
        this.loadedUnits = responses;
        this.completeData.emit(this.loadedUnits);
        this.completed = true;
      });
  }

  private getMergedRequest(requests: Observable<any>[], data: any[]): Observable<any> {
    if (!requests?.length) return of([]);
    return requests[0].pipe(
      mergeMap((chunk: any[]) => {
        requests.shift();
        return requests.length ? this.getMergedRequest(requests, data.concat(chunk)) : of(data.concat(chunk));
      })
    );
  }

  private getRequestsArray(): Observable<any>[] {
    const payloads = this.getPayloadsArray();
    return payloads
      .map(p => {
        switch (this.type) {
          case PageType.Inventory:
            return this.inventorySearchHelperService.loadInventoryLots(p, this.shipToLocationControl.value, true);
          case PageType.Orders:
            return this.searchService
              .fetchTransactionsByIds(p, true)
              .pipe(map(txs => txs.map(t => new TransactionEntity().init(t))));
          case PageType.Streamline:
            return this.inventoryStreamlineHelperService.loadInventoryProducts(p, true);
        }
      })
      .map(request => request.pipe(tap(() => this.loadedChunksCount++)));
  }

  private getPayloadsArray(): any[] {
    const chunksCount = (this.totalUnitsCount - this.offset) / this.limit;

    const payloads = [];
    for (let i = 0; i < chunksCount; i++) {
      const start = this.offset + i * this.limit;
      const end = i + 1 === chunksCount ? this.totalUnitsCount : start + this.limit;
      const chunkIds = this.unitsIds ? this.unitsIds.slice(start, end) : [];

      let payload;
      switch (this.type) {
        case PageType.Inventory:
          payload = this.inventorySearchHelperService.getSearchPayload(
            this.viewState.filters,
            this.fixedFilters,
            chunkIds
          );
          break;
        case PageType.Orders:
          payload = chunkIds;
          break;
        case PageType.Streamline:
          payload = {
            ...this.inventoryStreamlineHelperService.getSearchPayload(this.viewState),
            offset: start,
            limit: this.limit
          };
      }
      payloads.push(payload);
    }
    return payloads;
  }

  get totalUnitsCount(): number {
    return this.unitsIds?.length || this.totalCount;
  }
}
