import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { InventorySearchEntity } from '@services/app-layer/entities/inventory-search';
import { InventorySearchHelperService } from '@views/main/common/inventory/inventory-search/inventory-search.helper.service';
import { ProductStateEnum } from '@services/app-layer/app-layer.enums';
import { first } from 'rxjs/operators';
import { TransformHelper } from '@services/helpers/utils/transform-helper';
import { MemberEntity } from '@services/app-layer/entities/member';

@Component({
  selector: 'app-select-product-lot-modal',
  templateUrl: './select-product-lot-modal.component.html'
})
export class SelectProductLotModalComponent implements OnInit {
  public targetLots: any[] = [];
  public selectProductLotControl = new FormControl(null, [Validators.required]);

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { productLot: InventorySearchEntity; membersList: MemberEntity[] },
    private dialogRef: MatDialogRef<SelectProductLotModalComponent>,
    private inventorySearchHelperService: InventorySearchHelperService
  ) {}

  ngOnInit() {
    this.searchTargetLots();
  }

  searchTargetLots(): void {
    this.inventorySearchHelperService
      .loadInventoryLotsByFilters(this.getSearchFilter())
      .pipe(first())
      .subscribe(lots => {
        this.targetLots = lots.map(lot => {
          const sampleProduct = lot.sampleProduct;
          const owner = this.data.membersList.find(m => m.id === sampleProduct.owner);
          lot.displayValue = `${TransformHelper.getShortHexGuid(sampleProduct.lot)} - ${
            owner ? owner.name + ' - ' : ''
          }${sampleProduct.permission} - ${sampleProduct.salesData.priceOfMerit}`;
          return lot;
        });
      });
  }

  submit() {
    if (!this.selectProductLotControl.valid) return;
    this.dialogRef.close(this.selectProductLotControl.value);
  }

  onClose() {
    this.dialogRef.close();
  }

  private getSearchFilter(): any {
    const payloadFilters = { children: { logicalOperator: 'and', items: [] } };

    // exclude already selected lots to load less
    const idsPayload = { value: { comparisonOperator: 'ne', field: 'lot', fieldValue: this.data.productLot.lotId } };
    payloadFilters.children.items.push(idsPayload);

    const specShorthand = {
      value: { field: 'specShorthand', comparisonOperator: 'cn', fieldValue: this.data.productLot.specShorthand }
    };
    payloadFilters.children.items.push(specShorthand);

    const shipFrom = {
      value: { field: 'shipFrom', comparisonOperator: 'eq', fieldValue: this.data.productLot.shipFromId }
    };
    payloadFilters.children.items.push(shipFrom);

    const hasActiveProducts = {
      children: {
        logicalOperator: 'or',
        items: [
          { value: { field: 'state', comparisonOperator: 'eq', fieldValue: ProductStateEnum.ON_HAND } },
          { value: { field: 'state', comparisonOperator: 'eq', fieldValue: ProductStateEnum.ON_ORDER } },
          { value: { field: 'state', comparisonOperator: 'eq', fieldValue: ProductStateEnum.IN_TRANSIT } }
        ]
      }
    };
    payloadFilters.children.items.push(hasActiveProducts);

    return {
      filters: payloadFilters,
      fields: ['lot', 'permission', 'salesData', 'owner']
    };
  }
}
