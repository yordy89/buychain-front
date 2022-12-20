import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatMenuModule } from '@angular/material/menu';
import { RouterModule } from '@angular/router';
import { marketRoutes } from '@views/main/market/market.routing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MarketOverviewComponent } from './market-overview/market-overview.component';
import { PipesModule } from '@pipes/pipes.module';
import { BookmarkModule } from '@views/main/common/bookmark/bookmark.module';
import { MarketSearchModule } from '@views/main/common/market-search/market-search.module';
import { AddTallyUnitModalModule } from '@views/main/common/modals/add-tally-unit-modal/add-tally-unit-modal.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    MatMenuModule,
    PipesModule,
    ReactiveFormsModule,
    BookmarkModule,
    MarketSearchModule,
    AddTallyUnitModalModule,
    RouterModule.forChild(marketRoutes)
  ],
  declarations: [MarketOverviewComponent],
  exports: [MarketOverviewComponent]
})
export class MarketModule {}
