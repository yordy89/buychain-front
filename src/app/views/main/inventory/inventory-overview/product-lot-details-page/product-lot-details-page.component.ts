import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NavigationHelperService } from '@services/helpers/navigation-helper/navigation-helper.service';
import { InventorySearchHelperService } from '@views/main/common/inventory/inventory-search/inventory-search.helper.service';
import { ProductLotDetailsComponent } from '@views/main/common/product-lot-details/product-lot-details.component';
import { Subject } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-product-lot-details-page',
  templateUrl: './product-lot-details-page.component.html',
  styleUrls: ['./product-lot-details-page.component.css']
})
export class ProductLotDetailsPageComponent implements OnInit, OnDestroy {
  @ViewChild(ProductLotDetailsComponent) productLotDetails: ProductLotDetailsComponent;

  lotId: string;

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private navigationHelperService: NavigationHelperService,
    private inventorySearchHelperService: InventorySearchHelperService
  ) {}

  ngOnInit(): void {
    this.lotId = this.route.snapshot.params.lotId;
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  backToInventory(): void {
    if (this.productLotDetails.isChanged && this.inventorySearchHelperService.latestFilters) {
      this.inventorySearchHelperService
        .loadInventoryLots(
          this.inventorySearchHelperService.getSearchPayload(
            this.inventorySearchHelperService.latestFilters.filters,
            null,
            [this.lotId]
          )
        )
        .pipe(
          map(lots => (lots.length ? lots[0] : null)),
          takeUntil(this.destroy$)
        )
        .subscribe(lot => {
          let cachedLots = this.inventorySearchHelperService.getLoadedLotsByFilters();

          if (lot) {
            cachedLots = cachedLots.map(item => (item.lotId === this.lotId ? lot : item));
          } else {
            cachedLots = cachedLots.filter(item => item.lotId !== this.lotId);
          }

          this.inventorySearchHelperService.updateLoadedLots(cachedLots);
          this.navigationHelperService.navigateToInventoryMasterView();
        });
    } else this.navigationHelperService.navigateToInventoryMasterView();
  }
}
