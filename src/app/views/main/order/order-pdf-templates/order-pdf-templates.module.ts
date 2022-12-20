import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PipesModule } from '@app/pipes/pipes.module';

import { BillOfLadingComponent } from './bill-of-lading/bill-of-lading.component';
import { PickSheetComponent } from './pick-sheet/pick-sheet.component';
import { InvoiceComponent } from './invoice/invoice.component';
import { OrderConfirmationComponent } from './order-confirmation/order-confirmation.component';

import { AddressComponent } from './common/address/address.component';
import { BalanceBoxComponent } from './common/balance-box/balance-box.component';
import { CompanyInfoComponent } from './common/company-info/company-info.component';
import { HeaderWithNumberComponent } from './common/header-with-number/header-with-number.component';
import { LabelValueComponent } from './common/label-value/label-value.component';
import { LoadingPersonnelTableComponent } from './common/loading-personnel-table/loading-personnel-table.component';

@NgModule({
  declarations: [
    OrderConfirmationComponent,
    InvoiceComponent,
    PickSheetComponent,
    BillOfLadingComponent,

    CompanyInfoComponent,
    HeaderWithNumberComponent,
    AddressComponent,
    LabelValueComponent,
    BalanceBoxComponent,
    LoadingPersonnelTableComponent
  ],
  imports: [CommonModule, PipesModule],
  exports: [OrderConfirmationComponent, InvoiceComponent, PickSheetComponent, BillOfLadingComponent]
})
export class OrderPdfTemplatesModule {}
